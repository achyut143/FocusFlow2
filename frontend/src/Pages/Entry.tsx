import React, { useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import { Box, FormControl, MenuItem, Paper, Select, TextField, Typography, styled } from "@mui/material";
import TasksCalendarView from "./Common/TasksCalendarView";
import Reminder from "./Reminder";
import { InternationaltimeZone, portUrl } from "../AppConfiguration";
import "./Entry.css";
import AddTaskIcon from "@mui/icons-material/AddTask";
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AutorenewIcon from "@mui/icons-material/Autorenew";

// Styled components for professional UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  padding: theme.spacing(3),
  borderRadius: theme.spacing(1),
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0,0,0,0.1)",
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  textTransform: "none",
  fontWeight: 500,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  }
}));

const Entry: React.FC = () => {
  // State variables for task input and configurations
  const [value, setValue] = useState("");
  const [slotValue, setSlotValue] = useState(25);
  const [repeatAgain, setRepeatAgain] = useState(0);
  const [timeValue, setTimeValue] = useState(() => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    timeZone: "America/New_York", // Using EST timezone
    });
  });
 
const [date, setDate] = useState(() => {
  const now = new Date();
  // Format the date in EST timezone
  const options = { timeZone: "America/New_York" };
  const estDate = new Date(now.toLocaleString("en-US", options));
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});
  const [refresh, setRefresh] = useState(true);
  const [period, setPeriod] = useState(new Date().getHours() >= 12 ? "PM" : "AM");
  const [reminderApp, setReminderApp] = useState(false);
  const [openTable, setOpenTable] = useState(true);

  // Function to create time for remaining habits
  // const AutoCreate = async () => {
  //   try {
  //     setRefresh(false);
  //     await axios.post(`${portUrl}/tasks/createTimeForRemainingHabits`, {
  //       slot: slotValue,
  //       rest: restValue,
  //       time: timeValue,
  //     });
  //     setRefresh(true);
  //     setValue("");
  //   } catch (error) {
  //     setRefresh(true);
  //     console.error("Error creating time for habits:", error);
  //   }
  // };

  // Function to load reminders
  const LoadReminders = async () => {
    try {
      setRefresh(false);
      await axios.post(`${portUrl}/tasks/remindersToTasks`);
      setRefresh(true);
      setValue("");
    } catch (error) {
      setRefresh(true);
      console.error("Error loading reminders:", error);
    }
  };

  // Function to handle key down event for task input
  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {

      const tasksResponse = value.trim().split("-");

      if (tasksResponse.length <= 3) {
        setRefresh(false);
        const taskName = "Not Timed Task";
        const description = tasksResponse[0].trim();
        const weight = tasksResponse[2].trim();
        const startTime = "T:0";
        const endTime = tasksResponse[1] ? `T:${tasksResponse[1]?.trim()}` : "T:25";

        try {
          await axios.post(`${portUrl}/tasks/tasks`, {
            title: taskName,
            description: description,
            start_time: startTime,
            end_time: endTime,
            completed: false,
            category_id: 1, // Modify as needed
            weight: weight ? weight : 1,
            date:date
          });
          setRefresh(true);
          setValue("");
        } catch (error) {
          console.error("Error creating task:", error);
        }
      }

      if (tasksResponse.length >= 4) {
        try {
          setRefresh(false);
          const periodChange = parseInt(tasksResponse[0].split(':')[0]) < 12 && parseInt(tasksResponse[1].split(':')[0]) >= 12 ? period === 'AM' ? 'PM' : 'AM' : period

          const startTime = `${tasksResponse[0].trim()} ${period}`;
          const endTime = `${tasksResponse[1].trim()} ${periodChange}`;
          const taskName = tasksResponse[2].trim();
          const description = tasksResponse[3].trim();
          const weight = tasksResponse[4]?.trim();
          



          await axios.post(`${portUrl}/tasks/tasks`, {
            title: taskName,
            description: description,
            start_time: startTime,
            end_time: endTime,
            completed: false,
            category_id: 1, // Modify as needed
            weight: weight ? weight : 1,
            date:date,
            ...(repeatAgain && {repeat: repeatAgain})
          });
          setRefresh(true);
          
          setValue("");
        } catch (error) {
          console.error("Error creating task:", error);
        } finally {
          setRefresh(true);
          setRepeatAgain(0)
          setValue("");
        }
      } else {
        setRefresh(true);
        setValue("");
      }
    }
  };

  return (
    <div className="entry-container">
      <div className="entry-header">
        <Typography variant="h4" gutterBottom>Task Management</Typography>
        <Typography variant="subtitle1" color="textSecondary">Create and manage your daily tasks</Typography>
      </div>
      
      <div className="format-guide">
        <Typography variant="subtitle2" gutterBottom>Input Format:</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <span className="highlight">StartTime</span> - 
          <span className="highlight">EndTime</span> - 
          <span className="task-name">TaskName</span> - 
          <span className="description">Description</span>
        </Box>
      </div>

      <StyledPaper className="control-panel">
        <Box sx={{ display: 'flex', width: '100%', gap: 2, mb: 3 }}>
          <TextField
            id="task"
            label="Enter Task"
            placeholder="e.g., 9:00 - 10:00 - Meeting - Weekly team sync"
            variant="outlined"
            fullWidth
            onChange={(e) => setValue(e.target.value)}
            value={value}
            onKeyDown={handleKeyDown}
            sx={{ bgcolor: 'background.paper' }}
          />
          <FormControl variant="outlined" sx={{ minWidth: 100 }}>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ height: '56px' }}
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {/* <TextField
            label="Slot Duration"
            type="number"
            value={slotValue}
            onChange={(e) => setSlotValue(parseInt(e.target.value))}
            variant="outlined"
            size="small"
          /> */}
          <TextField
            label="Repeat Every _ days"
            type="number"
            value={repeatAgain}
            onChange={(e) => setRepeatAgain(parseInt(e.target.value))}
            variant="outlined"
            size="small"
          />
          {/* <TextField
            label="Start Time"
            variant="outlined"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            size="small"
          /> */}
          <TextField
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* <div className="button-group">
          <ActionButton 
            variant="outlined" 
            onClick={() => setOpenTable(prev => !prev)}
            startIcon={<AddTaskIcon />}
          >
            {openTable ? 'Hide Tasks' : 'Show Tasks'}
          </ActionButton>
          <ActionButton 
            variant="outlined" 
            onClick={() => setReminderApp(prev => !prev)}
            startIcon={<NotificationsActiveIcon />}
          >
            {reminderApp ? 'Hide Reminders' : 'Show Reminders'}
          </ActionButton>
          <ActionButton 
            variant="contained" 
            color="primary" 
            onClick={LoadReminders}
            startIcon={<RefreshIcon />}
          >
            Load Reminders
          </ActionButton>
          <ActionButton 
            variant="contained" 
            color="secondary" 
            onClick={AutoCreate}
            startIcon={<AutorenewIcon />}
          >
            Auto Reassign
          </ActionButton>
        </div> */}
      </StyledPaper>

      {/* <div className="content-area"> */}
        {refresh && openTable && (
          // <Box sx={{ width: '100%' }}>
            <TasksCalendarView date={date} setBackDate={setDate} />
          // </Box>
        )}
        {/* {reminderApp && (
          <Box sx={{ width: reminderApp && openTable ? '40%' : '100%' }}>
            <Reminder />
          </Box>
        )} */}
      </div>
    // </div>
  );
};

export default Entry;
