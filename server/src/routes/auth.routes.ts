import { Router } from "express";
import {
  register,
  login,
  refresh,
  me,
  logout,
  updateMe,
  getProfileStats,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me); // authenticate runs first, then me
router.patch("/me", authenticate, updateMe);
router.get("/stats", authenticate, getProfileStats);

export default router;
