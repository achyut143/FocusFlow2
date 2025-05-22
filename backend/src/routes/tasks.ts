import express, { Request, Response, Router } from 'express';
import { openDb } from '../index';
import { InternationaltimeZone } from '../AppConfiguration';

const router = Router();

// Create a new task

const convertTo12Hour = (time24: string, addMinutes: number = 0) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const date = new Date(`2000/01/01 ${hours}:${minutes}`);
    date.setMinutes(date.getMinutes() + addMinutes);

    return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: InternationaltimeZone,
    });
}
router.post('/remindersToTasks', async (req, res) => {
    const request = req.body;
    const db = await openDb();
    try {


        // Get today's date in EST
        let estDate = new Date().toLocaleDateString('en-US', {
            timeZone: InternationaltimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const [month, day, year] = estDate.split('/');
        estDate = `${year}-${month}-${day}`;

        // Get reminders for today
        const reminders = await db.all(`
            SELECT * FROM reminders 
            WHERE date = ? 
            AND moved = 0
        `, [estDate]);

        // if (reminders.length === 0) {
        //     return 
        // }

        // Insert reminders into tasks table
        const insertPromises = reminders.map(async (reminder) => {
            await db.run(`
                INSERT INTO task (
                    title,
                    description,
                    date,
                    start_time,
                    end_time,
                    category_id,
                    weight

                ) VALUES (?, ?, ?, ?, ?, 1, 1)
            `, [
                reminder.task,
                'From reminder',
                reminder.date,
                reminder.time ? convertTo12Hour(reminder.time) : 'T:0',
                reminder.time ? convertTo12Hour(reminder.time, reminder.alloted) : `T:${reminder.alloted}`,
            ]);
        });

        await Promise.all(insertPromises);

        // Update moved status in reminders
        await db.run(`
            UPDATE reminders 
            SET moved = 1 
            WHERE date = ? 
            AND moved = 0
        `, [estDate]);

        res.status(201).json({
            success: true,
            message: `${reminders.length} reminders moved to tasks`
        });

    } catch (error) {
        console.error('Error in remindersToTasks:', error);
        await db?.close();
        res.status(500).json({ message: 'Error creating task' });

    }
});

router.post('/tasks', async (req, res) => {
    const { title, description, start_time, end_time, completed, category_id, weight } = req.body;
    const db = await openDb();

    try {
        let dateValue;

        // Check if title contains "I get to do it"
        if (title.toLowerCase().includes('i get to do it')) {
            // Set date to last year's date
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            dateValue = lastYear.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const result = await db.run(`
                INSERT INTO task (title, description, start_time, end_time, completed, category_id, date, weight) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, description, start_time, end_time, completed, category_id, dateValue, weight]
            );
            await db.close();
            res.status(201).json({ id: result.lastID });;
        } else {
            // Use current date
            const result = await db.run(`
                INSERT INTO task (title, description, start_time, end_time, completed, category_id, date, weight) 
                VALUES (?, ?, ?, ?, ?, ?, DATE(DATETIME('now', 'localtime')), ?)`,
                [title, description, start_time, end_time, completed, category_id, weight]
            );
            await db.close();
            res.status(201).json({ id: result.lastID });;

        }




    } catch (error) {
        console.error('Error creating task:', error);
        await db?.close();
        res.status(500).json({ message: 'Error creating task' });
    }
});

router.post('/createTimeForRemainingHabits', async (req: Request, res: Response) => {
    console.log('0')
    const db = await openDb();

    const { slot, rest, time } = req.body;

    console.log('time', time)


    let tasks = await db.all(`
       SELECT * FROM task 
                WHERE (date = DATE(DATETIME('now', 'localtime')) OR  LOWER(title) LIKE '%i get to do it%' COLLATE NOCASE)
                AND deletedAt IS NULL AND reassign = true
    `);





    tasks = [...tasks]

    await createTimeBlockedTasks(db, tasks, rest, slot, time);

    await db.run(`
        UPDATE task SET  reassign = false`,

    );

    await db.close();
    res.status(201).json({ tasks: tasks });;



})

const getTimeSir = (Time: string): Date => {
    const [timeStr, modifier] = Time.split(" ");
    let [hours, minutes] = timeStr.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const endDate = new Date();
    endDate.setHours(hours, minutes, 0);

    return endDate;



};

const getTimeRemaining = (startTime: string, endTime: string): number => {
    let ST = getTimeSir(startTime)
    let ET = getTimeSir(endTime)

    const diff = ET.getTime() - ST.getTime();
    return Math.floor(diff / 60000);


};

async function createTimeBlockedTasks(db: any, tasks: any[], rest: number, slot: number, time: string) {
    // Convert current time string to Date object and set to EST timezone

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59); // Set end of day time

    // Format function for time with AM/PM in EST
    function formatTimeEST(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: InternationaltimeZone  // EST/EDT timezone
        };
        return date.toLocaleTimeString('en-US', options);
    }
    let blockStartTime = getTimeSir(time);

    for (const task of tasks) {
        if (task && task.title) {
            // Remove "i get to do it" from the title (case insensitive)
            const cleanTitle = `${task.title.replace(/i get to do it/i, '').trim()} (duplicate)`;
            let workEndTime;





            // Keep creating blocks until end of day
            const timeRemaning = getTimeRemaining(task.start_time, task.end_time)


            // Create work block (25 minutes)
            if (timeRemaning > slot) {
                workEndTime = new Date(blockStartTime.getTime() + slot * 60000);
            } else {
                workEndTime = new Date(blockStartTime.getTime() + timeRemaning * 60000);
            }

            // if (workEndTime > endOfDay) break;

            // Format times with AM/PM in EST
            const formattedStartTime = formatTimeEST(blockStartTime);
            const formattedEndTime = formatTimeEST(workEndTime);



            // Insert work block with formatted times
            await db.run(`
                    INSERT INTO task (
                        title,
                        start_time, 
                        end_time,
                       
                         completed, 
                         category_id, 
                         date, 
                         weight,
                         description

                    ) VALUES (?, ?, ?, ?, 1,DATE(DATETIME('now', 'localtime')),0,?)
                `, [
                cleanTitle,
                formattedStartTime,
                formattedEndTime,

                0,
                task.description
            ]);

            // Calculate break times
            const breakStartTime = new Date(workEndTime);
            const breakEndTime = new Date(breakStartTime.getTime() + rest * 60000);

            // if (breakEndTime > endOfDay) break;

            // Format break times
            const formattedBreakStartTime = formatTimeEST(breakStartTime);
            const formattedBreakEndTime = formatTimeEST(breakEndTime);

            // Insert break block with formatted times
            // await db.run(`
            //         INSERT INTO task (
            //             title,
            //            start_time, 
            //             end_time,

            //              completed, 
            //              category_id, 
            //              date, 
            //              weight,
            //              description
            //         ) VALUES (?, ?, ?, ?, 1, DATE(DATETIME('now', 'localtime')), 0,?)
            //     `, [
            //     'Break',
            //     formattedBreakStartTime,
            //     formattedBreakEndTime,
            //     0,
            //     'Break'
            // ]);

            // Set start time for next block
            blockStartTime = new Date(breakEndTime);

        }
    }


}

router.post('/notes', async (req: Request, res: Response) => {
    const { notes, id } = req.body;
    try {
        const db = await openDb();
        await db.run(
            `UPDATE task SET notes = ? WHERE id = ?`,
            [notes, id]
        );
        await db.close();
        res.status(201).json({ notes: notes });

    } catch (err) {
        console.error('Error updating notes:', err);
        res.status(500).json({ message: 'Error updating notes' });
    }
});





// Read all tasks
router.post('/gettasks', async (req: Request, res: Response) => {
    const { date,search } = req.body;
    try {
        const db = await openDb();
        let tasks: any[] = [];
        let habitTasks = [];
        if(search){

            // if(search.text){
             tasks = await db.all(`
                SELECT * FROM task 
                WHERE title LIKE ? 
              
            `, [`%${search.text}%`]);

             habitTasks = await db.all(`
                SELECT * FROM habit 
               WHERE taskName LIKE ?
            `, [`%${search.text}%`]);
            

            const habitTaskNames = habitTasks.map(habit =>
                habit.taskName.toLowerCase()
            );

         
            habitTasks = habitTasks.map((habit) => {
                // Find the task that has the same name as the habit
                const matchingTask = tasks.find((task) => task.title === habit.taskName);
            
                // If a matching task is found, return a new object without the date property
                if (matchingTask) {
                
                    return {...matchingTask,date:habit.date,weight:habit.weight,completed:habit.done,not_completed:habit.procrastinated,notes:habit.notes} // Return the task object without the date
                }
            
                // If no matching task is found, return the habit as is or handle as needed
                return null;
            });

            habitTasks = habitTasks.filter((habit) => habit !== null)

            tasks = tasks.filter((task)=>!task.title.includes('I get to do it'))

            tasks = [...tasks,...habitTasks]

            

          console.log('377',tasks.length)
             tasks = tasks?.sort((a, b) => {
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
            
                // Compare dates
                const dateA = new Date(a.date); // Assuming 'date' is the property name for date
                const dateB = new Date(b.date);
            
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime(); // Sort by date
                }
            
                // If dates are equal, compare start times
                const startTimeA = getTimeValue(a.start_time);
                const startTimeB = getTimeValue(b.start_time);
            
                if (startTimeA !== startTimeB) {
                    return startTimeA - startTimeB; // Sort by start time
                }
            
                // If start times are equal, compare end times
                const endTimeA = getTimeValue(a.end_time);
                const endTimeB = getTimeValue(b.end_time);
                return endTimeA - endTimeB; // Sort by end time
            });
            await db.close();
            console.log('416',tasks.length)

         

            console.log('424',tasks.length)
            if(search.notes){
                tasks = tasks.filter((row)=>row.notes !== null);   

            }
            console.log('429',tasks.length)

            if (search.startDate && search.endDate) {
                tasks = tasks.filter((row) => {
                    const taskDate = new Date(row.date);
                    return taskDate >= new Date(search.startDate) && taskDate <= new Date(search.endDate);
                });
            }
    
            if(search.page && search.limit){
                const startIndex = (search.page - 1) * search.limit;
                const endIndex = startIndex + search.limit;
                tasks = tasks.slice(startIndex, endIndex);         
            }
            console.log('433',tasks.length)
        // }
            res.json(tasks);
       

            

           

           
        

        }else{
        if (date) {
            tasks = await db.all(`
                SELECT * FROM task 
                WHERE (date = ? OR 
                      LOWER(title) LIKE '%i get to do it%' COLLATE NOCASE)
            `, [date]);

            const habitTasks = await db.all(`
                SELECT * FROM habit 
                WHERE date = ?
            `, [date]);

            const habitTaskNames = habitTasks.map(habit =>
                habit.taskName.toLowerCase()
            );

            console.log('habitTaskNames', habitTaskNames)
            tasks = tasks.map(task => {
                const taskTitle = task.title.toLowerCase();
                // Check if any habit task name is included in the task title
                const matchesHabitComplete = habitTasks.some(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()) && habitName.done 
                );

                const matchesHabitInComplete = habitTasks.some(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()) && habitName.procrastinated
                );

                const habit = habitTasks.filter(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()))[0]
              

                if(habit === undefined){

                return matchesHabitComplete ? { ...task, completed: true,not_completed:false} : matchesHabitInComplete ? { ...task, not_completed: true,completed:false } : task.title.toLowerCase().includes("i get to do it") ? { ...task, completed: false, not_completed: false } : {...task};
                }else{

                return matchesHabitComplete ? { ...task, completed: true,not_completed:false, notes: habit.notes, habitId: habit.id } : matchesHabitInComplete ? { ...task, not_completed: true, notes: habit.notes, habitId: habit.id,completed:false } : task.title.toLowerCase().includes("i get to do it") ? { ...task, completed: false, not_completed: false, notes: habit.notes, habitId: habit.id } : {...task, habitId:null};
                }
            });



        } else {
            tasks = await db.all(`
                SELECT * FROM task 
                WHERE (date = DATE(DATETIME('now', 'localtime')) OR 
                      LOWER(title) LIKE '%i get to do it%' COLLATE NOCASE)
                AND deletedAt IS NULL
            `);

            const habitTasks = await db.all(`
                SELECT * FROM habit 
                WHERE date =  DATE(DATETIME('now', 'localtime'))
            `);

            const habitTaskNames = habitTasks.map(habit =>
                habit.taskName.toLowerCase()
            );


            tasks = tasks.map(task => {
                const taskTitle = task.title.toLowerCase();
                // Check if any habit task name is included in the task title
                const matchesHabitComplete = habitTasks.some(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()) && habitName.done
                );

                const matchesHabitInComplete = habitTasks.some(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()) && habitName.procrastinated
                );

                const habit = habitTasks.filter(habitName =>
                    taskTitle.includes(habitName.taskName.toLowerCase()))[0]
              

                if(habit === undefined){

                return matchesHabitComplete ? { ...task, completed: true,not_completed:false} : matchesHabitInComplete ? { ...task, not_completed: true,completed:false } : task.title.toLowerCase().includes("i get to do it") ? { ...task, completed: false, not_completed: false } : {...task};
                }else{

                return matchesHabitComplete ? { ...task, completed: true,not_completed:false, notes: habit.notes, habitId: habit.id } : matchesHabitInComplete ? { ...task, not_completed: true, notes: habit.notes, habitId: habit.id ,completed:false} : task.title.toLowerCase().includes("i get to do it") ? { ...task, completed: false, not_completed: false, notes: habit.notes, habitId: habit.id } : {...task, habitId:null};
                }
            });

        }

        const sortedTasks = tasks?.sort((a, b) => {
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
    }

        // Sort tasks by time
      
      
    

       
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


router.get('/graph', async (req, res) => {
    const db = await openDb();
    const task = await db.all(`SELECT 
    taskName,
    date,
    COUNT(*) AS total_tasks,
    SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(CASE WHEN procrastinated = 1 THEN 1 ELSE 0 END) AS not_completed_tasks
FROM habit
GROUP BY 
    taskName,date;



`);
    console.log(task)
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
        [completed, req.params.id]
    );
    await db.close();
    res.json({ message: 'Task updated' });
});

// Update a task
router.put('/reassign/:id', async (req, res) => {
    const { reassign } = req.body;
    const db = await openDb();
    await db.run(`
        UPDATE task SET  reassign = ?
        WHERE id = ?`,
        [reassign, req.params.id]
    );
    await db.close();
    res.json({ message: 'Task updated' });
});

// Update a  task to not completed
router.put('/tasksNotCompleted/:id', async (req, res) => {
    const { not_completed } = req.body;
    const db = await openDb();
    await db.run(`
        UPDATE task SET  not_completed = ?
        WHERE id = ?`,
        [not_completed, req.params.id]
    );
    await db.close();
    res.json({ message: 'Task updated' });
});

// Update a  task to five minutes done
router.put('/fiveCompleted/:id', async (req, res) => {
    const { five } = req.body;
    const db = await openDb();
    await db.run(`
        UPDATE task SET  five = ?
        WHERE id = ?`,
        [five, req.params.id]
    );
    await db.close();
    res.json({ message: 'Task updated' });
});


// Update whole task
//title, description, start_time, end_time,category
router.put('/tasksUpdate/:id', async (req, res) => {
    const { title, description, start_time, end_time, weight, category } = req.body;
    const db = await openDb();
    await db.run(`
        UPDATE task SET  title = ? , description= ? , start_time = ? , end_time = ? ,category_id = ?,weight = ?
        WHERE id = ?`,
        [title, description, start_time, end_time, category, weight, req.params.id]
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
    await db.run('UPDATE task SET deletedAt = DATE("now") WHERE id = ?', [req.params.id]);
    await db.close();
    res.json({ message: 'Task deleted' });
});

router.delete('/deleteForever/:id', async (req, res) => {
    const db = await openDb();
    await db.run('DELETE FROM task  WHERE id = ?', [req.params.id]);
    await db.close();
    res.json({ message: 'Task deleted' });
});

router.get('/points', async (req, res) => {
    try {
        const db = await openDb();
        // Fix the SQL queries by adding proper FROM clause and table name
        const completedPoints = await db.get(`SELECT SUM(weight) as total FROM task WHERE Date = DATE(DATETIME('now', 'localtime')) AND completed = 1 `);
        const notCompletedPoints = await db.get(`SELECT SUM(weight) as total FROM task WHERE Date = DATE(DATETIME('now', 'localtime')) AND not_completed = 1 `);
        const totalPoints = await db.get(`SELECT SUM(weight) as total FROM task WHERE Date = DATE(DATETIME('now', 'localtime'))`);
        const totalPointsHabits = await db.get(`SELECT SUM(weight) as total FROM task WHERE  AND title LIKE '%' || LOWER('I get to do it') || '%' COLLATE NOCASE`);

        const habitDonePoints = await db.get(`SELECT SUM(weight) as total FROM habit WHERE date = DATE(DATETIME('now', 'localtime')) AND done = 1`);
        const habitProcrastinatedPoints = await db.get(`SELECT SUM(weight) as total FROM habit WHERE date = DATE(DATETIME('now', 'localtime')) AND procrastinated = 1`);


        await db.close();

        // Return both completed and not completed points
        res.json({
            completedPoints: completedPoints?.total || 0,
            notCompletedPoints: notCompletedPoints?.total || 0,
            habitDonePoints: habitDonePoints?.total || 0,
            habitProcrastinatedPoints: habitProcrastinatedPoints?.total || 0,
            totalPoints: totalPoints?.total || 0,
            totalPointsHabits: totalPointsHabits?.total || 0
        });
    } catch (error) {
        console.log(error)
        // Add error handling
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/pointsGraph', async (req, res) => {
    try {
        const db = await openDb();

        const results = await db.all(`
            SELECT 
                date,
                SUM(CASE WHEN completed = 1  THEN weight ELSE 0 END) as completedPoints,
                SUM(CASE WHEN not_completed = 1  THEN weight ELSE 0 END) as notCompletedPoints,
                SUM(weight) as totalPoints
            FROM task 
            GROUP BY Date
            ORDER BY Date DESC
        `);

        const habitResults = await db.all(`
            SELECT 
                date,
                SUM(CASE WHEN done = 1 THEN weight ELSE 0 END) as habitDonePoints,
                SUM(CASE WHEN procrastinated = 1 THEN weight ELSE 0 END) as habitProcrastinatedPoints
            FROM habit
            GROUP BY date
            ORDER BY date DESC
        `);

        const totalPointsHabits = await db.get(`SELECT SUM(weight) as total FROM task WHERE   title LIKE '%' || LOWER('I get to do it') || '%' COLLATE NOCASE`);

        // Merge the results by date
        const mergedResults = results.map(taskDay => {
            const habitDay = habitResults.find(h => h.date === taskDay.date) || {
                habitDonePoints: 0,
                habitProcrastinatedPoints: 0
            };

            return {
                date: taskDay.date,
                completedPoints: taskDay.completedPoints || 0,
                notCompletedPoints: taskDay.notCompletedPoints || 0,
                habitDonePoints: habitDay.habitDonePoints || 0,
                habitProcrastinatedPoints: habitDay.habitProcrastinatedPoints || 0,
                totalPoints: taskDay.totalPoints || 0,
                totalPointsHabits: totalPointsHabits.total || 0
            };
        });

        await db.close();

        res.json(mergedResults);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



export default router;
