// WYSIWYGEditor.tsx
import React, { useEffect, useState } from 'react';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import axios from 'axios';
import { portUrl } from '../../AppConfiguration';
import { Task } from './TasksTable';
import { format } from 'date-fns';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    taskId: number;
    notes: string;
    habit: boolean;
    Task: Task;
    date?: string;
    open: boolean;  // Add this prop to control dialog visibility
    onClose: () => void;  // Add this prop to handle dialog closing
}

const WYSIWYGEditor: React.FC<Props> = ({ 
    taskId, 
    notes, 
    habit, 
    Task, 
    date, 
    open, 
    onClose 
}) => {

    console.log('inside',Task)
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const handleEditorChange = (state: EditorState) => {
        setEditorState(state);
    };

    useEffect(() => {
       
            try {
                const parsedNotes = JSON.parse(notes);
                const contentState = convertFromRaw({
                    entityMap: parsedNotes.entityMap,
                    blocks: Object.values(parsedNotes.blockMap)
                });
                const newEditorState = EditorState.createWithContent(contentState);
                setEditorState(newEditorState);
            } catch (error) {
                console.error("Error parsing notes:", error);
            }
        
    }, []);

    const saveToDatabase = async () => {
        const content = editorState.getCurrentContent();
        const rawContent = JSON.stringify(content);
        try {
            if (habit) {
                await axios.post(`${portUrl}/habits/notes`, {
                    notes: rawContent,
                    taskName: Task.title,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd'),
                    weight: Task.weight
                });
            } else {
                await axios.post(`${portUrl}/tasks/notes`, {
                    notes: rawContent,
                    id: taskId,
                });
            }
            onClose(); // Close dialog after successful save
        } catch (error) {
            console.error("Error saving notes:", error);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="notes-dialog-title"
        >
            <DialogTitle id="notes-dialog-title">
                Edit Notes
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div style={{ minHeight: '200px', border: '1px solid #ccc', padding: '10px' }}>
                    <Editor 
                        editorState={editorState} 
                        onChange={handleEditorChange}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={saveToDatabase} color="primary" variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WYSIWYGEditor;
