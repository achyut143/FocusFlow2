
import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Tooltip, Tab, Tabs, TextField } from '@mui/material';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import TasksCalendarView from './Common/TasksCalendarView';


interface PointsDay {
    date: string;
    completedPoints: number;
    notCompletedPoints: number;
    habitDonePoints: number;
    habitProcrastinatedPoints: number;
    totalPoints: number;
    totalPointsHabits: number;
}

interface PointsCalendarProps {
    pointsData: PointsDay[];
    setBackDate: React.Dispatch<React.SetStateAction<string>>
    fromDate: Date;
    toDate: Date;
}

const PointsCalendar: React.FC<PointsCalendarProps> = ({ pointsData, setBackDate, fromDate, toDate }) => {




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





    const getPointsForDate = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return pointsData.find(p => p.date === dateStr);
    };

    const totalPointsEarned = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const points = pointsData.find(p => p.date === dateStr);
        if (!points) return '0'
        const pointsEarned = (points.completedPoints + points.habitDonePoints)
        const pointsLost = (points.notCompletedPoints + points.habitProcrastinatedPoints)
        const net = pointsEarned - pointsLost
        const totalPointsForDay = (points.totalPoints + points.totalPointsHabits)
        const total = (pointsEarned - pointsLost).toFixed(2);
        return `${total}/${totalPointsForDay}`;
    };




    const getColorForPoints = (points: any) => {
        if (!points) return '#eee';  // No data
        const pointsEarned = (points.completedPoints + points.habitDonePoints)
        const pointsLost = (points.notCompletedPoints + points.habitProcrastinatedPoints)
        const totalPointsForDay = (points.totalPoints + points.totalPointsHabits)
        const total = (pointsEarned - pointsLost) * 100 / totalPointsForDay;

        // Handle negative percentage
        if (total < 0) return '#8b0000';  // Dark red

        // Color gradients for each 10% increment
        if (total >= 90) return '#00873E';  // Darkest green
        if (total >= 80) return '#2da44e';  // Dark green
        if (total >= 70) return '#3cb371';  // Medium sea green
        if (total >= 60) return '#66c085';  // Light green
        if (total >= 50) return '#ffa500';  // Orange
        if (total >= 40) return '#ff8c00';  // Dark orange
        if (total >= 30) return '#ff6347';  // Tomato
        if (total >= 20) return '#ff4500';  // Orange red
        if (total >= 10) return '#ff3333';  // Lighter red
        return '#f85149';  // Red for < 10%
    };



    const getTooltipText = (date: Date, just?: boolean) => {
        const dayData = pointsData.find(points =>
            isSameDay(startOfDay(parseISO(points.date)), startOfDay(date))
        );

        if (!dayData) return `No data for ${format(date, 'MMM d')}`;
        const pointsEarned = (dayData.completedPoints + dayData.habitDonePoints)
        const pointsLost = (dayData.notCompletedPoints + dayData.habitProcrastinatedPoints)
        const net = pointsEarned - pointsLost
        const totalPointsForDay = (dayData.totalPoints + dayData.totalPointsHabits)


        if (just) return `${((pointsEarned - pointsLost) * 100 / totalPointsForDay).toFixed(2)} %`

        return (
            <Typography variant="caption">
                Points Earned: {pointsEarned || 0} pts
                <br />
                Points Lost: {pointsLost || 0} pts
                <br />
                Net: {`${net}/${totalPointsForDay}`} pts
                <br />
                Percentage: {((pointsEarned - pointsLost) * 100 / totalPointsForDay).toFixed(2)} %

            </Typography>
        )



    };

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
                Points Tracker
            </Typography>



            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 2
            }}>
                {dateRange.map((date) => (

                    <Tooltip
                        key={date.toISOString()}

                        title={
                            <Box>
                                {getTooltipText(date)}
                            </Box>
                        }
                        arrow
                    >
                        <Box

                            sx={{
                                position: 'relative',
                                width: '100%',
                                paddingBottom: '60%',
                                backgroundColor: getColorForPoints(getPointsForDate(date)),
                                borderRadius: 1,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.1)',
                                    zIndex: 1
                                }
                            }}
                            onClick={() => setBackDate(format(date, 'yyyy-MM-dd'))}
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
                                        color: getPointsForDate(date) ? '#fff' : '#666',
                                        lineHeight: 1,
                                        textAlign: 'center',
                                        userSelect: 'none'
                                    }}
                                >
                                    <b>{totalPointsEarned(date) || 0}</b>

                                    <br />
                                    {format(date, 'd')} {format(date, 'MMM')}
                                    <br />
                                    {format(date, 'EEE')}
                                    <br />
                                    {getTooltipText(date, true)}
                                </Typography>
                            </Box>
                        </Box>
                    </Tooltip>
                ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#00873E',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">90-100%</Typography>
                </Box>
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
                    <Typography variant="caption">80-90%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#3cb371',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">70-80%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#66c085',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">60-70%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#ffa500',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">50-60%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#ff8c00',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">40-50%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#ff6347',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">30-40%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#ff4500',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">20-30%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#ff3333',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">10-20%</Typography>
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
                    <Typography variant="caption">0-10%</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 15,
                            height: 15,
                            backgroundColor: '#8b0000',
                            borderRadius: 0.5,
                            mr: 1
                        }}
                    />
                    <Typography variant="caption">Below 0%</Typography>
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
const PointsMetric: React.FC = () => {
    const [PointsData, setPointsData] = useState<PointsDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [backDate, setBackDate] = useState('')
    const [fromDate, setFromDate] = useState<Date>(subDays(new Date(), 30));
    const [toDate, setToDate] = useState<Date>(new Date())


    useEffect(() => {
        const fetchPointsData = async () => {
            try {
                const fromDateStr = format(fromDate, 'yyyy-MM-dd');
                const toDateStr = format(toDate, 'yyyy-MM-dd');
                const response = await fetch(`http://localhost:5000/tasks/pointsGraph?fromDate=${fromDateStr}&toDate=${toDateStr}`);
                const data = await response.json();
                setPointsData(data);
            } catch (error) {
                console.error('Error fetching points data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPointsData();
    }, [fromDate, toDate]);

    if (loading) {
        return <div>Loading...</div>;
    }



    return (
        <Box sx={{ p: 3 }}>
            {void console.log(backDate)}

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
            </Box>

            <PointsCalendar pointsData={PointsData} setBackDate={setBackDate} fromDate={fromDate} toDate={toDate} />
            {backDate && <TasksCalendarView date={backDate} key={backDate} setBackDate={setBackDate} />}
        </Box>
    );
};

export default PointsMetric;


