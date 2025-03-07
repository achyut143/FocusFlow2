import sqlite3 from 'sqlite3';
import {open} from 'sqlite';

const initDatabase = async () => {
  const db = await open({
    filename: 'tasks.db',
    driver: sqlite3.Database,
  });

  // Create the category table
  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS category (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     name TEXT NOT NULL,
  //     target INTEGER 
  //   )
  // `);

  // // Create the task table
  // await db.exec(`
  //   CREATE TABLE IF NOT EXISTS task (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     title TEXT NOT NULL,
  //     description TEXT,
  //     start_time TEXT,
  //     end_time TEXT,
  //     weight INTEGER,
  //     completed BOOLEAN NOT NULL DEFAULT 0,
  //     category_id INTEGER,
  //     FOREIGN KEY (category_id) REFERENCES category(id)
  //   )
  // `);

  const insertCategory = async(name:string, target:number) => {
    const sql = `INSERT INTO category (name, target) VALUES (?, ?)`; // Adjust table name and columns as needed

    await db.run(sql, [name, target])
};

// Example usage
  insertCategory('Random', 0);

  console.log('Database and tables created successfully.');

  await db.close();
};

initDatabase().catch((error) => {
  console.error('Error initializing database:', error);
});
