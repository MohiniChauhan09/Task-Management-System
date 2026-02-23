import { Router } from "express";
import {
  completeTask,
  createTask,
  deleteTask,
  getTasks
} from "../controllers/taskController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", completeTask);
router.delete("/:id", deleteTask);

export default router;
