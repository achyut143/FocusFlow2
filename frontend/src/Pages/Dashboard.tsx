import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Tooltip, Tab, Tabs, TextField, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { portUrl } from '../AppConfiguration';

interface HabitDay {
  taskName: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  not_completed_tasks: number;
}

interface HabitCalendarProps {
  habitData: HabitDay[];
  fromDate: Date;
  toDate: Date;
  setPercentage: React.Dispatch<React.SetStateAction<number>>;
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habitData, fromDate, toDate, setPercentage }) => {
  const [selectedHabit, setSelectedHabit] = useState<string>('');

  const handleDeleteHabit = async (title: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tab selection when clicking delete
    if (window.confirm(`Are you sure you want to delete habit "${title}"?`)) {
      try {
        await axios.post(`${portUrl}/tasks/deletehabitTask`, { title: title });
        // Refresh the page to show updated data
        window.location.reload();
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  const habitNames = Array.from(new Set(habitData.map(habit => habit.taskName)));

  useEffect(() => {
    if (habitNames.length > 0 && !selectedHabit) {
      setSelectedHabit(habitNames[0]);
    } else if (habitNames.length > 0 && !habitNames.includes(selectedHabit)) {
      // If the currently selected habit is no longer in the filtered list, select the first one
      setSelectedHabit(habitNames[0]);
    }
  }, [habitNames, selectedHabit]);

  // Generate array of dates between fromDate and toDate
  const getDatesInRange = (start: Date, end: Date) => {
    const dates = [];
    let currentDate = startOfDay(start);
    const lastDate = startOfDay(end);

    while (currentDate <= lastDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  const dateRange = getDatesInRange(fromDate, toDate);

  const getStatusForDay = (date: Date, habit: string = selectedHabit) => {
    // Find habit data for the selected habit and date
    const dayData = habitData.find(h =>
      h.taskName === habit &&
      isSameDay(startOfDay(parseISO(h.date)), startOfDay(date))
    );

    if (!dayData) return 'no-data';
    if (dayData.completed_tasks > 0) return 'completed';
    if (dayData.not_completed_tasks > 0) return 'procrastinated';
    return 'no-data';
  };

  const calculateStats = (habitName: string = selectedHabit) => {
    let completedCount = 0;
    let notCompletedCount = 0;
    let noDataCount = 0;

    dateRange.forEach(date => {
      const status = getStatusForDay(date, habitName);
      if (status === 'completed') {
        completedCount++;
      } else if (status === 'procrastinated') {
        notCompletedCount++;
      } else {
        noDataCount++;
      }
    });

    // Calculate percentage of completed tasks
    const totalDays = completedCount + notCompletedCount + noDataCount;
    const percentage = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;

    // Set the percentage in the parent component if this is for the selected habit
    if (habitName === selectedHabit) {
      setPercentage(percentage);
    }

    return { completedCount, notCompletedCount, noDataCount, percentage };
  };

  const { completedCount, notCompletedCount, noDataCount } = calculateStats();

  const getColorForStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return '#2da44e';
      case 'procrastinated':
        return '#f85149';
      default:
        return '#eee';
    }
  };

  const getTooltipText = (date: Date) => {
    const dayData = habitData.find(habit =>
      habit.taskName === selectedHabit &&
      isSameDay(startOfDay(parseISO(habit.date)), startOfDay(date))
    );

    if (!dayData) return `No data for ${format(date, 'MMM d')}`;

    return `${format(date, 'MMM d')}:
      ${dayData.completed_tasks} completed,
      ${dayData.not_completed_tasks} procrastinated`;
  };

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Habit Tracker
      </Typography>

      <Tabs
        value={selectedHabit}
        onChange={(_, newValue) => setSelectedHabit(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {habitNames.map(habitName => {
          const stats = calculateStats(habitName);
          const totalDays = stats.completedCount + stats.notCompletedCount + stats.noDataCount;
          return (
            <Tab
              key={habitName}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {habitName.replace("(I get to do it)", "")}

                  <Box
                    sx={{
                      ml: 1,
                      bgcolor: '#2da44e',
                      color: 'white',
                      borderRadius: '12px',
                      padding: '0 6px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      height: '18px'
                    }}
                  >
                    {stats.completedCount}/{totalDays} ({Math.round(stats.percentage)}%)
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteHabit(habitName, e)}
                    sx={{ ml: 1, p: 0.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
              value={habitName}
            />
          );
        })}
      </Tabs>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 1,
        mb: 2
      }}>
        {dateRange.map((date) => (
          <Tooltip
            key={date.toISOString()}
            title={getTooltipText(date)}
            arrow
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingBottom: '40%',
                backgroundColor: getColorForStatus(getStatusForDay(date)),
                borderRadius: 1,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                  zIndex: 1
                }
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '1rem',
                    color: getStatusForDay(date) === 'no-data' ? '#666' : '#fff',
                    lineHeight: 1,
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                >
                  {format(date, 'd')}

                  {format(date, 'MMM')}
                  <br />
                  {`${format(date, 'EEE')}`}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              backgroundColor: '#2da44e',
              borderRadius: 0.5,
              mr: 1
            }}
          />
          <Typography variant="caption">Completed: {completedCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              backgroundColor: '#f85149',
              borderRadius: 0.5,
              mr: 1
            }}
          />
          <Typography variant="caption">Procrastinated: {notCompletedCount}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 15,
              height: 15,
              backgroundColor: '#eee',
              borderRadius: 0.5,
              mr: 1
            }}
          />
          <Typography variant="caption">No Data: {noDataCount}</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Usage example
const Dashboard: React.FC = () => {
  const [habitData, setHabitData] = useState<HabitDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [percentage, setPercentage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHabitData, setFilteredHabitData] = useState<HabitDay[]>([]);

  useEffect(() => {
    const fetchHabitData = async () => {
      try {
        const fromDateStr = format(fromDate, 'yyyy-MM-dd');
        const toDateStr = format(toDate, 'yyyy-MM-dd');
        const response = await fetch(`${portUrl}/tasks/graph?fromDate=${fromDateStr}&toDate=${toDateStr}`);
        const data = await response.json();
        setHabitData(data);
        setFilteredHabitData(data);
      } catch (error) {
        console.error('Error fetching habit data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabitData();
  }, [fromDate, toDate]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHabitData(habitData);
    } else {
      const filtered = habitData.filter(habit =>
        habit.taskName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHabitData(filtered);
    }
  }, [searchTerm, habitData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          id="date-from"
          label="From Date"
          type="date"
          value={format(fromDate, 'yyyy-MM-dd')}
          onChange={(e) => setFromDate(parseISO(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          id="date-to"
          label="To Date"
          type="date"
          value={format(toDate, 'yyyy-MM-dd')}
          onChange={(e) => setToDate(parseISO(e.target.value))}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          id="habit-search"
          label="Search Habits"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            width: '300px'
          }}
        />
      </Box>
      <HabitCalendar habitData={filteredHabitData} fromDate={fromDate} toDate={toDate} setPercentage={setPercentage} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Completion Percentage: {percentage.toFixed(2)}%
      </Typography>
    </Box>
  );
};

export default Dashboard;