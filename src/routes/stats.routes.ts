import { Router } from "express";
import { adminStats, userStats } from "../controller/stats.controller";


const router = Router();

// user stats
router.get("/user-stats/:email", userStats);

// admin stats
router.get("/admin-stats", adminStats);

export default router;