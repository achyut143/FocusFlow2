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

// Interfaces
interface Task {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    completed: boolean;
    category_id: number;
    not_completed: boolean;
    weight: number;
    five: boolean
}





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

interface TasksTableDatedProps {
    date: string
    setBackDate?: React.Dispatch<React.SetStateAction<string>>

    // setSelectedCategory: (categoryId: number | null) => void;
}

export const TasksTableDated: React.FC<TasksTableDatedProps> = ({ date, setBackDate }) => {
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

    // Initialize audio and request notification permission


    // Check for upcoming tasks and trigger notifications

    // Fetch tasks function
    const fetchTasks = useCallback(async () => {
        try {
            setRefreshing(true);
            const response = await axios.post<Task[]>(
                "http://localhost:5000/tasks/gettasks", {
                date: date
            }
            );


            const sortedTasks = response.data.sort((a, b) => {
                const timeA = new Date(`2024-01-01 ${a.start_time}`).getTime();
                const timeB = new Date(`2024-01-01 ${b.start_time}`).getTime();
                return timeA - timeB;
            });

            setTasks(sortedTasks);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch tasks");
            console.error("Error fetching tasks:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [date]);

    // Initial fetch
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);





    // Function to handle task completion toggle
    const handleTaskCompletion = async (Task: Task, completed: boolean, routine: boolean) => {
        try {
            await axios.put(`http://localhost:5000/tasks/tasks/${Task.id}`, {
                completed: !completed,
            });

            if (!completed && routine) {
                console.log("completed routine")

                await axios.post('http://localhost:5000/habits/habits', { taskName: Task.title, done: !completed, procrastinated: 0, weight: Task.weight, date: date })

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
            await axios.put(`http://localhost:5000/tasks/tasksNotCompleted/${Task.id}`, {
                not_completed: !not_completed,
            });

            if (!not_completed && routine) {
                console.log("not completed routine")

                await axios.post('http://localhost:5000/habits/habits', { taskName: Task.title, done: 0, procrastinated: !not_completed, weight: Task.weight, date: date })

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
            await axios.put(`http://localhost:5000/tasks/fiveCompleted/${Task.id}`, {
                five: !five,
            });

            if (!five && routine) {
                console.log("not completed routine")

                await axios.post('http://localhost:5000/habits/habits', { taskName: Task.title, done: 1, procrastinated: 0,weight: Task.weight, date: date })

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
            await axios.delete(`http://localhost:5000/tasks/tasks/${taskId}`);
            // Update local state by filtering out the deleted task
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
        } catch (err) {
            console.error("Error deleting task:", err);
        }
    };

    // In your TasksTable component, add this function
    const handleDeleteForeverTask = async (taskId: number) => {
        try {
            await axios.delete(`http://localhost:5000/tasks/deleteForever/${taskId}`);
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

            await axios.put(`http://localhost:5000/tasks/tasksUpdate/${taskId}`, {
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



            </Box>
            <Button variant="contained"
                color="primary" onClick={() => setBackDate && setBackDate('')}>({date}) - Close</Button>

            <TableContainer
                component={Paper}
                sx={{
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    borderRadius: 2,
                    backgroundColor: "#F8FAFC",
                }}
            >

                <Table stickyHeader sx={{ minWidth: 650,maxHeight:800 }} aria-label="tasks table">
                    <StyledTableHead>
                        <TableRow>
                            <StyledTableCell>Start Time</StyledTableCell>
                            <StyledTableCell>End Time</StyledTableCell>
                            <StyledTableCell>Task</StyledTableCell>
                            <StyledTableCell>Description</StyledTableCell>
                            <StyledTableCell align="center">Completed</StyledTableCell>
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
                                            <StyledTableCell>{task.start_time}</StyledTableCell>
                                            <StyledTableCell>{task.end_time}</StyledTableCell>
                                            <StyledTableCell>{task.title}</StyledTableCell>
                                            <StyledTableCell>{task.description}</StyledTableCell>
                                            <StyledTableCell align="center">
                                                <Checkbox
                                                    checked={task.completed}
                                                    onChange={() =>
                                                        handleTaskCompletion(task, task.completed, task.title.toLowerCase().includes("i get to do it"))
                                                    }
                                                    color="primary"
                                                />
                                                <Checkbox
                                                    checked={task.not_completed}
                                                    onChange={() =>
                                                        handleTaskNonCompletion(task, task.not_completed, task.title.toLowerCase().includes("i get to do it"))
                                                    }
                                                    color="secondary"
                                                    checkedIcon={<CloseIcon />}
                                                />
                                                {!Routine && <DeleteSweepIcon
                                                    onClick={() => handleDeleteTask(task.id)}
                                                />}
                                                <ModeEditIcon onClick={() => {
                                                    setEditingTask(task);
                                                    setEditedTitle(`${task.start_time} -  ${task.end_time} - ${task.title} - ${task.description} - ${task.weight}`);

                                                }} />
                                                <Checkbox
                                                    checked={task.five}
                                                    onChange={() =>
                                                        handle5minCompletion(task, task.five, task.title.toLowerCase().includes("i get to do it"))
                                                    }
                                                    color="secondary"
                                                    checkedIcon={<Replay5Icon />}
                                                />
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




                                                <>
                                                    <div>
                                                        {isCurrentTime ? getTimeRemaining(task.end_time) : ""}
                                                    </div>
                                                </>
                                            </StyledTableCell>
                                        </RowComponent>
                                    </Tooltip>
                            );
                        })}
                    </TableBody>

                </Table>
            </TableContainer>

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


            </Box>
        </Box>
    );
}
