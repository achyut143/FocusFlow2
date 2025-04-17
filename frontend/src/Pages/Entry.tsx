import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from "@mui/material/Button";
import { Box, FormControl, MenuItem, Paper, Select, TextField, styled } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { TasksTable } from "./Common/TasksTable";
import { Points } from "./Common/Points";
import Reminder from "./Reminder";


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
  const [value, setValue] = useState("");

  const [slotValue, setSlotValue] = React.useState(25);
  const [restValue, setRestValue] = React.useState(1);
  const [timeValue, setTimeValue] = React.useState(() => {
    const now = new Date();
    return now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
    });
});

  const handleSlotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const slotV = event.target.value
    setSlotValue(parseInt(slotV));
  };

  const handleRestChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const restV = event.target.value
    setRestValue(parseInt(restV));
  };

 


  const [refresh, setRefresh] = useState(true);
  const [period, setPeriod] = useState(new Date().getHours() >= 12 ? 'PM' : 'AM');
  const [reminderApp, setReminderApp] = useState(false)
  const [openTable, setOpenTable] = useState(true)

  const AutoCreate = async () => {
    const response = await axios.post(
      "http://localhost:5000/tasks/createTimeForRemainingHabits",
      {
        slot: slotValue,
        rest: restValue,
        time: timeValue
      
      }
    );
    setRefresh(true);
    setValue("")

  }




  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      const tasksResponse = value.trim().split("-");

      if (tasksResponse.length <= 3) {
        const taskName = 'Not Timed Task';
        const description = tasksResponse[0].trim();

        const weight = tasksResponse[2].trim();


        const startTime = 'T:0';
        const endTime = tasksResponse[1] ? `T:${tasksResponse[1]?.trim()}` : 'T:25'

        const response = await axios.post(
          "http://localhost:5000/tasks/tasks",
          {
            title: taskName,
            description: description,
            start_time: startTime,
            end_time: endTime,
            completed: false,
            category_id: 1, // You can modify this based on your needs
            weight: weight ? weight : 1
          }
        );
        setRefresh(true);
        setValue("")

      }

      if (tasksResponse.length >= 4) {
        try {
          setRefresh(false);
          const startTime = `${tasksResponse[0].trim()} ${period}`;
          const endTime = `${tasksResponse[1].trim()} ${period}`;
          const taskName = tasksResponse[2].trim();
          const description = tasksResponse[3].trim();
          const weight = tasksResponse[4]?.trim();


          const response = await axios.post(
            "http://localhost:5000/tasks/tasks",
            {
              title: taskName,
              description: description,
              start_time: startTime,
              end_time: endTime,
              completed: false,
              category_id: 1, // You can modify this based on your needs
              weight: weight ? weight : 1
            }
          );
          setRefresh(true);
          setValue("")

        } catch (error) {
          console.error("Error creating task:", error);

          setRefresh(true);

        } finally {
          setRefresh(true);
          setValue("")
        }
      } else {

        setRefresh(true);
        setValue("")
      }
    }
  };

  return (
    <div>
      <span>
        <b>Format : </b>
      </span>
      <span style={{ backgroundColor: "yellow", color: "black" }}>
        <strong>StartTime</strong> - <strong>EndTime</strong> -
        <span style={{ color: "blue" }}> TaskName</span> -
        <span style={{ color: "green" }}> Description</span>
      </span>
      <br />
      <br />
      <Box sx={{ display: 'flex', width: '100%' }}>

        <Box sx={{ width: '80%' }}>
          <TextField
            id="task"
            label="Enter Task in above format and press enter"
            variant="outlined"
            fullWidth
            onChange={(e) => {
              setValue(e.target.value);
            }}
            value={value}
            onKeyDown={handleKeyDown}
          />
        </Box>
        <Box sx={{ width: '20%' }}>
          <FormControl fullWidth variant="outlined">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              //defaultValue={new Date().getHours() >= 12 ? 'PM' : 'AM'}
              sx={{ height: '56px' }}  // Match TextField height
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      <br></br>
      <Button variant="contained" onClick={() => setOpenTable(prev => !prev)}>{openTable ? <>Close Table</> : <>Open Table</>}</Button>
      <Button variant="outlined" onClick={() => setReminderApp(prev => !prev)}>{reminderApp ? <>Close Reminder</> : <>Open Reminder</>}</Button>
      <Button variant="contained" onClick={() => AutoCreate()}>Auto Create</Button>
      <TextField
        label="Slot"
        type="number"
        value={slotValue}
        onChange={handleSlotChange}
        variant="outlined"

      />
      <TextField
        label="Rest"
        type="number"
        value={restValue}
        onChange={handleRestChange}
        variant="outlined"

      />
         <TextField
            id="task"
            label="Enter time"
            variant="outlined"
            value={timeValue}
          
            onChange={(e) => {
              setTimeValue(e.target.value);
            }}
          
           
          />




      {/* <Grid size={4}>
          <Button variant="contained" color="primary">
            Submit Task
          </Button>
        </Grid> */}

      <Box sx={{ display: 'flex', width: '100%' }}>
        {refresh && (
          <>

            {openTable && <Box sx={{ width: '100%', pr: 2 }}>
              <TasksTable />

            </Box>}
          </>
        )}

        {reminderApp && <Reminder  ></Reminder>}
        {/* <Box sx={{ width: '20%' }}>
        <Points/>
  
  
  </Box> */}
      </Box>
    </div>
  );
};

export default Entry;
