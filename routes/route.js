import express from "express";
import { signup, login } from "../controllers/user.controller.js";
import { originalUrl } from "../controllers/originalUrl.controller.js";
import { auth } from "../middleware/middleware.js";
import {
  redirectingToOriginalUrl,
  getMyUrls,
  deleteMyUrls,
  updateMyShortUrlCode,
  showAnalytics,
} from "../controllers/shortenUrl.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/urls", auth, originalUrl);
router.get("/urls", auth, getMyUrls);
// router.get("/urls/:code", redirectingToOriginalUrl);

router.delete("/urls/:shortenedUrlId", auth, deleteMyUrls);
router.patch("/urls/:shortenedUrlId", auth, updateMyShortUrlCode);

router.get("/urls/:id/analytics", showAnalytics);

export default router;
