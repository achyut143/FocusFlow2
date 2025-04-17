import express from 'express';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import taskRoutes from './routes/tasks';
import categoryRoutes from './routes/categories';
import habitRouter from './routes/habits';
import reminderRouter from './routes/reminders';
import cors from 'cors'; 

// Initialize the Express application
const app = express();
const PORT = 5000;


// Task interface
// interface Task {
//     id: number;
//     title: string;
//     description: string;
//     start_time: string;
//     end_time: string;
//     completed: boolean;
//     category_id: number;
// }

app.use(cors({
    origin: 'http://localhost:3005', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));


// Middleware
app.use(bodyParser.json());

// Open a database connection
export async function openDb() {
    return open({
        filename: './tasks.db', // Adjust to your database path
        driver: sqlite3.Database
    });
}


// Routes
app.use('/tasks', taskRoutes);

app.use('/category', categoryRoutes)

app.use('/habits', habitRouter)

app.use('/reminders', reminderRouter)


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
