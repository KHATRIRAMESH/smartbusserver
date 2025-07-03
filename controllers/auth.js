import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { parentTable } from "../database/Parent.js";

// Example: Only allow school_admin and super_admin login for now
export const auth = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    throw new BadRequestError("Email, password, and role are required");
  }

  let user;
  let table;
  if (role === "school_admin") {
    table = schoolAdminTable;
  } else if (role === "super_admin") {
    table = superAdminTable;
  } else {
    throw new BadRequestError("Invalid role");
  }

  user = await db
    .select()
    .from(table)
    .where(eq(table.email, email))
    .limit(1);

  if (user.length === 0) {
    throw new UnauthenticatedError("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password);
  if (!isPasswordValid) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const payload = {
    id: user[0].id,
    email: user[0].email,
    role,
  };
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });

  res.status(StatusCodes.OK).json({
    message: "Login successful",
    user: { ...user[0], password: undefined },
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    console.log('Refreshing token for:', refresh_token.substring(0, 20) + '...');
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    console.log('Token payload:', payload);
    const { id, role } = payload;
    let user;
    if (role === "school_admin") {
      user = await db
        .select()
        .from(schoolAdminTable)
        .where(eq(schoolAdminTable.id, id))
        .limit(1);
    } else if (role === "super_admin") {
      user = await db
        .select()
        .from(superAdminTable)
        .where(eq(superAdminTable.id, id))
        .limit(1);
    } else if (role === "parent") {
      user = await db
        .select()
        .from(parentTable)
        .where(eq(parentTable.id, id))
        .limit(1);
    } else {
      console.log('Invalid role in token:', role);
      throw new UnauthenticatedError("Invalid refresh token");
    }

    if (user.length === 0) {
      console.log('User not found for ID:', id);
      throw new UnauthenticatedError("Invalid refresh token");
    }

    console.log('User found:', user[0].email);

    const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    });

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id, role } = req.user; // From auth middleware

  if (!currentPassword || !newPassword) {
    throw new BadRequestError("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError("New password must be at least 6 characters long");
  }

  try {
    let user;
    let tableToUpdate;
    
    if (role === "school_admin") {
      // For school admins
      user = await db
        .select()
        .from(schoolAdminTable)
        .where(eq(schoolAdminTable.id, id))
        .limit(1);
      tableToUpdate = schoolAdminTable;
    } else if (role === "super_admin") {
      // For super admins
      user = await db
        .select()
        .from(superAdminTable)
        .where(eq(superAdminTable.id, id))
        .limit(1);
      tableToUpdate = superAdminTable;
    } else {
      throw new BadRequestError("Invalid user role for password change");
    }

    if (user.length === 0) {
      throw new UnauthenticatedError("User not found");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user[0].password);
    if (!isPasswordValid) {
      throw new UnauthenticatedError("Current password is incorrect");
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db
      .update(tableToUpdate)
      .set({ password: hashedNewPassword })
      .where(eq(tableToUpdate.id, id));

    res.status(StatusCodes.OK).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};

export const getMe = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const { id, role } = payload;

    let user;
    
    if (role === "school_admin") {
      user = await db
        .select()
        .from(schoolAdminTable)
        .where(eq(schoolAdminTable.id, id))
        .limit(1);
    } else if (role === "super_admin") {
      user = await db
        .select()
        .from(superAdminTable)
        .where(eq(superAdminTable.id, id))
        .limit(1);
    } else if (role === "parent") {
      user = await db
        .select()
        .from(parentTable)
        .where(eq(parentTable.id, id))
        .limit(1);
    } else {
      throw new BadRequestError("Invalid user role");
    }

    if (user.length === 0) {
      throw new UnauthenticatedError("User not found");
    }

    // Remove password from response and add role from JWT token
    const { password, ...userWithoutPassword } = user[0];
    res.status(StatusCodes.OK).json({
      user: { ...userWithoutPassword, role },
    });
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};
