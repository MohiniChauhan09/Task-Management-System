import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { errorResponse } from "../utils/responses.js";

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

const RESET_TOKEN_EXPIRES_MINUTES = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 15);
const SHOW_RESET_TOKEN_FOR_DEMO = process.env.SHOW_RESET_TOKEN_FOR_DEMO === "true";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return errorResponse(res, 400, "Name, email, and password are required");
  }

  if (password.length < 6) {
    return errorResponse(res, 400, "Password must be at least 6 characters");
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return errorResponse(res, 409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to register user");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, 400, "Email and password are required");
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const dbUser = result.rows[0];
    const isValid = await bcrypt.compare(password, dbUser.password_hash);

    if (!isValid) {
      return errorResponse(res, 401, "Invalid credentials");
    }

    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      created_at: dbUser.created_at
    };

    const token = generateToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to login");
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return errorResponse(res, 400, "Email is required");
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);

    if (userResult.rows.length === 0) {
      return errorResponse(res, 404, "Email does not exist");
    }

    const userId = userResult.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    const response = { message: "Reset token generated successfully." };
    if (SHOW_RESET_TOKEN_FOR_DEMO) {
      response.resetToken = resetToken;
      response.expiresInMinutes = RESET_TOKEN_EXPIRES_MINUTES;
    }

    return res.json(response);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to process forgot password request");
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return errorResponse(res, 400, "Token and new password are required");
  }

  if (newPassword.length < 6) {
    return errorResponse(res, 400, "New password must be at least 6 characters");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 400, "Invalid or expired reset token");
    }

    const tokenRow = tokenResult.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hashedPassword,
      tokenRow.user_id
    ]);

    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [tokenRow.id]);

    await client.query("COMMIT");
    return res.json({ message: "Password reset successful. You can login with your new password." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return errorResponse(res, 500, "Failed to reset password");
  } finally {
    client.release();
  }
};
