// TimeManagementAPP/frontend/src/Pages/Reminder.tsx
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import './Common/reminder.css';
import { portUrl } from '../AppConfiguration';

// Interface representing a reminder object
interface Reminder {
    id: number;
    task: string;
    date: string;
    time?: string;
    moved: boolean; // Indicates if the task has been moved
    repeat: 'none' | '3 days' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'; // Frequency of the reminder
    completed: boolean; // Indicates if the reminder is completed
}

// Interface for creating a new reminder
interface NewReminder {
    task: string;
    date: string;
    time?: string;
    repeat: 'none' | '3 days' |  'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
}

// Type for filtering reminders by date
type DateFilter = 'all' | 'week' | 'month';

// Base URL for the API
const API_BASE_URL = `${portUrl}/reminders`; // Adjust port as needed

const Reminder: React.FC = () => {
    // State variables
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newReminder, setNewReminder] = useState<NewReminder>({
        task: '',
        date: '',
        time: '',
        repeat: 'none'
    });
    const [editingReminder, setEditingReminder] = useState<NewReminder>({
        task: '',
        date: '',
        time: '',
        repeat: 'none'
    });
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');

    // Function to get date range based on the selected filter
    const getDateRange = (filter: DateFilter): { startDate: string, endDate: string } => {
        const today = new Date();
        const startDate = new Date(today);
        const endDate = new Date(today);

        switch (filter) {
            case 'week':
                endDate.setDate(today.getDate() + 7);
                break;
            case 'month':
                endDate.setMonth(today.getMonth() + 1);
                break;
            default:
                // For 'all', set a far future date
                endDate.setFullYear(today.getFullYear() + 1);
        }

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    };

    // Function to fetch reminders from the API
    const fetchReminders = async () => {
        try {
            setLoading(true);
            let response;

            // Fetch reminders based on the selected date filter
            if (dateFilter === 'all') {
                response = await axios.get(`${API_BASE_URL}/reminders`);
            } else {
                const { startDate, endDate } = getDateRange(dateFilter);
                response = await axios.get(`${API_BASE_URL}/reminders/range/${startDate}/${endDate}`);
            }

            setReminders(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch reminders');
            console.error('Error fetching reminders:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch reminders when the date filter changes
    useEffect(() => {
        fetchReminders();
    }, [dateFilter]);

    // Handle changes in the date filter selection
    const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
        setDateFilter(e.target.value as DateFilter);
    };

    // Handle input changes for new reminders
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewReminder(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission for adding/updating reminders
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newReminder.task || !newReminder.date) return; // Ensure task and date are provided

        try {
            // Update existing reminder or create a new one
            if (editingId !== null) {
                await axios.put(`${API_BASE_URL}/reminders/${editingId}`, {
                    ...newReminder,
                    completed: reminders.find(r => r.id === editingId)?.completed || false
                });
            } else {
                await axios.post(`${API_BASE_URL}/reminders`, {
                    ...newReminder,
                    completed: false
                });
            }

            // Reset new reminder input fields
            setNewReminder({
                task: '',
                date: '',
                time: '',
                repeat: 'none'
            });
            setEditingId(null);
            fetchReminders(); // Refresh reminders list
            setError(null);
        } catch (err) {
            setError(editingId ? 'Failed to update reminder' : 'Failed to create reminder');
            console.error('Error saving reminder:', err);
        }
    };

    // Handle editing of a reminder
    const handleEdit = (reminder: Reminder) => {
        setEditingId(reminder.id);
        setEditingReminder({
            task: reminder.task,
            date: reminder.date,
            time: reminder.time || '',
            repeat: reminder.repeat
        });
    };

    // Cancel editing mode
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingReminder({
            task: '',
            date: '',
            time: '',
            repeat: 'none'
        });
    };

    // Handle input changes for editing reminders
    const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingReminder(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle updating a reminder
    const handleUpdateReminder = async (id: number) => {
        try {
            await axios.put(`${API_BASE_URL}/reminders/${id}`, {
                ...editingReminder,
                completed: reminders.find(r => r.id === id)?.completed || false
            });
            setEditingId(null);
            fetchReminders(); // Refresh reminders list
            setError(null);
        } catch (err) {
            setError('Failed to update reminder');
            console.error('Error updating reminder:', err);
        }
    };

    // Handle deletion of a reminder
    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`${API_BASE_URL}/reminders/${id}`);
            fetchReminders(); // Refresh reminders list
            setError(null);
        } catch (err) {
            setError('Failed to delete reminder');
            console.error('Error deleting reminder:', err);
        }
    };

    // Calculate the next occurrence date based on the current date and repeat type
    const calculateNextOccurrence = (currentDate: string, repeatType: string): string => {
        const date = new Date(currentDate);

        switch (repeatType) {
            case '3 days':
                date.setDate(date.getDate() + 3);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'biweekly':
                date.setDate(date.getDate() + 14);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                return currentDate; // No repetition
        }

        return date.toISOString().split('T')[0]; // Return date in YYYY-MM-DD format
    };

    // Determine the current status of the task based on its date
    const getTaskStatus = (dateStr: string): 'past' | 'today' | 'future' => {
        const taskDate = new Date(dateStr + 'T00:00:00'); // Ensure local date interpretation
        const today = new Date();

        // Compare only the date parts
        const taskDateStr = taskDate.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        if (taskDateStr < todayStr) {
            return 'past';
        } else if (taskDateStr === todayStr) {
            return 'today';
        } else {
            return 'future';
        }
    };

    // Toggle the completion status of a reminder
    const toggleComplete = async (reminder: Reminder) => {
        try {
            // Toggle the current reminder's completion status
            await axios.put(`${API_BASE_URL}/reminders/${reminder.id}/toggle`);

            // Handle recurring reminders
            if (reminder.repeat !== 'none' && !reminder.completed) {
                const nextDate = calculateNextOccurrence(reminder.date, reminder.repeat);
                const newRecurringReminder = {
                    task: reminder.task,
                    date: nextDate,
                    time: reminder.time,
                    repeat: reminder.repeat,
                    completed: false
                };

                // Create the next occurrence
                await axios.post(`${API_BASE_URL}/reminders`, newRecurringReminder);
            }

            fetchReminders(); // Refresh reminders list
            setError(null);
        } catch (err) {
            setError('Failed to update reminder status');
            console.error('Error updating reminder:', err);
        }
    };

    // Show loading state if reminders are being fetched
    if (loading && reminders.length === 0) {
        return <div className="loading">Loading reminders...</div>;
    }

    // Component to render each reminder row
    const ReminderRow: React.FC<{ reminder: Reminder; isEditing: boolean; }> = ({ reminder, isEditing }) => {
        const taskStatus = getTaskStatus(reminder.date);
        if (isEditing) {
            return (
                <tr className="editing-row">
                    <td>
                        <input
                            type="checkbox"
                            checked={reminder.completed}
                            onChange={() => toggleComplete(reminder)}
                            disabled
                        />
                    </td>
                    <td>{reminder.moved ? 'moved' : ''}</td>
                    <td>
                        <input
                            type="text"
                            name="task"
                            value={editingReminder.task}
                            onChange={handleEditInputChange}
                            className="edit-input"
                            required
                        />
                    </td>
                    <td>
                        <input
                            type="date"
                            name="date"
                            value={editingReminder.date}
                            onChange={handleEditInputChange}
                            className="edit-input"
                            required
                        />
                    </td>
                    <td>
                        <input
                            type="time"
                            name="time"
                            value={editingReminder.time}
                            onChange={handleEditInputChange}
                            className="edit-input"
                        />
                    </td>
                    <td>
                        <select
                            name="repeat"
                            value={editingReminder.repeat}
                            onChange={handleEditInputChange}
                            className="edit-input"
                        >
                            <option value="none">No Repeat</option>
                            <option value="3 days">3 days</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </td>
                    <td>
                        {editingReminder.repeat !== 'none' ? calculateNextOccurrence(editingReminder.date, editingReminder.repeat) : 'N/A'}
                    </td>
                    <td className="action-buttons">
                        <button onClick={() => handleUpdateReminder(reminder.id)} className="save-btn">Save</button>
                        <button onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                    </td>
                </tr>
            );
        }

        return (
            <tr className={`${reminder.completed ? 'completed' : ''} ${!reminder.completed ? `status-${taskStatus}` : ''}`}>
                <td>
                    <input
                        type="checkbox"
                        checked={reminder.completed}
                        onChange={() => toggleComplete(reminder)}
                    />
                </td>
                <td>{reminder.moved ? 'moved' : ''}</td>
                <td>{reminder.task}</td>
                <td>{reminder.date}</td>
                <td>{reminder.time || 'No time set'}</td>
                <td>
                    <span className={`repeat-badge ${reminder.repeat}`}>
                        {reminder.repeat}
                    </span>
                </td>
                <td>
                    {reminder.repeat !== 'none' && !reminder.completed ? calculateNextOccurrence(reminder.date, reminder.repeat) : 'N/A'}
                </td>
                <td className="action-buttons">
                    <button onClick={() => handleEdit(reminder)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(reminder.id)} className="delete-btn">Delete</button>
                </td>
            </tr>
        );
    };

    return (
        <div className="app-container">
            <h1>Reminder App</h1>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="reminder-form">
                <input
                    type="text"
                    name="task"
                    placeholder="Enter task"
                    value={newReminder.task}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="date"
                    name="date"
                    value={newReminder.date}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="time"
                    name="time"
                    value={newReminder.time}
                    onChange={handleInputChange}
                    placeholder="Optional"
                />
                <select
                    name="repeat"
                    value={newReminder.repeat}
                    onChange={handleInputChange}
                >
                    <option value="none">No Repeat</option>
                    <option value="3 days">3 days</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                </select>
                <button type="submit">
                    {editingId !== null ? 'Update Reminder' : 'Add Reminder'}
                </button>
                {editingId !== null && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingId(null);
                            setNewReminder({
                                task: '',
                                date: '',
                                time: '',
                                repeat: 'none'
                            });
                        }}
                        className="cancel-btn"
                    >
                        Cancel Edit
                    </button>
                )}
            </form>
            <div className="filter-container">
                <select
                    value={dateFilter}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="all">All Reminders</option>
                    <option value="week">Next 7 Days</option>
                    <option value="month">Next 30 Days</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead className="sticky-header">
                        <tr>
                            <th>Status</th>
                            <th>Moved</th>
                            <th>Task</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Repeat</th>
                            <th>Next Occurrence</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reminders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="no-reminders">
                                    No reminders found for the selected period
                                </td>
                            </tr>
                        ) : (
                            reminders.map(reminder => (
                                <ReminderRow
                                    key={reminder.id}
                                    reminder={reminder}
                                    isEditing={editingId === reminder.id}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reminder;
