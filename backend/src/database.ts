import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const initDatabase = async () => {
  const db = await open({
    filename: 'tasks.db',
    driver: sqlite3.Database,
  });

  const deleteTables = false
  const createTables = false

  const insertCategory = async (name: string, target: number) => {
    const sql = `INSERT INTO category (name, target) VALUES (?, ?)`; // Adjust table name and columns as needed

    await db.run(sql, [name, target])
  };


  if (deleteTables) {

    await db.exec(`DELETE FROM task `)
    await db.exec(`DELETE FROM reminders `)
    await db.exec(`DELETE FROM habit `)
  }



  if (createTables) {
    // Create the category table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target INTEGER 
    )
  `);


    // // Create the task table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time TEXT,
      end_time TEXT,
      weight INTEGER,
      completed BOOLEAN NOT NULL DEFAULT 0,
      category_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES category(id)
    )
  `);

    await db.exec(`
    ALTER TABLE task ADD COLUMN reassign BOOLEAN NOT NULL DEFAULT FALSE;
  `);




    const DATABASE_CREATE_REMINDERS = `
      CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT,                    -- Optional field
          repeat TEXT,
          completed BOOLEAN NOT NULL DEFAULT 0
      );
  `;

    await db.exec(DATABASE_CREATE_REMINDERS)

    await db.exec(`ALTER TABLE reminders 
    ADD COLUMN alloted INTEGER DEFAULT 30;`);


    await db.exec(`
    CREATE TABLE habit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskName TEXT NOT NULL,
      done BOOLEAN DEFAULT 0,
      procrastinated BOOLEAN DEFAULT 0,
      date TEXT NOT NULL
    )
  `);

    await db.exec(`
    ALTER TABLE habit ADD COLUMN weight REAL NOT NULL DEFAULT 0;
  `);

    await db.exec(`
    ALTER TABLE task ADD COLUMN notes TEXT;
   `);

    await db.exec(`
     ALTER TABLE habit ADD COLUMN notes TEXT;
    `);


    insertCategory('General', 1);


  }

  const removeNotes = {
    habits:false,
    tasks:false

  }
  if(removeNotes){
    if (removeNotes.habits){
    
      await db.run(
        ` UPDATE habit set notes = NULL where id = 902 `,
       
    );
    }
    if (removeNotes.tasks){
      console.log('ran')
      await db.run(
        ` UPDATE task set notes = NULL where id = 902 `,
       
      );
    }




  }

  await db.exec(`
  UPDATE task 
SET title = 'Plan water breaks(I get to do it)' 
WHERE id = 429;

`)





















  // Example usage
  // insertCategory('Health', 4);
  //health - morning exercise 1, meditation 1 ,evening exercise 2

  console.log('Database and tables created successfully.');

  await db.close();
};

initDatabase().catch((error) => {
  console.error('Error initializing database:', error);
});
