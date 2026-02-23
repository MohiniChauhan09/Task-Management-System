import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responses.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, 401, "Authentication required");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, email: payload.email };
    return next();
  } catch {
    return errorResponse(res, 401, "Invalid or expired token");
  }
};
