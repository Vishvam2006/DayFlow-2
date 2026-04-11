import express from "express";
import { getAnalytics } from "../controller/analyticsController.js";

const router = express.Router();

router.get("/", getAnalytics);

export default router;