import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { userTable, createAccessToken, createRefreshToken } from "../database/User.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";

export const auth = async (req, res) => {
  const { phone, role } = req.body;
  console.log("Auth request received:", { phone, role });

  if (!phone) {
    throw new BadRequestError("Phone number is required");
  }

  if (!role || !["user", "driver"].includes(role)) {
    throw new BadRequestError("Valid role is required (user or driver)");
  }

  try {
    let user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.phone, phone))
      .limit(1);

    if (user.length > 0) {
      if (user[0].role !== role) {
        throw new BadRequestError("Phone number and role do not match");
      }

      const accessToken = createAccessToken(user[0]);
      const refreshToken = createRefreshToken(user[0]);

      return res.status(StatusCodes.OK).json({
        message: "User logged in successfully",
        user: user[0],
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    const newUser = await db
      .insert(userTable)
      .values({
        phone,
        role,
      })
      .returning();

    const accessToken = createAccessToken(newUser[0]);
    const refreshToken = createRefreshToken(newUser[0]);

    res.status(StatusCodes.CREATED).json({
      message: "User created successfully",
      user: newUser[0],
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, payload.id))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = createAccessToken(user[0]);
    const newRefreshToken = createRefreshToken(user[0]);

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};
