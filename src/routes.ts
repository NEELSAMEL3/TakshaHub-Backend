import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";

const router = Router();

// Mount auth routes under /auth
router.use("/auth", authRoutes);

export default router;
