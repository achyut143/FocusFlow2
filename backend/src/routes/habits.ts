import express, { Request, Response, Router } from 'express';
import { openDb } from '../index';

const router = Router();

// Create a new habit
router.post('/habits', async (req, res) => {
    const { taskName, done, procrastinated,weight,date } = req.body;
    try {
        const db = await openDb();
        const result = await db.run(`
            INSERT INTO habit (taskName, done, procrastinated,weight, date) 
            VALUES (?, ?, ?, ?, ?)`,
            [taskName, done, procrastinated,weight,date]
        );
        await db.close();
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create habit' });
    }
});

// Get all habits
router.get('/habits', async (req, res) => {
    try {
        const db = await openDb();
        const habits = await db.all('SELECT * FROM habit WHERE deletedAt IS NULL');
        await db.close();
        res.json(habits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch habits' });
    }
});

// Get habit by ID
router.get('/habits/:id', async (req, res) => {
    try {
        const db = await openDb();
        const habit = await db.get('SELECT * FROM habit WHERE id = ? AND deletedAt IS NULL', [req.params.id]);
        await db.close();
        if (habit) {
            res.json(habit);
        } else {
            res.status(404).json({ message: 'Habit not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch habit' });
    }
});

// Update a habit
router.put('/habits/:id', async (req, res) => {
    const { taskName, done, procrastinated, date } = req.body;
    try {
        const db = await openDb();
        await db.run(`
            UPDATE habit 
            SET taskName = ?, done = ?, procrastinated = ?, date = ?
            WHERE id = ? AND deletedAt IS NULL`,
            [taskName, done, procrastinated, date, req.params.id]
        );
        await db.close();
        res.json({ message: 'Habit updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update habit' });
    }
});

// Delete a habit (soft delete)
router.delete('/habits/:id', async (req, res) => {
    try {
        const db = await openDb();
        await db.run('UPDATE habit SET deletedAt = datetime("now") WHERE id = ?', [req.params.id]);
        await db.close();
        res.json({ message: 'Habit deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete habit' });
    }
});

export default router;
