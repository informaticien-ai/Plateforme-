const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Get Featured Products
router.get('/featured', async (req, res) => {
    const pool = req.pool;
    try {
        const connection = await pool.getConnection();
        const [products] = await connection.query(`
            SELECT p.id, p.name, p.price, p.image, p.discount,
                   COALESCE(AVG(r.rating), 0) as rating,
                   COUNT(r.id) as reviewCount
            FROM products p
            LEFT JOIN reviews r ON p.id = r.productId
            WHERE p.isActive = true
            GROUP BY p.id
            ORDER BY p.createdAt DESC
            LIMIT 12
        `);
        connection.release();
        res.json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Product Details
router.get('/:id', async (req, res) => {
    const pool = req.pool;
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        const [products] = await connection.query(
            `SELECT p.*, v.shopName as vendor, COALESCE(AVG(r.rating), 0) as rating
             FROM products p
             LEFT JOIN vendors v ON p.vendorId = v.id
             LEFT JOIN reviews r ON p.id = r.productId
             WHERE p.id = ?`,
            [id]
        );
        connection.release();

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(products[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search Products
router.get('/search', async (req, res) => {
    const pool = req.pool;
    const { q, category, sort } = req.query;

    try {
        const connection = await pool.getConnection();
        let query = 'SELECT * FROM products WHERE isActive = true';
        const params = [];

        if (q) {
            query += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (sort === 'price-low') {
            query += ' ORDER BY price ASC';
        } else if (sort === 'price-high') {
            query += ' ORDER BY price DESC';
        } else {
            query += ' ORDER BY createdAt DESC';
        }

        const [products] = await connection.query(query, params);
        connection.release();

        res.json({ products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
