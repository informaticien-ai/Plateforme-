const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Send Message
router.post('/send', auth, async (req, res) => {
    const { recipientId, content } = req.body;
    const pool = req.pool;
    const senderId = req.userId;
    const io = req.io;

    try {
        const connection = await pool.getConnection();
        
        const [result] = await connection.query(
            `INSERT INTO messages (senderId, recipientId, content, createdAt)
             VALUES (?, ?, ?, NOW())`,
            [senderId, recipientId, content]
        );

        connection.release();

        // Emit real-time notification
        io.to(`user-${recipientId}`).emit('new-message', {
            messageId: result.insertId,
            senderId,
            content
        });

        res.json({ messageId: result.insertId, message: 'Message sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Messages
router.get('/:userId', auth, async (req, res) => {
    const pool = req.pool;
    const { userId } = req.params;
    const currentUserId = req.userId;

    try {
        const connection = await pool.getConnection();
        const [messages] = await connection.query(
            `SELECT * FROM messages
             WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
             ORDER BY createdAt ASC`,
            [currentUserId, userId, userId, currentUserId]
        );
        connection.release();

        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
