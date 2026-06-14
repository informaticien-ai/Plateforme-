const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create Order
router.post('/', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;
    const { items, shippingAddress, paymentMethod } = req.body;

    try {
        const connection = await pool.getConnection();
        
        // Calculate total
        let total = 0;
        for (const item of items) {
            const [products] = await connection.query('SELECT price FROM products WHERE id = ?', [item.productId]);
            total += products[0].price * item.quantity;
        }

        // Create order
        const [result] = await connection.query(
            `INSERT INTO orders (userId, totalAmount, shippingAddress, paymentMethod, status, createdAt)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [userId, total, shippingAddress, paymentMethod, 'pending']
        );

        const orderId = result.insertId;

        // Add items to order
        for (const item of items) {
            await connection.query(
                'INSERT INTO orderItems (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.productId, item.quantity, item.price]
            );
        }

        connection.release();

        res.status(201).json({
            orderId,
            total,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get User Orders
router.get('/my-orders', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        const [orders] = await connection.query(
            `SELECT o.id, o.totalAmount as total, o.status, o.createdAt as date,
                    v.shopName as vendor, p.name as productName
             FROM orders o
             LEFT JOIN orderItems oi ON o.id = oi.orderId
             LEFT JOIN products p ON oi.productId = p.id
             LEFT JOIN vendors v ON p.vendorId = v.id
             WHERE o.userId = ?
             ORDER BY o.createdAt DESC`,
            [userId]
        );
        connection.release();

        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get All Orders (for vendor)
router.get('/', auth, async (req, res) => {
    const pool = req.pool;
    const userId = req.userId;

    try {
        const connection = await pool.getConnection();
        
        const [vendor] = await connection.query(
            'SELECT id FROM vendors WHERE userId = ?',
            [userId]
        );
        
        if (vendor.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Vendor not found' });
        }

        const [orders] = await connection.query(
            `SELECT o.id, u.firstName as clientName, COUNT(oi.id) as productCount,
                    o.totalAmount as total, o.status, o.createdAt as date
             FROM orders o
             JOIN users u ON o.userId = u.id
             JOIN orderItems oi ON o.id = oi.orderId
             JOIN products p ON oi.productId = p.id
             WHERE p.vendorId = ?
             GROUP BY o.id
             ORDER BY o.createdAt DESC`,
            [vendor[0].id]
        );

        connection.release();
        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
