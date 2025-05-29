import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Box,
  IconButton,
  CircularProgress,
  Switch,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { useRef } from "react";
import CloseIcon from '@mui/icons-material/Close';
import Replay5Icon from '@mui/icons-material/Replay5';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { format } from "date-fns";
import Timer from "./Timer";
import { InternationaltimeZone, portUrl, track } from "../../AppConfiguration";
import WYSIWYGEditor from "./WYSIWYGEditor";
import { searchFilters } from "./Search";

// Interfaces
export interface Task {
  id: number;

  title: string;
  description: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  category_id: number;
  not_completed: boolean;
  reassign: boolean
  weight: number;
  five: boolean;
  notes: string | null;
  habitId: number;
  date?: Date;
}

// Add interfaces for type safety
interface DraftBlock {
  key: string;
  text: string;
  type: string;
  depth: number;
  inlineStyleRanges: any[];
  entityRanges: any[];
  data: Record<string, any>;
}

interface RawDraftContent {
  blocks: DraftBlock[];
  entityMap: Record<string, any>;
}


const NOTIFICATION_SOUND = "/sounds/notification.mp3";

// Custom hook for auto-refresh
const useAutoRefresh = (callback: () => void, minutes: number) => {
  const [nextRefresh, setNextRefresh] = useState(minutes * 60);
  const [isActive, setIsActive] = useState(true);


  useState<NotificationPermission>("default");

  useEffect(() => {
    if (!isActive) return;

    const refreshInterval = setInterval(
      () => {
        callback();
        setNextRefresh(minutes * 60);
      },
      minutes * 60 * 1000
    );

    const countdownInterval = setInterval(() => {
      setNextRefresh((prev) => (prev <= 1 ? minutes * 60 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [callback, minutes, isActive]);

  return {
    nextRefresh,
    toggleRefresh: () => setIsActive((prev) => !prev),
    isActive,
  };
};

// Styled Components
const StyledTableHead = styled(TableHead)(({ theme }) => ({
  "& .MuiTableCell-head": {
    backgroundColor: "#E4E7EB",
    color: "#2D3748",
    fontWeight: 700,
    fontSize: "1rem",
    padding: theme.spacing(2),
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  color: "#4A5568",
  padding: theme.spacing(2),
}));

const InterruptedRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.warning.light + "40", // Color for cancelled tasks
  "&:hover": {
    backgroundColor: theme.palette.warning.light + "60",
  },
}));

const CompletedRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.success.light + "40", // Light green with 40% opacity
  "&:hover": {
    backgroundColor: theme.palette.success.light + "60", // Light green with 60% opacity on hover
  },
}));

const CompletedRowDarker = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.success.dark + "40", // Darker green with 40% opacity
  "&:hover": {
    backgroundColor: theme.palette.success.dark + "60", // Darker green with 60% opacity on hover
  },
}));

const CompletedRowLighter = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.success.light + "20", // Lighter green with 20% opacity
  "&:hover": {
    backgroundColor: theme.palette.success.light + "40", // Lighter green with 40% opacity on hover
  },
}));

const DisabledRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100] + "40",
  opacity: 0.8,
  position: 'relative',
  "&:hover": {
    backgroundColor: theme.palette.grey[200] + "60",
  },
  "& td": {
    color: theme.palette.text.disabled,
    fontStyle: 'bold',
  },
  "&::after": {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    width: '4px',
    height: '100%',
    backgroundColor: theme.palette.grey[400],
  }
}));




const CancelledRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.error.light + "40", // Color for interrupted tasks
  "&:hover": {
    backgroundColor: theme.palette.error.light + "60",
  },
}));

const HighlightedRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "completed",
})<{ completed?: boolean }>(({ theme, completed }) => ({
  backgroundColor: completed
    ? theme.palette.success.light + "40"
    : theme.palette.primary.light + "40",
  animation: "highlight 2s infinite",
  "@keyframes highlight": {
    "0%": {
      backgroundColor: completed
        ? theme.palette.success.light + "20"
        : theme.palette.primary.light + "20",
    },
    "50%": {
      backgroundColor: completed
        ? theme.palette.success.light + "40"
        : theme.palette.primary.light + "40",
    },
    "100%": {
      backgroundColor: completed
        ? theme.palette.success.light + "20"
        : theme.palette.primary.light + "20",
    },
  },
  "&:hover": {
    backgroundColor: completed
      ? theme.palette.success.light + "60"
      : theme.palette.primary.light + "60",
  },
}));


const HighlightedRowYellow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "completed",
})<{ completed?: boolean }>(({ theme, completed }) => ({
  backgroundColor: completed
    ? theme.palette.warning.light + "40"
    : theme.palette.warning.light + "40",
  animation: "highlightYellow 2s infinite",
  "@keyframes highlightYellow": {
    "0%": {
      backgroundColor: completed
        ? theme.palette.warning.light + "20"
        : theme.palette.warning.light + "20",
    },
    "50%": {
      backgroundColor: completed
        ? theme.palette.warning.light + "40"
        : theme.palette.warning.light + "40",
    },
    "100%": {
      backgroundColor: completed
        ? theme.palette.warning.light + "20"
        : theme.palette.warning.light + "20",
    },
  },
  "&:hover": {
    backgroundColor: completed
      ? theme.palette.warning.light + "60"
      : theme.palette.warning.light + "60",
  },
}));

const RegularRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: "#F8FAFC",
  },
  "&:nth-of-type(even)": {
    backgroundColor: "#F1F5F9",
  },
  "&:hover": {
    backgroundColor: "#E2E8F0",
    transition: "background-color 0.3s ease",
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

interface TasksTableProps {
  date?: string
  setBackDate?: React.Dispatch<React.SetStateAction<string>>
  search?: searchFilters

  // setSelectedCategory: (categoryId: number | null) => void;
}

function convertMinutesToHours(minutes:number) {
  const hours = Math.floor(minutes / 60); // Get the whole hours
  const remainingMinutes = minutes % 60;   // Get the remaining minutes
  return { hours, remainingMinutes };
}

// Example usage
const totalMinutes = 125;
const { hours, remainingMinutes } = convertMinutesToHours(totalMinutes);
console.log(`${totalMinutes} minutes is equal to ${hours} hours and ${remainingMinutes} minutes.`); // Output: "125 minutes is equal to 2 hours and 5 minutes."


export const TasksTable: React.FC<TasksTableProps> = ({ date, setBackDate, search }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  //Edit Task
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");


  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  const sound = new Audio('/sounds/brain-inplant.mp3');

  // Initialize audio and request notification permission
  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio(NOTIFICATION_SOUND);

    // Request notification permission
    const requestNotificationPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } catch (err) {
        console.error("Error requesting notification permission:", err);
      }
    };

    requestNotificationPermission();
  }, []);



  // Check for upcoming tasks and trigger notifications
  useEffect(() => {
    const checkUpcomingTasks = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      tasks.forEach((task) => {
        const [timeStr, modifier] = task.start_time.split(" ");
        let [hours, minutes] = timeStr.split(":").map(Number);

        // Convert to 24-hour format
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        // Check if task is starting now
        if (hours === currentHour && minutes === currentMinute) {
          // Play sound
          if (audioRef.current) {
            audioRef.current.play()
              .then(() => {
                // Set a timeout to stop the audio after 2 seconds
                setTimeout(() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }, 3000);
              })
              .catch((err) => console.error("Error playing sound:", err));
          }

          // Show notification
          if (notificationPermission === "granted") {
            new Notification("Task Starting", {
              body: `Time to start: ${task.title}`,
              icon: "/task-icon.png", // Add an icon to your public folder
            });
          }
        }
      });

  

      tasks.forEach((task) => {
        const [timeStr, modifier] = task.end_time.split(" ");
        let [hours, minutes] = timeStr.split(":").map(Number);

        // Convert to 24-hour format
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        // Check if task is starting now
        if (hours === currentHour && minutes === currentMinute) {
          // Play sound
          if (sound) {
            sound.play()
              .then(() => {
                // Set a timeout to stop the audio after 2 seconds
                setTimeout(() => {
                  if (sound) {
                    sound.pause();
                    sound.currentTime = 0;
                  }
                }, 2000);
              })
              .catch((err) => console.error("Error playing sound:", err));
          }

          // Show notification
          if (notificationPermission === "granted") {
            new Notification("Task Starting", {
              body: `Time to start: ${task.title}`,
              icon: "/task-icon.png", // Add an icon to your public folder
            });
          }
        }
      });
    };

    // Check every minute
    const intervalId = setInterval(checkUpcomingTasks, 60000);

    // Initial check
    checkUpcomingTasks();

    return () => clearInterval(intervalId);
  }, [tasks, notificationPermission]);

  // Fetch tasks function
  const fetchTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      let response;
      if (search) {
        response = await axios.post<Task[]>(
          `${portUrl}/tasks/gettasks`, {

          search: search
        }
        );


        setTasks(response.data);
        console.log('response123', response)
        setError(null);
      } else {
        response = await axios.post<Task[]>(
          `${portUrl}/tasks/gettasks`, {
          date: date ? date : null
        }
        );
        const sortedTasks = response.data.sort((a, b) => {
          const timeA = new Date(`2024-01-01 ${a.start_time}`).getTime();
          const timeB = new Date(`2024-01-01 ${b.start_time}`).getTime();
          return timeA - timeB;
        });

        setTasks(sortedTasks);
        setError(null);
      }



    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, date ? [date] : [search],);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, search]);

  // Auto-refresh setup
  const { nextRefresh, toggleRefresh, isActive } = useAutoRefresh(
    fetchTasks,
    5
  );

  // Update current time every minute
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Function to handle task completion toggle
  const handleTaskCompletion = async (Task: Task, completed: boolean, routine: boolean) => {
    try {
      await axios.put(`${portUrl}/tasks/tasks/${Task.id}`, {
        completed: !completed,
      });

      if (routine) {
        console.log("completed routine")

        await axios.post(`${portUrl}/habits/habits`, { taskName: Task.title, done: !completed, procrastinated: 0, weight: Task.weight, date: date ? date : format(new Date(), 'yyyy-MM-dd') })

      }



      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === Task.id ? { ...task, completed: !completed } : task
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
      // Optionally show error message to user
    }
  };

  const handleTaskNonCompletion = async (Task: Task, not_completed: boolean, routine: boolean) => {
    try {
      await axios.put(`${portUrl}/tasks/tasksNotCompleted/${Task.id}`, {
        not_completed: !not_completed,
      });

      if (routine) {
        console.log("not completed routine")

        await axios.post(`${portUrl}/habits/habits`, { taskName: Task.title, done: 0, procrastinated: !not_completed, weight: Task.weight, date: date ? date : format(new Date(), 'yyyy-MM-dd') })

      }



      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === Task.id ? { ...task, not_completed: !not_completed } : task
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
      // Optionally show error message to user
    }
  };

  const handle5minCompletion = async (Task: Task, five: boolean, routine: boolean) => {
    try {
      await axios.put(`${portUrl}/tasks/fiveCompleted/${Task.id}`, {
        five: !five,
      });

      if (routine) {
        console.log("not completed routine")

        await axios.post(`${portUrl}/habits/habits`, { taskName: Task.title, done: 1, procrastinated: 0, date: date ? date : format(new Date(), 'yyyy-MM-dd') })

      }



      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === Task.id ? { ...task, five: !five } : task
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
      // Optionally show error message to user
    }
  };

  const handleTaskReassign = async (Task: Task, reassign: boolean) => {
    try {
      await axios.put(`${portUrl}/tasks/reassign/${Task.id}`, {
        reassign: !reassign,
      });





      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === Task.id ? { ...task, reassign: !reassign } : task
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
      // Optionally show error message to user
    }
  };


  // Function to check if a time falls within a time slot
  const isCurrentTimeSlot = (startTime: string, endTime: string): boolean => {
    const convert12to24 = (time: string) => {
      const [timeStr, modifier] = time.split(" ");
      let [hours, minutes] = timeStr.split(":").map(Number);

      if (hours === 12) {
        hours = modifier === "PM" ? 12 : 0;
      } else if (modifier === "PM") {
        hours = hours + 12;
      }

      return { hours, minutes };
    };

    const start = convert12to24(startTime);
    const end = convert12to24(endTime);

    const currentMinutes =
      currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // In your TasksTable component, add this function
  const handleDeleteTask = async (taskId: number) => {
    try {
      await axios.delete(`${portUrl}/tasks/tasks/${taskId}`);
      // Update local state by filtering out the deleted task
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // In your TasksTable component, add this function
  const handleDeleteForeverTask = async (taskId: number) => {
    try {
      await axios.delete(`${portUrl}/tasks/deleteForever/${taskId}`);
      // Update local state by filtering out the deleted task
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Calculate time remaining for current task
  const getTimeRemaining = (endTime: string): string => {
    const [timeStr, modifier] = endTime.split(" ");
    let [hours, minutes] = timeStr.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const endDate = new Date();
    endDate.setHours(hours, minutes, 0);

    const diff = endDate.getTime() - currentTime.getTime();
    const minutesRemaining = Math.floor(diff / 60000);

    return `${minutesRemaining} minutes remaining`;
  };

  //Edit task handler
  const handleEditTask = async (taskId: number) => {
    try {
      const tasksResponse = editedTitle.trim().split("-");
      const startTime = tasksResponse[0].trim();
      const endTime = tasksResponse[1].trim();
      const taskName = tasksResponse[2].trim();
      const description = tasksResponse[3].trim();
      const weight = tasksResponse[4]?.trim();
      const date = new Date().toISOString().split("T")[0];

      await axios.put(`${portUrl}/tasks/tasksUpdate/${taskId}`, {
        start_time: startTime,
        end_time: endTime,
        description: description,
        title: taskName,
        date: date,
        weight: weight ? weight : 1,
        category: 1
      });

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, title: taskName, description: description, start_time: startTime, end_time: endTime, weight: parseInt(weight) } : task
        )
      );

      // Reset editing state
      setEditingTask(null);
      setEditedTitle("");

    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const [openWYS, setOpenWYS] = useState<number | null>(null)


  const renderDescription = (description: string) => {
    const descriptions = description.split(',').map(item => item.trim());

    return (
      <ol>
        {descriptions.map((desc, index) => (
          <li key={index}>{desc}</li>
        ))}
      </ol>
    );
  };

  const TitleSpan = styled('span')<{ isDuplicate: boolean }>(({ isDuplicate }) => ({
    color: isDuplicate ? '#FF0000' : 'inherit',
    fontWeight: isDuplicate ? 'bold' : 'normal'
  }));


  // Helper function to clean content
  const cleanContent = (content: string): string => {
    try {
      const parsed = JSON.parse(content);

      // Handle blockMap format
      if (parsed.blockMap) {
        return Object.values(parsed.blockMap)
          .map((block: any) => block.text)
          .join('\n');
      }

      // Handle blocks format
      if (parsed.blocks) {
        return parsed.blocks.map((block: any) => block.text).join('\n');
      }

      // If neither format is found, return the original content
      return content;
    } catch (e) {
      return content;
    }
  };

  function minutesBetweenTimes(start: string, end: string): number {
    // Define the time format
    const timeFormat = "hh:mm A"; // 12-hour format with AM/PM

    // Function to parse time string into Date object
    const parseTime = (timeStr: string): Date => {
      const [time, modifier] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      const date = new Date();

      // Set hours and minutes accordingly
      let adjustedHours = hours % 12; // Convert 12 PM/AM to 0
      if (modifier === "PM") {
        adjustedHours += 12; // Convert PM to 24-hour format
      }
      date.setHours(adjustedHours, minutes, 0, 0); // Set hours, minutes, seconds, milliseconds
      return date;
    };

    // Parse the start and end times
    const startTime = parseTime(start);
    const endTime = parseTime(end);

    // Calculate the difference in milliseconds and convert to minutes
    const difference = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Convert milliseconds to minutes
    return difference;
  }




  // Calculate total minutes spent on LeetCode tasks
  const calculateMinutes = (taskName: string) => {
    return tasks.reduce((total, task) => {
      if (task.title.toLowerCase().includes(taskName) && task.completed) {
        const duration = minutesBetweenTimes(task.start_time, task.end_time)
        return total + duration;
      }
      return total;
    }, 0);
  };

  // Calculate the total minutes for LeetCode tasks







  const renderEditForm = () => {
    if (!editingTask) return null;



    return (<TableRow>
      <TableCell colSpan={5} style={{ padding: 0 }}>
        <Box sx={{ display: 'flex', width: '100%', p: 1 }}>
          <TextField
            fullWidth
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            variant="outlined"
            size="small"
            sx={{ flex: 1, mr: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleEditTask(editingTask.id)}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setEditingTask(null)}
              sx={{ ml: 1 }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </TableCell>
    </TableRow>)


  };



  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "#4A5568" }}>
        <CircularProgress size={24} color="inherit" />
        <Box mt={2}>Loading tasks...</Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center", color: "error.main" }}>
        Error: {error}
        <IconButton onClick={fetchTasks} color="primary" sx={{ ml: 2 }}>
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={toggleRefresh}
              color="primary"
            />
          }
          label="Auto-refresh"
        />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Refresh tasks">
            <IconButton
              onClick={fetchTasks}
              disabled={refreshing}
              sx={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {date && <Button variant="contained"
        color="primary" onClick={() => setBackDate && setBackDate('')}>({date}) - Close</Button>}

      <TableContainer
        component={Paper}

        sx={{
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: 2,
          backgroundColor: "#F8FAFC",
          maxHeight: 800
        }}
      >

        <Table stickyHeader sx={{ minWidth: 650 }} aria-label="tasks table">
          <StyledTableHead>
            <TableRow>
              {search && <StyledTableCell>Date</StyledTableCell>}
              <StyledTableCell>Start Time</StyledTableCell>
              <StyledTableCell>End Time</StyledTableCell>
              <StyledTableCell>Task</StyledTableCell>
              <StyledTableCell>Description ||Dedicated to</StyledTableCell>
              <StyledTableCell>Yes</StyledTableCell>
              <StyledTableCell>No</StyledTableCell>
              <StyledTableCell>Time</StyledTableCell>
              <StyledTableCell>Edit</StyledTableCell>
              <StyledTableCell>5-Min</StyledTableCell>
              <StyledTableCell>S.Del</StyledTableCell>
              <StyledTableCell>Notes</StyledTableCell>
            </TableRow>
          </StyledTableHead>


          <TableBody>
            {tasks.map((task) => {
              const isCurrentTime = isCurrentTimeSlot(
                task.start_time,
                task.end_time
              );

              const Cancelled = task.not_completed
              const completed = task.completed
              const containsInterrupted = task.title.toLowerCase().includes("interrupt");
              const Routine = task.title.toLowerCase().includes("i get to do it");// Dicipline,selflessness,detachment,Enjoy, 
              const five = task.five

              let RowComponent = RegularRow; // Default row

              // Determine which row component to use based on the title

              if (containsInterrupted) {
                RowComponent = InterruptedRow; // Use InterruptedRow if the title matches
              }

              if (Routine) {
                RowComponent = DisabledRow;
              }


              if (isCurrentTime) {
                RowComponent = HighlightedRow; // Use HighlightedRow if it's the current time
              }
              if (Cancelled) {
                RowComponent = CancelledRow; // Use CancelledRow if the title matches
              }

              if (Routine && isCurrentTime) {
                RowComponent = HighlightedRowYellow

              }




              if (completed) {
                RowComponent = CompletedRowDarker;
              }

              if (five) {
                RowComponent = CompletedRowLighter;
              }
              if (Routine && completed) {
                RowComponent = CompletedRow

              }

              // const RowComponent = isCurrentTime ? HighlightedRow : RegularRow;



              return (
                editingTask?.id === task.id ? <>{renderEditForm()}</> :
                  <Tooltip
                    key={task.id}
                    title={isCurrentTime ? getTimeRemaining(task.end_time) : ""}
                    arrow
                    placement="top"
                  >
                    <RowComponent >
                      {search && task.date && <StyledTableCell><>{task.date}</></StyledTableCell>}
                      <StyledTableCell>
                        {(() => {
                          // Get current time in EST
                          const currentTime = new Date().toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: InternationaltimeZone
                          });

                          // Convert times to comparable format (minutes since midnight)
                          const convertTimeToMinutes = (timeStr: string) => {
                            const [time, period] = timeStr.split(' ');
                            let [hours, minutes] = time.split(':').map(Number);

                            // Convert to 24 hour format
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;

                            return hours * 60 + minutes;
                          };

                          const endTimeMinutes = convertTimeToMinutes(task.end_time);
                          const currentTimeMinutes = convertTimeToMinutes(currentTime);

                          return endTimeMinutes < currentTimeMinutes ? (
                            <span style={{ color: '#FF0000', marginLeft: '4px', fontSize: '20px' }}>? </span>
                          ) : null;
                        })()}
                        {task.start_time}

                      </StyledTableCell>

                      <StyledTableCell>{task.end_time}</StyledTableCell>
                      <StyledTableCell>
                        <TitleSpan isDuplicate={task.title.toLowerCase().includes('duplicate')}>
                          {task.title}
                        </TitleSpan>
                      </StyledTableCell>
                      <StyledTableCell> {renderDescription(task.description)}</StyledTableCell>
                      <StyledTableCell >
                        <Checkbox
                          disabled={search ? true : false}
                          checked={task.completed}
                          onChange={() =>
                            handleTaskCompletion(task, task.completed, task.title.toLowerCase().includes("i get to do it"))
                          }
                          color="primary"
                        />
                      </StyledTableCell>
                      <StyledTableCell >
                        <Checkbox
                          disabled={search ? true : false}
                          checked={task.not_completed}
                          onChange={() =>
                            handleTaskNonCompletion(task, task.not_completed, task.title.toLowerCase().includes("i get to do it"))
                          }
                          color="secondary"
                          checkedIcon={<CloseIcon />}
                        />
                      </StyledTableCell>
                      <StyledTableCell >
                        <Checkbox
                          disabled={search ? true : false}
                          checked={task.reassign}
                          onChange={() =>
                            handleTaskReassign(task, task.reassign)
                          }
                          color="secondary"
                          checkedIcon={<CloseIcon />}
                        />
                        <>{!(Routine || task.start_time == 'T:0') && <>
                          <div style={{
                            border: '2px solid #007bff', // Blue border
                            borderRadius: '4px',
                            padding: '4px 8px',
                            backgroundColor: '#e6f3ff', // Light blue background
                            display: 'inline-block' // Makes the div wrap content
                          }}>
                            <b>
                              {isCurrentTime ? getTimeRemaining(task.end_time) : ""}
                            </b>

                          </div>
                        </>}
                          {task.start_time == 'T:0' && <Timer minutes={parseInt(task.end_time.split(':')[1], 10)} />}


                        </>
                      </StyledTableCell>
                      <StyledTableCell>
                        <ModeEditIcon onClick={() => {
                          setEditingTask(task);
                          setEditedTitle(`${task.start_time} -  ${task.end_time} - ${task.title} - ${task.description} - ${task.weight}`);

                        }} />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Checkbox
                          disabled={search ? true : false}
                          checked={task.five}
                          onChange={() =>
                            handle5minCompletion(task, task.five, task.title.toLowerCase().includes("i get to do it"))
                          }
                          color="secondary"
                          checkedIcon={<Replay5Icon />}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        {!Routine && <DeleteForeverIcon
                          onClick={() => handleDeleteForeverTask(task.id)}

                          sx={{
                            color: 'red',
                            cursor: 'pointer',
                            '&:hover': {
                              color: '#d32f2f'  // darker red on hover
                            }
                          }}
                        />}


                        <Typography variant="body2" color="text.secondary">
                          {task.weight || 0} pts
                        </Typography>





                      </StyledTableCell>
                      <StyledTableCell>
                        <Button
                          onClick={() => setOpenWYS(task.id)}
                          variant={task.notes ? "contained" : "outlined"}
                          color={task.notes ? "primary" : "inherit"}
                          sx={{
                            '&:hover': {
                              backgroundColor: task.notes ? 'primary.dark' : 'rgba(0, 0, 0, 0.04)'
                            },
                            minWidth: '120px'
                          }}
                        >
                          {task.notes ? 'Open Notes' : 'New Notes'}
                        </Button>
                        {task.notes && (
                          <Typography
                            sx={{
                              mt: 1,
                              color: 'text.secondary',
                              fontSize: '0.875rem',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {cleanContent(task.notes)}
                          </Typography>
                        )}
                        {openWYS === task.id && <WYSIWYGEditor key={task.id} taskId={task.id} notes={task.notes} habit={Routine} date={date} Task={task} setTasks={setTasks} open={openWYS ? true : false} onClose={() => setOpenWYS(null)}

                        />}</StyledTableCell>
                    </RowComponent>
                  </Tooltip>
              );
            })}
          </TableBody>

        </Table>
      </TableContainer>
{/* tracking*/}
      {<>{track.map((task)=>{
        const totalMinutes = calculateMinutes(task);
        const { hours, remainingMinutes } = convertMinutesToHours(totalMinutes);
        
        {return(
        <Box
        key={task}
        sx={{
          padding: 2,
          border: '1px solid #ccc',
          borderRadius: 1,
          backgroundColor: '#f9f9f9',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h6"
          component="span"
          color="text.primary"
          fontWeight="bold"
        >
          Total {task} Minutes:
        </Typography>
        <Typography
          variant="h6"
          component="span"
          color="primary"
          sx={{ marginLeft: 1 }}
        >
          {`${totalMinutes} minutes = ${hours} hours and ${remainingMinutes} minutes`}
        </Typography>
      </Box>)}})}

    
      
      </>}








      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "text.secondary",
          fontSize: "0.875rem",
        }}
      >
        <Box>Last updated: {currentTime.toLocaleTimeString()}</Box>
        {isActive && (
          <Box>
            Next refresh in: {Math.floor(nextRefresh / 60)}:
            {(nextRefresh % 60).toString().padStart(2, "0")}
          </Box>
        )}
      </Box>
    </Box>
  );
}
