import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import db from "../config/connect.js";
import { userTable } from "../database/User.js";
import NotFoundError from "../errors/not-found.js";
import UnauthenticatedError from "../errors/unauthenticated.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = { id: payload.id, phone: payload.phone };
    req.socket = req.io;

    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, payload.id))
      .limit(1);

    if (user.length === 0) {
      throw new NotFoundError("User not found");
    }

    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export default auth;

export const verifySuperAdmin = (req, res, next) => {
  // Check for token in Authorization header first
  let token = req.headers.authorization?.split(" ")[1];
  
  // If no token in header, check for cookie
  if (!token) {
    token = req.cookies?.access_token;
  }
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.role !== "super_admin") {
      return res.status(403).json({ message: "Forbidden: Not a superadmin" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
