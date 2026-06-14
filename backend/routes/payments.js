const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');

// Create Payment Intent
router.post('/create-payment-intent', auth, async (req, res) => {
    const { amount, currency = 'usd', orderId } = req.body;
    const pool = req.pool;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            metadata: { orderId }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Verify Payment
router.post('/verify', auth, async (req, res) => {
    const { paymentIntentId } = req.body;
    const pool = req.pool;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Update order status
            const connection = await pool.getConnection();
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['completed', paymentIntent.metadata.orderId]
            );
            connection.release();

            res.json({ success: true, message: 'Payment verified' });
        } else {
            res.status(400).json({ error: 'Payment not completed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
