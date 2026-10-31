const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        message: "Too many items in one order",
      });
    }

    const requiredFields = ["fullName", "phone", "address", "city"];

    if (
      !shippingAddress ||
      typeof shippingAddress !== "object" ||
      requiredFields.some(
        (field) =>
          typeof shippingAddress[field] !== "string" ||
          !shippingAddress[field].trim()
      )
    ) {
      return res.status(400).json({
        message: "Complete shipping information is required",
      });
    }

    const productIds = new Set();

    for (const item of items) {
      if (
        !item ||
        !mongoose.isValidObjectId(item.product) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 100
      ) {
        return res.status(400).json({
          message: "Invalid order item",
        });
      }

      if (productIds.has(String(item.product))) {
        return res.status(400).json({
          message: "Duplicate products are not allowed",
        });
      }

      productIds.add(String(item.product));
    }

    // MongoDB transaction prevents partial stock updates.
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
          const product = await Product.findOneAndUpdate(
            {
              _id: item.product,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity },
            },
            {
              new: false,
              session,
            }
          );

          if (!product) {
            const error = new Error(
              "A product is unavailable or has insufficient stock"
            );
            error.statusCode = 409;
            throw error;
          }

          orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
          });

          totalAmount += product.price * item.quantity;
        }

        const created = await Order.create(
          [
            {
              user: req.user._id,
              items: orderItems,
              shippingAddress: {
                fullName: shippingAddress.fullName.trim(),
                phone: shippingAddress.phone.trim(),
                address: shippingAddress.address.trim(),
                city: shippingAddress.city.trim(),
                postalCode:
                  typeof shippingAddress.postalCode === "string"
                    ? shippingAddress.postalCode.trim()
                    : "",
              },
              paymentMethod: "COD",
              totalAmount: Math.round(totalAmount * 100) / 100,
            },
          ],
          { session }
        );

        order = created[0];
      });
    } finally {
      await session.endSession();
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error.message);

    return res.status(error.statusCode || 500).json({
      message:
        error.statusCode === 409
          ? error.message
          : "Failed to place order",
    });
  }
};

// CUSTOMER ORDER HISTORY
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your orders",
    });
  }
};

// GET ONE ORDER
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const isOwner =
      String(order.user) === String(req.user._id);

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order",
    });
  }
};

// ADMIN: GET ALL ORDERS
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

// ADMIN: UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};

    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (
      ["delivered", "cancelled"].includes(order.status) &&
      order.status !== status
    ) {
      return res.status(409).json({
        message: "This order is already finalized",
      });
    }

    if (status === "cancelled" && order.status !== "cancelled") {
      // Return reserved stock when cancelling an order.
      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          const currentOrder = await Order.findOneAndUpdate(
            {
              _id: order._id,
              status: { $nin: ["cancelled", "delivered"] },
            },
            { $set: { status: "cancelled" } },
            { new: true, session }
          );

          if (!currentOrder) {
            const error = new Error("Order already finalized");
            error.statusCode = 409;
            throw error;
          }

          for (const item of currentOrder.items) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        });
      } finally {
        await session.endSession();
      }

      const updatedOrder = await Order.findById(order._id);

      return res.status(200).json({
        message: "Order cancelled and stock restored",
        order: updatedOrder,
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error.message);

    res.status(error.statusCode || 500).json({
      message:
        error.statusCode === 409
          ? error.message
          : "Failed to update order status",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};