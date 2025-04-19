import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import { Box, FormControl, MenuItem, Paper, Select, TextField, styled } from "@mui/material";
import Grid from "@mui/material/Grid";
import { TasksTable } from "./Common/TasksTable";
import { Points } from "./Common/Points";
import Reminder from "./Reminder";
import { InternationaltimeZone, portUrl } from "../AppConfiguration";

// Styled component for consistent item styling
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

const Entry: React.FC = () => {
  // State variables for task input and configurations
  const [value, setValue] = useState("");
  const [slotValue, setSlotValue] = useState(25);
  const [restValue, setRestValue] = useState(1);
  const [timeValue, setTimeValue] = useState(() => {
    const now = new Date();
    return now.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: InternationaltimeZone,
    });
  });

  const [refresh, setRefresh] = useState(true);
  const [period, setPeriod] = useState(new Date().getHours() >= 12 ? "PM" : "AM");
  const [reminderApp, setReminderApp] = useState(false);
  const [openTable, setOpenTable] = useState(true);

  // Function to create time for remaining habits
  const AutoCreate = async () => {
    try {
      setRefresh(false);
      await axios.post(`${portUrl}/tasks/createTimeForRemainingHabits`, {
        slot: slotValue,
        rest: restValue,
        time: timeValue,
      });
      setRefresh(true);
      setValue("");
    } catch (error) {
      setRefresh(true);
      console.error("Error creating time for habits:", error);
    }
  };

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

          const startTime = `${tasksResponse[0].trim()} ${period}`;
          const endTime = `${tasksResponse[1].trim()} ${period}`;
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
          });
          setRefresh(true);
          setValue("");
        } catch (error) {
          console.error("Error creating task:", error);
        } finally {
          setRefresh(true);
          setValue("");
        }
      } else {
        setRefresh(true);
        setValue("");
      }
    }
  };

  return (
    <div>
      <span>
        <b>Format: </b>
      </span>
      <span style={{ backgroundColor: "yellow", color: "black" }}>
        <strong>StartTime</strong> - <strong>EndTime</strong> -
        <span style={{ color: "blue" }}> TaskName</span> -
        <span style={{ color: "green" }}> Description</span>
      </span>
      <br />
      <br />

      <Box sx={{ display: 'flex', width: '100%', gap: 2 }}>
        <TextField
          id="task"
          label="Enter Task in above format and press enter"
          variant="outlined"
          fullWidth
          onChange={(e) => setValue(e.target.value)}
          value={value}
          onKeyDown={handleKeyDown}
        />
        <FormControl fullWidth variant="outlined">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            sx={{ height: '56px' }} // Match TextField height
          >
            <MenuItem value="AM">AM</MenuItem>
            <MenuItem value="PM">PM</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
     
        <Button variant="outlined" onClick={() => setOpenTable(prev => !prev)}>
          {openTable ? 'Close Table' : 'Open Table'}
        </Button>
        <Button variant="outlined" onClick={() => setReminderApp(prev => !prev)}>
          {reminderApp ? 'Close Reminder' : 'Open Reminder'}
        </Button>
        <Button variant="contained" color="primary" onClick={LoadReminders}>Load Reminders</Button>
        <Button variant="contained" color="secondary" onClick={AutoCreate}>Auto reassign</Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
        <TextField
          label="Slot"
          type="number"
          value={slotValue}
          onChange={(e) => setSlotValue(parseInt(e.target.value))}
          variant="outlined"
        />
        <TextField
          label="Rest"
          type="number"
          value={restValue}
          onChange={(e) => setRestValue(parseInt(e.target.value))}
          variant="outlined"
        />
        <TextField
          id="task"
          label="Enter time"
          variant="outlined"
          value={timeValue}
          onChange={(e) => setTimeValue(e.target.value)}
        />
      </Box>

      {/* Conditional rendering for tasks table and reminders */}
      <Box sx={{ display: 'flex', width: '100%' }}>
        {refresh && openTable && (
          <Box sx={{ width: '100%', pr: 2 }}>
            <TasksTable />
          </Box>
        )}
        {reminderApp && <Reminder />}
      </Box>
    </div>
  );
};

export default Entry;
