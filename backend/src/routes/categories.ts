
import express, { Request, Response, Router } from 'express';
import { openDb } from '../index';

const router = Router();
// Create a new category
router.post('/categories', async (req, res) => {
    const { name, target } = req.body;
    const db = await openDb();
    const result = await db.run(`INSERT INTO category (name, target) VALUES (?, ?)`, [name, target]);
    await db.close();
    res.status(201).json({ id: result.lastID });
});

// Read all categories
router.get('/categories', async (req, res) => {
    const db = await openDb();
    const categories = await db.all(`SELECT * FROM category`);
    await db.close();
    res.status(200).json(categories);
});

// Read a category by ID
router.get('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const db = await openDb();
    const category = await db.get(`SELECT * FROM category WHERE id = ?`, [id]);
    await db.close();
    if (category) {
        res.status(200).json(category);
    } else {
        res.status(404).json({ message: 'Category not found' });
    }
});

// Update a category by ID
router.put('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const { name, target } = req.body;
    const db = await openDb();
    const result = await db.run(`UPDATE category SET name = ?, target = ? WHERE id = ?`, [name, target, id]);
    await db.close();
    if (result.changes) {
        res.status(200).json({ message: 'Category updated' });
    } else {
        res.status(404).json({ message: 'Category not found' });
    }
});

// Delete a category by ID
router.delete('/categories/:id', async (req, res) => {
    const { id } = req.params;
    const db = await openDb();
    const result = await db.run(`DELETE FROM category WHERE id = ?`, [id]);
    await db.close();
    if (result.changes) {
        res.status(204).send();
    } else {
        res.status(404).json({ message: 'Category not found' });
    }
});

export default router;
