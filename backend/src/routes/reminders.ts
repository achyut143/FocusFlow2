// src/routes/reminders.ts
import express, { Request, Response, Router } from 'express';
import { openDb } from '../index';

const router = Router();

// Create a new reminder
router.post('/reminders', async (req: Request, res: Response) => {
    const { task, date, time, repeat, completed } = req.body;
    try {
        const db = await openDb();
        const result = await db.run(`
            INSERT INTO reminders (task, date, time, repeat, completed) 
            VALUES (?, ?, ?, ?, ?)`,
            [task, date, time || null, repeat || 'none', completed || 0]
        );
        await db.close();
        res.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error('Error creating reminder:', error);
        res.status(500).json({ error: 'Failed to create reminder' });
    }
});

// Get all reminders
router.get('/reminders', async (req: Request, res: Response) => {
    try {
        const db = await openDb();
        const reminders = await db.all(`
            SELECT * FROM reminders 
            ORDER BY date, 
            CASE WHEN time IS NULL THEN 1 ELSE 0 END, 
            time`
        );
        await db.close();
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Get reminder by ID
router.get('/reminders/:id', async (req: Request, res: Response) => {
    try {
        const db = await openDb();
        const reminder = await db.get(
            'SELECT * FROM reminders WHERE id = ?',
            [req.params.id]
        );
        await db.close();
        
        if (reminder) {
            res.json(reminder);
        } else {
            res.status(404).json({ message: 'Reminder not found' });
        }
    } catch (error) {
        console.error('Error fetching reminder:', error);
        res.status(500).json({ error: 'Failed to fetch reminder' });
    }
});

// Update a reminder
router.put('/reminders/:id', async (req: Request, res: Response) => {
    const { task, date, time, repeat, completed } = req.body;
    try {
        const db = await openDb();
        const result = await db.run(`
            UPDATE reminders 
            SET task = ?, 
                date = ?, 
                time = ?, 
                repeat = ?, 
                completed = ?,
                moved = 0
            WHERE id = ?`,
            [task, date, time || null, repeat, completed, req.params.id]
        );
        await db.close();

        if (result.changes && result.changes > 0) {
            res.json({ message: 'Reminder updated' });
        } else {
            res.status(404).json({ message: 'Reminder not found' });
        }
    } catch (error) {
        console.error('Error updating reminder:', error);
        res.status(500).json({ error: 'Failed to update reminder' });
    }
});

// Delete a reminder
router.delete('/reminders/:id', async (req: Request, res: Response) => {
    try {
        const db = await openDb();
        const result = await db.run(
            'DELETE FROM reminders WHERE id = ?',
            [req.params.id]
        );
        await db.close();

        if (result.changes && result.changes > 0) {
            res.json({ message: 'Reminder deleted' });
        } else {
            res.status(404).json({ message: 'Reminder not found' });
        }
    } catch (error) {
        console.error('Error deleting reminder:', error);
        res.status(500).json({ error: 'Failed to delete reminder' });
    }
});

// Get reminders by date range
router.get('/reminders/range/:startDate/:endDate', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.params;
        const db = await openDb();
        const reminders = await db.all(`
            SELECT * FROM reminders 
            WHERE date BETWEEN ? AND ?
            ORDER BY date, 
            CASE WHEN time IS NULL THEN 1 ELSE 0 END, 
            time`,
            [startDate, endDate]
        );
        await db.close();
        res.json(reminders);
    } catch (error) {
        console.error('Error fetching reminders by date range:', error);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

// Toggle reminder completion status
router.put('/reminders/:id/toggle', async (req: Request, res: Response) => {
    try {
        const db = await openDb();
        const result = await db.run(`
            UPDATE reminders 
            SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END 
            WHERE id = ?`,
            [req.params.id]
        );
        await db.close();

        if (result.changes && result.changes > 0) {
            res.json({ message: 'Reminder status toggled' });
        } else {
            res.status(404).json({ message: 'Reminder not found' });
        }
    } catch (error) {
        console.error('Error toggling reminder status:', error);
        res.status(500).json({ error: 'Failed to toggle reminder status' });
    }
});

export default router;
