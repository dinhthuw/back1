const mongoose = require('mongoose');
const express = require('express');
const Order = require('../orders/order.model');
const Book = require('../books/book.model');
const router = express.Router();


// Function to calculate admin stats
router.get("/", async (req, res) => {
    try {
        // 1. Total number of orders
        const totalOrders = await Order.countDocuments();

        // 2. Total sales (sum of all totalPrice from orders)
        const totalSales = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$totalPrice" },
                }
            }
        ]);

        // 3. Orders by payment method
        const ordersByPaymentMethod = await Order.aggregate([
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalPrice" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 4. Orders by status
        const ordersByStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 5. Orders by payment status
        const ordersByPaymentStatus = await Order.aggregate([
            {
                $group: {
                    _id: "$paymentStatus",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalPrice" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 6. Trending books statistics: 
        const trendingBooksCount = await Book.aggregate([
            { $match: { trending: true } },  // Match only trending books
            { $count: "trendingBooksCount" }  // Return the count of trending books
        ]);
        
        // If you want just the count as a number, you can extract it like this:
        const trendingBooks = trendingBooksCount.length > 0 ? trendingBooksCount[0].trendingBooksCount : 0;

        // 7. Total number of books
        const totalBooks = await Book.countDocuments();

        // 8. Monthly sales (group by month and sum total sales for each month)
        const monthlySales = await Order.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },  // Group by year and month
                    totalSales: { $sum: "$totalPrice" },  // Sum totalPrice for each month
                    totalOrders: { $sum: 1 }  // Count total orders for each month
                }
            },
            { $sort: { _id: 1 } }  
        ]);

        // 9. Recent orders
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'title price')
            .sort({ createdAt: -1 })
            .limit(10);

        // Result summary
        res.status(200).json({  
            totalOrders,
            totalSales: totalSales[0]?.totalSales || 0,
            ordersByPaymentMethod,
            ordersByStatus,
            ordersByPaymentStatus,
            trendingBooks,
            totalBooks,
            monthlySales,
            recentOrders
        });
      
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch admin stats" });
    }
})

module.exports = router;
