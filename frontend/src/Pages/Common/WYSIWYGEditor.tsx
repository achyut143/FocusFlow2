import React, { useEffect, useState } from 'react';
import { 
    Editor, 
    EditorState, 
    convertFromRaw, 
    ContentState, 
    convertToRaw,
    Modifier,
    DraftHandleValue 
} from 'draft-js';
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
    notes: string | null;
    habit: boolean;
    Task: Task;
    setTasks:React.Dispatch<React.SetStateAction<Task[]>>;
    date?: string;
    open: boolean;
    onClose: () => void;
}

const WYSIWYGEditor: React.FC<Props> = ({ 
    taskId, 
    notes, 
    habit, 
    Task, 
    setTasks,
    date, 
    open, 
    onClose 
}) => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const handleEditorChange = (state: EditorState) => {
        setEditorState(state);
    };

    // Updated handlePastedText with correct return type
    const handlePastedText = (
        text: string, 
        html: string | undefined, 
        editorState: EditorState
    ): DraftHandleValue => {
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();
        
        // Create new content state with the pasted text
        const newContentState = Modifier.replaceText(
            contentState,
            selection,
            text
        );

        // Create new editor state with the new content
        const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'insert-characters'
        );

        // Update the editor state
        setEditorState(newEditorState);
        
        // Return 'handled' to prevent the default paste behavior
        return 'handled';
    };

useEffect(() => {
    if (notes) {
        try {
            const parsedNotes = JSON.parse(notes);
            let contentState;
            
            // Handle both raw content and plain text
            if (parsedNotes.blocks && parsedNotes.entityMap) {
                contentState = convertFromRaw(parsedNotes);
            } else if (parsedNotes.blockMap) {
                // Convert blockMap format to blocks format
                const blocks = Object.values(parsedNotes.blockMap).map((block: any) => ({
                    key: block.key || Math.random().toString(36).substr(2, 4),
                    text: block.text || '',
                    type: block.type || 'unstyled',
                    depth: block.depth || 0,
                    inlineStyleRanges: block.inlineStyleRanges || [],
                    entityRanges: block.entityRanges || [],
                    data: block.data || {}
                }));
                
                const rawContent = {
                    blocks: blocks,
                    entityMap: parsedNotes.entityMap || {}
                };
                
                contentState = convertFromRaw(rawContent);
            } else {
                // Handle plain text
                contentState = ContentState.createFromText(
                    typeof parsedNotes === 'string' ? parsedNotes : String(notes)
                );
            }
            
            const newEditorState = EditorState.createWithContent(contentState);
            setEditorState(newEditorState);
        } catch (error) {
            // If parsing fails, treat it as plain text
            const contentState = ContentState.createFromText(String(notes));
            const newEditorState = EditorState.createWithContent(contentState);
            setEditorState(newEditorState);
            console.error("Error parsing notes:", error);
        }
    }
}, [notes]);

// Update the saveToDatabase function
const saveToDatabase = async () => {
    const content = editorState.getCurrentContent();
 

    const plainText = content.getPlainText().trim();
    
    // If there's no content, send null
    if (!plainText) {
        try {
            if (habit) {
                await axios.post(`${portUrl}/habits/notes`, {
                    notes: null,
                    taskName: Task.title,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd'),
                    weight: Task.weight
                });
            } else {
                await axios.post(`${portUrl}/tasks/notes`, {
                    notes: null,
                    id: taskId,
                });
            }
            setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, notes:null } : task));
            onClose();
            return;
        } catch (error) {
            console.error("Error saving notes:", error);
        }
    }

    const rawContent = convertToRaw(content);
    
    // Ensure we're creating a proper structure
    const contentToSave = {
        blocks: rawContent.blocks,
        entityMap: rawContent.entityMap || {}
    };
    
    const serializedContent = JSON.stringify(contentToSave);
    
    try {
        if (habit) {
            await axios.post(`${portUrl}/habits/notes`, {
                notes: serializedContent,
                taskName: Task.title,
                date: date ? date : format(new Date(), 'yyyy-MM-dd'),
                weight: Task.weight
            });
        } else {
            await axios.post(`${portUrl}/tasks/notes`, {
                notes: serializedContent,
                id: taskId,
            });
        }
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, notes: serializedContent } : task));
        onClose();
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
                <div style={{ 
                    minHeight: '200px', 
                    border: '1px solid #ccc', 
                    padding: '10px',
                    borderRadius: '4px'
                }}>
                    <Editor 
                        editorState={editorState} 
                        onChange={handleEditorChange}
                        handlePastedText={handlePastedText}
                    />
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button 
                    onClick={saveToDatabase} 
                    color="primary" 
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WYSIWYGEditor;
