import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { schoolAdminTable } from "../database/SchoolAdmin.js";
import { superAdminTable } from "../database/SuperAdmin.js";
import { parentTable } from "../database/Parent.js";
import { AuthService } from "../services/auth.service.js";

// Example: Only allow school_admin and super_admin login for now
export const auth = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const result = await AuthService.loginUser(email, password, role);
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Login error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const result = await AuthService.refreshUserToken(refresh_token);
    res.status(StatusCodes.OK).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Token refresh error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;
    await AuthService.changePassword(id, currentPassword, newPassword, role);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Password change error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};

export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer")) {
      throw new UnauthenticatedError("Authentication invalid");
    }
    
    const token = authHeader.split(" ")[1];
    const payload = await AuthService.verifyToken(token, process.env.ACCESS_TOKEN_SECRET);
    const result = await AuthService.getUserProfile(payload.id, payload.role);
    
    res.status(StatusCodes.OK).json({
      success: true,
      user: result,
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError || error instanceof BadRequestError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error("Get profile error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
};
