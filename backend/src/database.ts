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

await db.exec(`
  ALTER TABLE task ADD COLUMN reassign BOOLEAN NOT NULL DEFAULT FALSE;
`);

// await db.exec(`
//   ALTER TABLE habit ADD COLUMN weight REAL NOT NULL DEFAULT 0;
// `);

//const date = `DATE(DATETIME('now', 'localtime'))`
// const date = `2024-03-20`

// await db.exec(`UPDATE habit
// SET date = '2025-03-27'  where id = 138 `)

// const value = await db.exec(`SELECT 
//     date AS task_day,
//     category,
//     SUM(weight) AS total_weight
// FROM 
//     task
// WHERE 
//     task_date >= CURDATE() AND 
//     task_date < CURDATE() + INTERVAL 30 DAY
// GROUP BY 
//     task_day, category
// ORDER BY 
//     task_day, category`)

// await db.exec(`UPDATE task
// SET category_id = 1 where id < 46`);

// await db.exec(`UPDATE habit
// SET date = '2025-04-01' where date = '2025-04-02' `)
// await db.exec(`DELETE FROM task `)
// await db.exec(`DELETE FROM task where id >= 722 `)
// const DATABASE_CREATE_REMINDERS = `
//     CREATE TABLE IF NOT EXISTS reminders (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         task TEXT NOT NULL,
//         date TEXT NOT NULL,
//         time TEXT,                    -- Optional field
//         repeat TEXT,
//         completed BOOLEAN NOT NULL DEFAULT 0
//     );
// `;

// await db.exec(DATABASE_CREATE_REMINDERS)


console.log('done')

// await db.exec(`
//   CREATE TABLE habit (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     taskName TEXT NOT NULL,
//     done BOOLEAN DEFAULT 0,
//     procrastinated BOOLEAN DEFAULT 0,
//     date TEXT NOT NULL
//   )
// `);



// Example usage
  // insertCategory('Health', 4);
  //health - morning exercise 1, meditation 1 ,evening exercise 2

  console.log('Database and tables created successfully.');

  await db.close();
};

initDatabase().catch((error) => {
  console.error('Error initializing database:', error);
});
