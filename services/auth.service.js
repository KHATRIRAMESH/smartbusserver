import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { parentTable } from "../database/Parent.js";
import { driverTable } from "../database/Driver.js";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";

export class AuthService {
  static async generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });
    return { accessToken, refreshToken };
  }

  static async verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new UnauthenticatedError("Invalid token");
    }
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  static async comparePasswords(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  static async loginUser(email, password, role) {
    if (!email || !password || !role) {
      throw new BadRequestError("Email, password, and role are required");
    }

    let table;
    let additionalFields = {};

    switch (role) {
      case "parent":
        table = parentTable;
        break;
      case "driver":
        table = driverTable;
        break;
      case "school_admin":
        table = schoolAdminTable;
        additionalFields = {
          name: table.name,
          schoolId: table.schoolId,
          contactNumber: table.contactNumber,
          address: table.address,
          isVerified: table.isVerified,
          lastLogin: table.lastLogin,
        };
        break;
      case "super_admin":
        table = superAdminTable;
        additionalFields = {
          name: table.name,
          permissions: table.permissions,
          lastLogin: table.lastLogin,
        };
        break;
      default:
        throw new BadRequestError("Invalid role");
    }

    try {
      const user = await db
        .select({
          id: table.id,
          email: table.email,
          password: table.password,
          isActive: table.isActive,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          ...additionalFields,
        })
        .from(table)
        .where(eq(table.email, email))
        .limit(1);

      if (user.length === 0) {
        throw new UnauthenticatedError("Invalid credentials");
      }

      const isPasswordValid = await this.comparePasswords(password, user[0].password);
      if (!isPasswordValid) {
        throw new UnauthenticatedError("Invalid credentials");
      }

      if (!user[0].isActive) {
        throw new UnauthenticatedError("Account is inactive");
      }

      // Additional validation for school admin
      if (role === "school_admin" && !user[0].isVerified) {
        throw new UnauthenticatedError("Account is pending verification");
      }

      const payload = {
        id: user[0].id,
        email: user[0].email,
        role,
      };

      // Add role-specific data to payload
      if (role === "school_admin") {
        payload.schoolId = user[0].schoolId;
        payload.isVerified = user[0].isVerified;
      } else if (role === "super_admin") {
        payload.permissions = user[0].permissions;
      }

      const { accessToken, refreshToken } = await this.generateTokens(payload);
      const { password: _, ...userWithoutPassword } = user[0];

      // Update last login time for admins
      if (role === "school_admin" || role === "super_admin") {
        await db
          .update(table)
          .set({ lastLogin: new Date() })
          .where(eq(table.id, user[0].id));
      }

      return {
        user: userWithoutPassword,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
        throw error;
      }
      console.error("Login error:", error);
      throw new Error("Internal server error");
    }
  }

  static async refreshUserToken(refreshToken) {
    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    try {
      const payload = await this.verifyToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokens(payload);

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
        throw error;
      }
      console.error("Token refresh error:", error);
      throw new Error("Internal server error");
    }
  }

  static async changePassword(userId, currentPassword, newPassword, role) {
    if (!currentPassword || !newPassword) {
      throw new BadRequestError("Current password and new password are required");
    }

    if (newPassword.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters long");
    }

    let table;
    switch (role) {
      case "parent":
        table = parentTable;
        break;
      case "driver":
        table = driverTable;
        break;
      case "school_admin":
        table = schoolAdminTable;
        break;
      case "super_admin":
        table = superAdminTable;
        break;
      default:
        throw new BadRequestError("Invalid role");
    }

    try {
      const user = await db
        .select()
        .from(table)
        .where(eq(table.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new UnauthenticatedError("User not found");
      }

      const isPasswordValid = await this.comparePasswords(currentPassword, user[0].password);
      if (!isPasswordValid) {
        throw new UnauthenticatedError("Current password is incorrect");
      }

      const hashedNewPassword = await this.hashPassword(newPassword);
      await db
        .update(table)
        .set({ password: hashedNewPassword })
        .where(eq(table.id, userId));

      return true;
    } catch (error) {
      if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
        throw error;
      }
      console.error("Password change error:", error);
      throw new Error("Internal server error");
    }
  }

  static async getUserProfile(userId, role) {
    let table;
    let additionalFields = {};

    switch (role) {
      case "parent":
        table = parentTable;
        break;
      case "driver":
        table = driverTable;
        break;
      case "school_admin":
        table = schoolAdminTable;
        additionalFields = {
          name: table.name,
          schoolId: table.schoolId,
          contactNumber: table.contactNumber,
          address: table.address,
          isVerified: table.isVerified,
          lastLogin: table.lastLogin,
        };
        break;
      case "super_admin":
        table = superAdminTable;
        additionalFields = {
          name: table.name,
          permissions: table.permissions,
          lastLogin: table.lastLogin,
        };
        break;
      default:
        throw new BadRequestError("Invalid role");
    }

    try {
      const user = await db
        .select({
          id: table.id,
          email: table.email,
          isActive: table.isActive,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          ...additionalFields,
        })
        .from(table)
        .where(eq(table.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw new UnauthenticatedError("User not found");
      }

      // Add role to the response
      return {
        ...user[0],
        role,
      };
    } catch (error) {
      if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
        throw error;
      }
      console.error("Get profile error:", error);
      throw new Error("Internal server error");
    }
  }
} 