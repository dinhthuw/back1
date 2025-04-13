const express = require('express');
const { 
  createAOrder, 
  getOrderByEmail, 
  getAllOrders, 
  getOrderById,
  updateOrderStatus, 
  updatePaymentStatus,
  deleteOrder 
} = require('./order.controller');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// create order endpoint (require authentication)
router.post("/", verifyToken, createAOrder);

// get orders by user email 
router.get("/email/:email", verifyToken, getOrderByEmail);

// get all orders (admin only)
router.get("/", verifyToken, getAllOrders);

// get order by id
router.get("/:id", verifyToken, getOrderById);

// update order status (admin only)
router.put("/:id/status", verifyToken, updateOrderStatus);

// update payment status (admin only)
router.put("/:id/payment", verifyToken, updatePaymentStatus);

// delete order (admin only)
router.delete("/:id", verifyToken, deleteOrder);

module.exports = router;
