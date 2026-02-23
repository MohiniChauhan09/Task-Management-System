import { pool } from "../config/db.js";
import { STATUS } from "../utils/constants.js";
import { errorResponse } from "../utils/responses.js";

export const getTasks = async (req, res) => {
  const { status } = req.query;
  const userId = req.user.id;

  try {
    let query =
      "SELECT id, title, description, status, created_at FROM tasks WHERE user_id = $1";
    const values = [userId];

    if (status && [STATUS.PENDING, STATUS.COMPLETED].includes(status)) {
      query += " AND status = $2";
      values.push(status);
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to fetch tasks");
  }
};

export const createTask = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return errorResponse(res, 400, "Task title is required");
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, title, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, status, created_at`,
      [userId, title.trim(), description?.trim() || "", STATUS.PENDING]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to create task");
  }
};

export const completeTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, title, description, status, created_at`,
      [STATUS.COMPLETED, id, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Task not found");
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to update task");
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Task not found");
    }

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return errorResponse(res, 500, "Failed to delete task");
  }
};
