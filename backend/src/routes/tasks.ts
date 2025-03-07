import express, { Request, Response, Router } from 'express';
import { openDb } from '../index';

const router = Router();

// Create a new task
router.post('/tasks', async (req, res) => {
    const { title, description, start_time, end_time, completed, category_id } = req.body;
    const db = await openDb();
    const result = await db.run(`
        INSERT INTO task (title, description, start_time, end_time, completed, category_id) 
        VALUES (?, ?, ?, ?, ?, ?)`, 
        [title, description, start_time, end_time, completed, category_id]
    );
    await db.close();
    res.status(201).json({ id: result.lastID });
});

// Read all tasks
router.get('/tasks', async (req: Request, res: Response) => {
    try {
        const db = await openDb();
        const tasks = await db.all('SELECT * FROM task');
        
        // Sort tasks by time
        const sortedTasks = tasks.sort((a, b) => {
            // Convert start times to 24-hour format for comparison
            const getTimeValue = (timeStr: string) => {
                const [time, period] = timeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                
                // Convert to 24-hour format
                if (period === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (period === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                return hours * 60 + minutes; // Convert to minutes for easier comparison
            };

            // Compare start times
            const startTimeA = getTimeValue(a.start_time);
            const startTimeB = getTimeValue(b.start_time);
            
            if (startTimeA !== startTimeB) {
                return startTimeA - startTimeB;
            }
            
            // If start times are equal, compare end times
            const endTimeA = getTimeValue(a.end_time);
            const endTimeB = getTimeValue(b.end_time);
            return endTimeA - endTimeB;
        });

        await db.close();
        res.json(sortedTasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});


// Read a single task by ID
router.get('/tasks/:id', async (req, res) => {
    const db = await openDb();
    const task = await db.get('SELECT * FROM task WHERE id = ?', [req.params.id]);
    await db.close();
    if (task) {
        res.json(task);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
});

// Update a task
router.put('/tasks/:id', async (req, res) => {
    const { completed } = req.body;
    const db = await openDb();
    await db.run(`
        UPDATE task SET  completed = ?
        WHERE id = ?`, 
        [ completed,  req.params.id]
    );
    await db.close();
    res.json({ message: 'Task updated' });
});

// Update a task
// router.put('/tasks/:id', async (req, res) => {
//     const { title, description, start_time, end_time, completed, category_id } = req.body;
//     const db = await openDb();
//     await db.run(`
//         UPDATE task SET title = ?, description = ?, start_time = ?, end_time = ?, completed = ?, category_id = ? 
//         WHERE id = ?`, 
//         [title, description, start_time, end_time, completed, category_id, req.params.id]
//     );
//     await db.close();
//     res.json({ message: 'Task updated' });
// });

// Delete a task
router.delete('/tasks/:id', async (req, res) => {
    const db = await openDb();
    await db.run('DELETE FROM task WHERE id = ?', [req.params.id]);
    await db.close();
    res.json({ message: 'Task deleted' });
});

export default router;
