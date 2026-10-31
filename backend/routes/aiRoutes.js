
const express = require("express");

const router = express.Router();

const {
  generateDescription,
} = require("../controllers/geminiController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.post(
  "/generate-description",
  protect,
  adminOnly,
  generateDescription
);

module.exports = router;
