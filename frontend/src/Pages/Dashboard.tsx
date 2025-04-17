
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Tooltip, Tab, Tabs } from '@mui/material';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';

interface HabitDay {
  taskName: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  not_completed_tasks: number;
}

interface HabitCalendarProps {
  habitData: HabitDay[];
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habitData }) => {
  const [selectedHabit, setSelectedHabit] = useState<string>('');
  
  const habitNames = Array.from(new Set(habitData.map(habit => habit.taskName)));
  
  useEffect(() => {
    if (habitNames.length > 0 && !selectedHabit) {
      setSelectedHabit(habitNames[0]);
    }
  }, [habitNames]);

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    // Use startOfDay to normalize the time to midnight
    return startOfDay(subDays(new Date(), 30 - i - 1));
  });

  const getStatusForDay = (date: Date) => {
    const dayData = habitData.find(habit => 
      habit.taskName === selectedHabit && 
      isSameDay(startOfDay(parseISO(habit.date)), startOfDay(date))
    );

    if (!dayData) return 'no-data';
    if (dayData.completed_tasks > 0) return 'completed';
    if (dayData.not_completed_tasks > 0) return 'procrastinated';
    return 'no-data';
  };

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
        {habitNames.map(habitName => (
          <Tab 
            key={habitName}
            label={habitName.slice(0,-16)}
            value={habitName}
          />
        ))}
      </Tabs>

      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 1,
        mb: 2
      }}>
        {last30Days.map((date) => (
          <Tooltip
            key={date.toISOString()}
            title={getTooltipText(date)}
            arrow
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingBottom: '100%',
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
                    fontSize: '0.7rem',
                    color: getStatusForDay(date) === 'no-data' ? '#666' : '#fff',
                    lineHeight: 1,
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                >
                  {format(date, 'd')}
                  <br />
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
          <Typography variant="caption">Completed</Typography>
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
          <Typography variant="caption">Procrastinated</Typography>
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
          <Typography variant="caption">No Data</Typography>
        </Box>
      </Box>
    </Paper>
  );
};



// Usage example
const Dashboard: React.FC = () => {
  const [habitData, setHabitData] = useState<HabitDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabitData = async () => {
      try {
        const response = await fetch('http://localhost:5000/tasks/graph');
        const data = await response.json();
        setHabitData(data);
      } catch (error) {
        console.error('Error fetching habit data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabitData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <HabitCalendar habitData={habitData} />
    </Box>
  );
};

export default Dashboard;


