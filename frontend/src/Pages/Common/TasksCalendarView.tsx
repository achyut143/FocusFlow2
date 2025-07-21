import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    IconButton,
    CircularProgress,
    Switch,
    FormControlLabel,
    Tooltip,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import axios from "axios";
import RefreshIcon from "@mui/icons-material/Refresh";
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import CloseIcon from '@mui/icons-material/Close';
import Replay5Icon from '@mui/icons-material/Replay5';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import NoteIcon from '@mui/icons-material/Note';
import LoopIcon from '@mui/icons-material/Loop';
import { format } from "date-fns";
import { portUrl, InternationaltimeZone } from "../../AppConfiguration";
import WYSIWYGEditor from "./WYSIWYGEditor";
import "./TasksCalendarView.css";

// Import Task interface from TasksTable
export interface Task {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    completed: boolean;
    category_id: number;
    not_completed: boolean;
    reassign: boolean;
    weight: number;
    five: boolean;
    notes: string | null;
    habitId: number;
    date?: Date;
    repeat_again: number | null;
}

interface TasksCalendarViewProps {
    date?: string;
    setBackDate?: React.Dispatch<React.SetStateAction<string>>;
    search?: any;
}

// Custom hook for auto-refresh
const useAutoRefresh = (callback: () => void, minutes: number) => {
    const [nextRefresh, setNextRefresh] = useState(minutes * 60);
    const [isActive, setIsActive] = useState(true);

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

// Helper function to convert various time formats to minutes since midnight
const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    // Standardize the time format for consistent parsing
    let standardTime = timeStr.trim();

    // Format: "9:00 AM" or "9:00 PM" (with space)
    if (standardTime.includes(' ')) {
        const [time, modifier] = standardTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes)) return 0;

        // Adjust hours for PM
        if (modifier.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
        }
        // Adjust for 12 AM
        if (modifier.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }

        return hours * 60 + minutes;
    }

    // Format: "9:00AM" or "9:00PM" (no space)
    if (standardTime.toUpperCase().includes('AM') || standardTime.toUpperCase().includes('PM')) {
        const isPM = standardTime.toUpperCase().includes('PM');
        standardTime = standardTime.toUpperCase().replace('AM', '').replace('PM', '');

        let [hours, minutes] = standardTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;

        // Adjust hours for PM
        if (isPM && hours < 12) {
            hours += 12;
        }
        // Adjust for 12 AM
        if (!isPM && hours === 12) {
            hours = 0;
        }

        return hours * 60 + minutes;
    }

    // Format: "09:00" (24-hour format)
    if (standardTime.includes(':')) {
        let [hours, minutes] = standardTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 0;

        return hours * 60 + minutes;
    }

    return 0;
};

// Helper function to format minutes to time display in EST
const formatTimeDisplay = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
};

// Styled components
const CalendarContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    position: "relative",
}));

const TimeSlot = styled(Box)<{ isCurrentTime?: boolean }>(({ theme, isCurrentTime }) => ({
    // borderBottom: `1px solid ${theme.palette.divider}`,
    // padding: theme.spacing(0.5),
    position: "relative",
    padding: "0px",
    height: "30px",
    backgroundColor: isCurrentTime ? theme.palette.primary.light + "20" : "transparent",
    transition: "background-color 0.3s ease",
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const TimeLabel = styled(Typography)(({ theme }) => ({
    position: "absolute",
    left: theme.spacing(1),
    top: "-10px",
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    padding: "0 4px",
    zIndex: 1,
}));

const TaskItem = styled(Box)<{
    completed?: boolean;
    notCompleted?: boolean;
    five?: boolean;
    isCurrentTask?: boolean;
}>(({ theme, completed, notCompleted, five, isCurrentTask }) => ({
    backgroundColor: completed
        ? theme.palette.success.light + "80"
        : notCompleted
            ? theme.palette.error.light + "80"
            : five
                ? theme.palette.info.light + "80"
                : isCurrentTask
                    ? theme.palette.primary.light + "80"
                    : theme.palette.primary.light + "40",
    borderRadius: theme.shape.borderRadius,
    // padding: theme.spacing(0.75),
    position: "absolute",
    overflow: "visible", // Changed from hidden to visible so buttons don't get cut off
    cursor: "grab",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
    transition: "all 0.3s cubic-bezier(.25,.8,.25,1)",
    "&:hover": {
        boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
        zIndex: 50,
    },
    display: "flex",
    flexDirection: "column",
    maxHeight: "calc(100% - 4px)", // Prevent overflow beyond the slot height
    minHeight: "20px",
}));

const TaskActions = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "flex-end",
    flexWrap: "wrap", // Allow buttons to wrap to next line if needed
    gap: theme.spacing(0.5),
    marginTop: "auto",
    position: "relative", // Ensure proper stacking context
    zIndex: 200, // Much higher z-index for buttons
}));

// Style for action buttons to ensure visibility
const ActionButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: "rgba(255, 255, 255, 0.9)", // More opaque background
    margin: "2px",
    padding: "4px",
    "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 1)",
    },
    zIndex: 300, // Much higher z-index to ensure visibility
    position: "relative", // Ensure proper stacking
}));

export const TasksCalendarView: React.FC<TasksCalendarViewProps> = ({ date, setBackDate, search }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [hideRoutine, setHideRoutine] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editedTitle, setEditedTitle] = useState<string>("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editRepeatDays, setEditRepeatDays] = useState<number | null>(null);
    const [openWYS, setOpenWYS] = useState<number | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<number[]>([]);

    // Text-to-speech function
    const speakText = (text: string) => {
        const speech = new SpeechSynthesisUtterance(text);
        speech.rate = 1;
        speech.pitch = 1;
        speech.volume = 1;
        window.speechSynthesis.speak(speech);
    };

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
                setError(null);
            } else {
                response = await axios.post<Task[]>(
                    `${portUrl}/tasks/gettasks`, {
                    date: date ? date : null
                }
                );
                // Normalize time formats before sorting
                const normalizedTasks = response.data.map(task => {
                    // Ensure consistent time format
                    if (task.start_time && task.end_time) {
                        const startMinutes = timeToMinutes(task.start_time);
                        const endMinutes = timeToMinutes(task.end_time);

                        // Format times consistently
                        task.start_time = formatTimeDisplay(startMinutes);
                        task.end_time = formatTimeDisplay(endMinutes);
                    }
                    return task;
                });

                const sortedTasks = normalizedTasks.sort((a, b) => {
                    const minutesA = timeToMinutes(a.start_time);
                    const minutesB = timeToMinutes(b.start_time);
                    return minutesA - minutesB;
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
    }, date ? [date] : [search]);

    // Initial fetch
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks, search]);

    // Auto-scroll to current time marker when component loads
    useEffect(() => {
        if (!loading) {
            setTimeout(() => {
                const marker = document.getElementById('current-time-marker');
                if (marker) {
                    // Scroll to the marker with offset to position it in the middle of the viewport
                    const offset = window.innerHeight / 2;
                    const markerPosition = marker.offsetTop - offset;



                    // Scroll the container element that has overflow:auto
                    const container = document.querySelector('.calendar-view-container');
                    if (container) {
                        console.log('testing')
                        console.log(marker)
                        console.log(markerPosition)
                        container.scrollTo({
                            top: markerPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 500); // Small delay to ensure DOM is ready
        }
    }, [loading]);

    // Auto-refresh setup
    const { nextRefresh, toggleRefresh, isActive } = useAutoRefresh(
        fetchTasks,
        5
    );

    // Update current time every minute in EST
    useEffect(() => {
        const updateTimeInEST = () => {
            const options = { timeZone: InternationaltimeZone };
            const estTime = new Date(new Date().toLocaleString('en-US', options));
            setCurrentTime(estTime);
        };

        updateTimeInEST(); // Initial call
        const timeInterval = setInterval(updateTimeInEST, 60000);

        return () => clearInterval(timeInterval);
    }, []);

    // Check for upcoming tasks and trigger notifications
    useEffect(() => {
        const checkUpcomingTasks = () => {
            const options = { timeZone: InternationaltimeZone };
            const now = new Date(new Date().toLocaleString('en-US', options));
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            tasks.forEach((task) => {
                const startMinutes = timeToMinutes(task.start_time);
                const hours = Math.floor(startMinutes / 60);
                const minutes = startMinutes % 60;

                // Check if task is starting now
                if (hours === currentHour && minutes === currentMinute) {
                    speakText(`Time to start: ${task.title}, from ${task.start_time} to ${task.end_time}`);
                }
            });

            tasks.forEach((task) => {
                const endMinutes = timeToMinutes(task.end_time);
                const hours = Math.floor(endMinutes / 60);
                const minutes = endMinutes % 60;

                // Check if task is ending now
                if (hours === currentHour && minutes === currentMinute) {
                    speakText(`Time to end: ${task.title}, from ${task.start_time} to ${task.end_time}`);
                }
            });
        };

        // Check every minute
        const intervalId = setInterval(checkUpcomingTasks, 60000);

        // Initial check
        checkUpcomingTasks();

        return () => clearInterval(intervalId);
    }, [tasks]);

    // Function to handle task completion toggle
    const handleTaskCompletion = async (task: Task, completed: boolean, routine: boolean) => {
        try {
            await axios.put(`${portUrl}/tasks/tasks/${task.id}`, {
                completed: !completed,

            });

            if (routine ) {

                await axios.post(`${portUrl}/habits/habits`, {
                    taskName: task.title,
                    done: !completed,
                    procrastinated: 0,
                    weight: task.weight,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd')
                });

                if (task.repeat_again && !task.reassign) {

                    createNext(task);
                }


            }

            // Provide audio feedback using text-to-speech
            if (!completed) {
                speakText(`Task completed: ${task.title}, from ${task.start_time} to ${task.end_time}`);
            }

            // Update local state
            setTasks((prevTasks) =>
                prevTasks.map((t) =>
                    t.id === task.id ? { ...t, completed: !completed } : t
                )
            );
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const createNext = async (task: any) => {
        // const nextOccurence = calculateNextOccurrence(task.repeat_again!)

        const today = new Date(task.date);
        today.setDate(today.getDate() + task.repeat_again!);


        const nextOccurence = today.toISOString().split('T')[0];

        //insert
        await axios.post(`${portUrl}/tasks/tasks`, {
            title: task.title,
            description: task.description,
            start_time: task.start_time,
            end_time: task.end_time,
            completed: false,
            category_id: 1, // Modify as needed
            weight: task.weight,
            date: nextOccurence,
            ...(task.repeat_again && { repeat: task.repeat_again })
        });
    }

    const createNotCompletedTask = async (task: any) => {
        // const nextOccurence = calculateNextOccurrence(task.repeat_again!)

        const today = new Date(task.date);
        today.setDate(today.getDate() + 1);


        const nextOccurence = today.toISOString().split('T')[0];

        //insert
        await axios.post(`${portUrl}/tasks/tasks`, {
            title: task.title,
            description: task.description,
            start_time: task.start_time,
            end_time: task.end_time,
            completed: false,
            category_id: 1, // Modify as needed
            weight: task.weight,
            date: nextOccurence
        });
    }



    const handleTaskNonCompletion = async (task: Task, not_completed: boolean, routine: boolean) => {
        try {
            await axios.put(`${portUrl}/tasks/tasksNotCompleted/${task.id}`, {
                not_completed: !not_completed,
            });

            if (!task.title.toLowerCase().includes("i get to do it") && !not_completed && !task.reassign) {
                createNotCompletedTask(task)

            }

            if (routine) {
                await axios.post(`${portUrl}/habits/habits`, {
                    taskName: task.title,
                    done: 0,
                    procrastinated: !not_completed,
                    weight: task.weight,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd')
                });

                if (task.repeat_again && !task.reassign) {

                    createNext(task);
                }
            }

            // Provide audio feedback using text-to-speech
            if (!not_completed) {
                speakText(`Task marked as not completed: ${task.title}, from ${task.start_time} to ${task.end_time}`);
            }

            // Update local state
            setTasks((prevTasks) =>
                prevTasks.map((t) =>
                    t.id === task.id ? { ...t, not_completed: !not_completed } : t
                )
            );
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const handle5minCompletion = async (task: Task, five: boolean, routine: boolean) => {
        try {
            await axios.put(`${portUrl}/tasks/fiveCompleted/${task.id}`, {
                five: !five,
            });

            if (routine ) {
                await axios.post(`${portUrl}/habits/habits`, {
                    taskName: task.title,
                    done: 1,
                    procrastinated: 0,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd')
                });
            }

            // Provide audio feedback using text-to-speech
            if (!five) {
                speakText(`5-minute rule applied to: ${task.title}, from ${task.start_time} to ${task.end_time}`);
            }

            // Update local state
            setTasks((prevTasks) =>
                prevTasks.map((t) =>
                    t.id === task.id ? { ...t, five: !five } : t
                )
            );
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    const handleDeleteTask = async (taskId: number, title: string) => {
        try {
            if (title.toLowerCase().includes("i get to do it")) {
                await axios.delete(`${portUrl}/tasks/tasks/${taskId}`);
                await axios.post(`${portUrl}/tasks/deletehabitTask`, {
                    title: title
                });
            } else {
                await axios.delete(`${portUrl}/tasks/tasks/${taskId}`);
                // Update local state by filtering out the deleted task


            }
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));


        } catch (err) {
            console.error("Error deleting task:", err);
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

    const handleEditTask = async () => {
        if (!editingTask) return;

        try {
            const tasksResponse = editedTitle.trim().split("-");
            const startTime = tasksResponse[0].trim();
            const endTime = tasksResponse[1].trim();
            const taskName = tasksResponse[2].trim();
            const description = tasksResponse[3].trim();
            const weight = tasksResponse[4]?.trim();
            const currentDate = date || new Date().toISOString().split("T")[0];

            await axios.put(`${portUrl}/tasks/tasksUpdate/${editingTask.id}`, {
                start_time: startTime,
                end_time: endTime,
                description: description,
                title: taskName,
                date: currentDate,
                weight: weight ? weight : 1,
                category: 1,
                repeat: editRepeatDays
            });

            // Update local state
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === editingTask.id ? {
                        ...task,
                        title: taskName,
                        description: description,
                        start_time: startTime,
                        end_time: endTime,
                        weight: parseFloat(weight || "1"),
                        repeat_again: editRepeatDays
                    } : task
                )
            );

            // Reset editing state
            setEditingTask(null);
            setEditedTitle("");
            setEditRepeatDays(null);
            setEditDialogOpen(false);
        } catch (err) {
            console.error("Error updating task:", err);
        }
    };

    // Function to handle drag start
    const handleDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    // Function to handle drag over
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    // Function to handle drop
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, timeSlot: number) => {
        e.preventDefault();
        if (!draggedTask) return;

        // Calculate new start and end times
        const startMinutes = timeSlot;
        const taskDuration = timeToMinutes(draggedTask.end_time) - timeToMinutes(draggedTask.start_time);
        const endMinutes = startMinutes + taskDuration;

        const newStartTime = formatTimeDisplay(startMinutes);
        const newEndTime = formatTimeDisplay(endMinutes);

        try {
            await axios.put(`${portUrl}/tasks/tasksUpdate/${draggedTask.id}`, {
                start_time: newStartTime,
                end_time: newEndTime,
                title: draggedTask.title,
                description: draggedTask.description,
                date: date || format(new Date(), 'yyyy-MM-dd'),
                weight: draggedTask.weight,
                category: draggedTask.category_id
            });

            // Provide audio feedback
            speakText(`Task ${draggedTask.title} moved to ${newStartTime} - ${newEndTime}`);

            // Update local state
            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task.id === draggedTask.id ? {
                        ...task,
                        start_time: newStartTime,
                        end_time: newEndTime
                    } : task
                )
            );
        } catch (err) {
            console.error("Error updating task time:", err);
        }

        setDraggedTask(null);
    };

    // Function to check if a time is current in EST
    const isCurrentTimeSlot = (hour: number, minute: number): boolean => {
        const options = { timeZone: InternationaltimeZone };
        const now = new Date(new Date().toLocaleString('en-US', options));
        return now.getHours() === hour && Math.floor(now.getMinutes() / 15) * 15 === minute;
    };

    // Function to check if a task is current in EST
    const isCurrentTask = (startTime: string, endTime: string): boolean => {
        if (!startTime || !endTime) return false;

        const options = { timeZone: InternationaltimeZone };
        const now = new Date(new Date().toLocaleString('en-US', options));
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        // Handle overnight tasks (when end time is before start time)
        if (endMinutes < startMinutes) {
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    // Calculate time remaining for current task
    const getTimeRemaining = (endTime: string): string => {
        if (!endTime) return "";

        const endMinutes = timeToMinutes(endTime);
        const options = { timeZone: InternationaltimeZone };
        const now = new Date(new Date().toLocaleString('en-US', options));
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Handle overnight tasks
        let minutesRemaining = endMinutes - currentMinutes;
        if (minutesRemaining < 0) {
            minutesRemaining += 24 * 60; // Add a full day of minutes
        }

        // Convert to hours and minutes format
        const hoursRemaining = Math.floor(minutesRemaining / 60);
        const remainingMinutes = minutesRemaining % 60;

        if (hoursRemaining > 0) {
            return `${hoursRemaining}h ${remainingMinutes}m remaining`;
        } else {
            return `${minutesRemaining}m remaining`;
        }
    };

    // Generate time slots for the day (24 hours with 15-minute intervals)
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) {
            timeSlots.push({ hour, minute });
        }
    }

    // Position a task in the calendar with improved overlapping handling
    const positionTask = (task: Task) => {
        // Ensure we have valid time strings
        if (!task.start_time || !task.end_time) {
            console.error('Invalid task times:', task);
            return { top: '0px', height: '30px', width: 'calc(100% - 70px)', left: '60px', zIndex: 10 };
        }

        const startMinutes = timeToMinutes(task.start_time);
        const endMinutes = timeToMinutes(task.end_time);
        console.log('description', task.title, startMinutes, endMinutes)

        // Handle case where end time is before start time (overnight tasks)
        const duration = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60 - startMinutes) + endMinutes;

        // Find all tasks that overlap with this task
        const overlappingTasks = tasks.filter(t => {
            if (hideRoutine && t.title.toLowerCase().includes("i get to do it")) {
                return false;
            }

            const tStart = timeToMinutes(t.start_time);
            const tEnd = timeToMinutes(t.end_time);

            // Handle overnight tasks when checking overlap
            if (tEnd < tStart) {
                // This is an overnight task
                if (endMinutes < startMinutes) {
                    // Both are overnight tasks
                    return true; // They will always overlap somewhere in the 24h period
                } else {
                    // Current task is not overnight
                    return tStart < endMinutes || tEnd > startMinutes;
                }
            } else if (endMinutes < startMinutes) {
                // Current task is overnight, other is not
                return tStart < endMinutes || tEnd > startMinutes;
            }

            // Normal case - both tasks are within same day
            return (tStart < endMinutes && tEnd > startMinutes);
        });

        // Find position of this task in the overlapping tasks
        const position = overlappingTasks.findIndex(t => t.id === task.id);
        const totalOverlapping = overlappingTasks.length;

        // Calculate width and left position
        const taskWidth = totalOverlapping > 1 ?
            `calc((100% - 70px) / ${totalOverlapping})` :
            "calc(100% - 70px)";

        const leftPosition = totalOverlapping > 1 ?
            `calc(60px + ${position} * ((100% - 70px) / ${totalOverlapping}))` :
            "60px";

        // Calculate exact position based on 15-minute intervals
        // Each 15-minute interval is 60px tall
        const slotHeight = 30; // height of each 15-minute slot
        const slotIndex = Math.floor(startMinutes / 5);



        return {
            top: `${slotIndex * slotHeight}px`,
            height: `${Math.max(1, Math.ceil(duration / 5)) * slotHeight}px`,
            width: taskWidth,
            left: leftPosition,
            zIndex: position + 10, // Dynamic z-index based on position
        };
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

    const filteredTasks = tasks.filter(task => !hideRoutine || !task.title.toLowerCase().includes("i get to do it"));

    return (
        <div className="calendar-view-container">
            <div className="calendar-header">
                <Typography variant="h6" className="calendar-title">
                    {date ? `Tasks for ${date}` : 'Current Tasks'}
                </Typography>
                <div className="calendar-controls">
                    {date && (
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                                const marker = document.getElementById('current-time-marker');
                                if (marker) {
                                    // Scroll to the marker with offset to position it in the middle of the viewport
                                    const offset = window.innerHeight / 2;
                                    const markerPosition = marker.offsetTop - offset;
                                    console.log('testing')
                                    console.log(marker)
                                    console.log(markerPosition)

                                    // Scroll the container element that has overflow:auto
                                    const container = document.querySelector('.calendar-view-container');
                                    if (container) {
                                        console.log("working", markerPosition)

                                        container.scrollTo({
                                            top: markerPosition,
                                            behavior: 'smooth'
                                        });
                                    }
                                }
                            }}
                            size="small"
                        >
                            Back to Current
                        </Button>
                    )}
                    <Tooltip title="Refresh tasks">
                        <IconButton
                            onClick={fetchTasks}
                            disabled={refreshing}
                            size="small"
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
                </div>
            </div>

            <div className="calendar-filters">
                <div className="filter-group">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isActive}
                                onChange={toggleRefresh}
                                color="primary"
                                size="small"
                            />
                        }
                        label="Auto-refresh"
                    />
                </div>
                <div className="filter-group">
                    <FormControlLabel
                        control={
                            <Switch
                                checked={hideRoutine}
                                onChange={() => setHideRoutine(!hideRoutine)}
                                color="secondary"
                                size="small"
                            />
                        }
                        label="Hide 'I get to do it'"
                    />
                </div>
            </div>

            {isActive && (
                <div className="refresh-info">
                    <span>Last updated: {currentTime.toLocaleTimeString('en-US', { timeZone: InternationaltimeZone })}</span>
                    <span>Next refresh in: {Math.floor(nextRefresh / 60)}:{(nextRefresh % 60).toString().padStart(2, "0")}</span>
                </div>
            )}

            <CalendarContainer>
                {/* Current time indicator */}
                <Box
                    id="current-time-marker"
                    sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        borderTop: '2px solid #f44336',
                        zIndex: 5,
                        top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / 5 * 30}px`,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            position: 'absolute',
                            left: '4px',
                            transform: 'translateY(-50%)',
                        }}
                    >
                        {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: InternationaltimeZone
                        })}
                    </Box>
                </Box>
                <div className="calendar-day-view">
                    {timeSlots.map((slot, index) => {
                        const hour = slot.hour;
                        const minute = slot.minute;
                        const timeString = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
                        const slotMinutes = hour * 60 + minute;
                        const isCurrentTime = isCurrentTimeSlot(hour, minute);

                        return (
                            <TimeSlot
                                key={index}
                                isCurrentTime={isCurrentTime}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, slotMinutes)}
                            >
                                {minute === 0 && (
                                    <TimeLabel>{timeString}</TimeLabel>
                                )}
                            </TimeSlot>
                        );
                    })}

                    {filteredTasks.map((task) => {
                        const style = positionTask(task);
                        const current = isCurrentTask(task.start_time, task.end_time);
                        const routine = task.title.toLowerCase().includes("i get to do it") || task.repeat_again ? true : false;

                        return (
                            <TaskItem
                                key={task.id}
                                style={style}
                                completed={task.completed}
                                notCompleted={task.not_completed}
                                five={task.five}
                                isCurrentTask={current}
                                draggable
                                onDragStart={() => handleDragStart(task)}
                                title={`${task.title} (${task.start_time} - ${task.end_time})`}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.85rem', lineHeight: 1.2 }}>
                                    <Box sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '6px',
                                        maxWidth: '100%',
                                        padding: '4px'
                                    }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '6px',
                                            flexGrow: 1
                                        }}>
                                            {/* Task Title */}
                                            <Box sx={{
                                                backgroundColor: 'rgba(255,255,255,0.9)',
                                                borderRadius: '8px',
                                                padding: '4px 10px',
                                                border: '2px solid #6a9eda',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                                                maxWidth: '100%',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: '#2c3e50'
                                            }}>
                                                {task.title}
                                            </Box>

                                            {/* Weight Indicator */}
                                            <Box sx={{
                                                backgroundColor: task.weight > 7 ? '#ff7675' :
                                                    task.weight > 4 ? '#fdcb6e' : '#74b9ff',
                                                color: task.weight > 7 ? '#fff' :
                                                    task.weight > 4 ? '#7d5a00' : '#fff',
                                                fontWeight: 'bold',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid #fff',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                fontSize: '0.75rem',
                                                flexShrink: 0
                                            }}>
                                                {task.weight}
                                            </Box>

                                            {/* Time Range */}
                                            <Box sx={{
                                                backgroundColor: 'rgba(116,185,255,0.2)',
                                                color: '#2980b9',
                                                borderRadius: '20px',
                                                padding: '2px 10px',
                                                border: '1px solid rgba(116,185,255,0.5)',
                                                fontSize: '0.75rem',
                                                fontWeight: 'medium',
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexShrink: 0,
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                {task.start_time} - {task.end_time}
                                            </Box>

                                            {/* Repeat Indicator */}
                                            {task.repeat_again && (
                                                <Box sx={{
                                                    backgroundColor: 'rgba(46,213,115,0.2)',
                                                    color: task.reassign ? 'red' : '#2ed573',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid rgba(46,213,115,0.5)',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    position: 'relative',
                                                    flexShrink: 0
                                                }}>
                                                    <LoopIcon fontSize="small" onClick={() =>
                                                        handleTaskReassign(task, task.reassign)
                                                    } />
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: '-8px',
                                                            right: '-8px',
                                                            backgroundColor: '#2ed573',
                                                            color: 'white',
                                                            borderRadius: '50%',
                                                            width: '16px',
                                                            height: '16px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.6rem',
                                                            fontWeight: 'bold',
                                                            border: '1px solid white'
                                                        }}
                                                    >
                                                        {task.repeat_again}
                                                    </Typography>
                                                </Box>
                                            )}



                                            {/* Description (if available) */}
                                            {task.description && (
                                                <Box sx={{
                                                    backgroundColor: 'rgba(241,242,246,0.9)',
                                                    color: '#636e72',
                                                    borderRadius: '8px',
                                                    padding: '3px 8px',
                                                    border: '1px solid #dfe6e9',
                                                    fontStyle: 'italic',
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    {task.description}
                                                </Box>
                                            )}



                                        </Box>


                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px',
                                            flexShrink: 0
                                        }}>
                                            <ActionButton
                                                size="small"
                                                onClick={() => handleTaskCompletion(task, task.completed, routine)}
                                                color={task.completed ? "success" : "default"}
                                            >
                                                <CheckIcon fontSize="small" />
                                            </ActionButton>
                                            <ActionButton
                                                size="small"
                                                onClick={() => handleTaskNonCompletion(task, task.not_completed, routine)}
                                                color={task.not_completed ? "error" : "default"}
                                            >
                                                <CloseIcon fontSize="small" />
                                            </ActionButton>
                                            <ActionButton
                                                size="small"
                                                onClick={() => {
                                                    setEditingTask(task);
                                                    setEditedTitle(`${task.start_time} - ${task.end_time} - ${task.title} - ${task.description} - ${task.weight}`);
                                                    setEditRepeatDays(task.repeat_again);
                                                    setEditDialogOpen(true);
                                                }}
                                            >
                                                <ModeEditIcon fontSize="small" />
                                            </ActionButton>
                                            <ActionButton
                                                size="small"
                                                onClick={() => handleDeleteTask(task.id, task.title)}
                                                color="error"
                                            >
                                                <DeleteForeverIcon fontSize="small" />
                                            </ActionButton>
                                            <ActionButton
                                                size="small"
                                                onClick={() => setOpenWYS(task.id)}
                                                color={task.notes ? "secondary" : "default"}
                                            >
                                                <NoteIcon fontSize="small" color={task.notes ? "secondary" : "action"} />
                                            </ActionButton>
                                        </Box>
                                    </Box>
                                </Typography>
                                <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.75rem', lineHeight: 1.2, mt: 0.5 }}>

                                </Typography>
                                {current && (
                                    <Typography variant="caption" sx={{
                                        display: 'block',
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                        bgcolor: 'rgba(0, 123, 255, 0.1)',
                                        borderRadius: '4px',
                                        padding: '1px 4px',
                                        mt: 0.25,
                                        mb: 0.5,
                                        width: 'fit-content',
                                        fontSize: '0.65rem',
                                        lineHeight: 1.1
                                    }}>
                                        {getTimeRemaining(task.end_time)}
                                    </Typography>
                                )}


                                {openWYS === task.id &&
                                    <WYSIWYGEditor
                                        key={task.id}
                                        taskId={task.id}
                                        notes={task.notes}
                                        habit={routine}
                                        date={date}
                                        Task={task}
                                        setTasks={setTasks}
                                        open={openWYS ? true : false}
                                        onClose={() => setOpenWYS(null)}
                                    />
                                }





                            </TaskItem>
                        );
                    })}
                </div>
            </CalendarContainer>

            {/* Edit Task Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 'bold', pb: 1 }}>Edit Task</DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                    <TextField
                        fullWidth
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        variant="outlined"
                        margin="dense"
                        label="Task Details"
                        placeholder="Start Time - End Time - Title - Description - Weight"
                        multiline
                        rows={4}
                        sx={{ mt: 2 }}
                        helperText="Format: Start Time - End Time - Title - Description - Weight (e.g., 9:00 AM - 10:00 AM - Meeting - Client discussion - 2)"
                    />

                    <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            Repeat Every
                        </Typography>
                        <TextField
                            type="number"
                            value={editRepeatDays !== null ? editRepeatDays : ''}
                            onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : null;
                                setEditRepeatDays(value);
                            }}
                            variant="outlined"
                            size="small"
                            InputProps={{
                                inputProps: { min: 1 },
                                endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>days</Typography>,
                            }}
                            sx={{ width: '150px' }}
                        />
                        {editRepeatDays && (
                            <Tooltip title="Clear repeat setting">
                                <IconButton onClick={() => setEditRepeatDays(null)} size="small">
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {editRepeatDays && (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                bgcolor: 'rgba(46,213,115,0.1)',
                                borderRadius: 1,
                                p: 1,
                                border: '1px solid rgba(46,213,115,0.3)'
                            }}>
                                <LoopIcon fontSize="small" sx={{ color: '#2ed573', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Task will repeat every {editRepeatDays} day{editRepeatDays !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setEditDialogOpen(false)} variant="outlined" size="large">Cancel</Button>
                    <Button onClick={handleEditTask} color="primary" variant="contained" size="large">Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default TasksCalendarView;