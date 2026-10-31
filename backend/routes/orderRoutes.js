const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/my", protect, getMyOrders);

router.get("/", protect, adminOnly, getAllOrders);

router.get("/:id", protect, getOrderById);

router.patch("/:id/status", protect, adminOnly, updateOrderStatus);

module.exports = router;