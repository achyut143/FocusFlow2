import React, { useEffect, useState, useCallback } from 'react';
import {
    Editor,
    EditorState,
    convertFromRaw,
    ContentState,
    convertToRaw,
    Modifier,
    DraftHandleValue,
    RichUtils,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import axios from 'axios';
import { portUrl } from '../../AppConfiguration';
import { Task } from './TasksCalendarView';
import { format } from 'date-fns';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Toolbar,
    Menu,
    MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    taskId: number;
    notes: string | null;
    habit: boolean;
    Task: Task;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    date?: string;
    open: boolean;
    onClose: () => void;
}

const colorStyleMap = {
    'COLOR-red': { color: 'red' },
    'COLOR-green': { color: 'green' },
    'COLOR-blue': { color: 'blue' },
    'COLOR-black': { color: 'black' },
    'COLOR-orange': { color: 'orange' },
    'COLOR-purple': { color: 'purple' },
};

const WYSIWYGEditor: React.FC<Props> = ({
    taskId,
    notes,
    habit,
    Task,
    setTasks,
    date,
    open,
    onClose,
}) => {
    const [editorState, setEditorState] = useState(EditorState.createEmpty());
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedColor, setSelectedColor] = useState<string>('black');
    const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

    // Debounced save function that waits 3 seconds before saving
    const debouncedSave = useCallback((state: EditorState) => {
        // Clear any existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        // Set a new timeout
        const timeout = setTimeout(() => {
            const content = state.getCurrentContent();
            const plainText = content.getPlainText().trim();

            const rawContent = convertToRaw(content);
            const contentToSave = {
                blocks: rawContent.blocks,
                entityMap: rawContent.entityMap || {}
            };

            const serializedContent = plainText ? JSON.stringify(contentToSave) : null;

            // Save to database
            saveContent(serializedContent);
        }, 20000); // 20 seconds delay

        setSaveTimeout(timeout);
    }, [saveTimeout, habit, Task, taskId, date, setTasks]);

    // Function to save content to database
    const saveContent = async (serializedContent: string | null) => {
        try {
            if (habit) {
                await axios.post(`${portUrl}/habits/notes`, {
                    notes: serializedContent,
                    taskName: Task.title,
                    date: date ? date : format(new Date(), 'yyyy-MM-dd'),
                    weight: Task.weight,
                });
            } else {
                await axios.post(`${portUrl}/tasks/notes`, {
                    notes: serializedContent,
                    id: taskId,
                });
            }
            setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, notes: serializedContent } : task));
            console.log('Auto-saved successfully');
        } catch (error) {
            console.error("Error auto-saving notes:", error);
        }
    };

    const handleEditorChange = (state: EditorState) => {
        setEditorState(state);
        //  debouncedSave(state);
    };

    const handlePastedText = (
        text: string,
        html: string | undefined,
        editorState: EditorState
    ): DraftHandleValue => {
        const selection = editorState.getSelection();
        const contentState = editorState.getCurrentContent();

        const newContentState = Modifier.replaceText(
            contentState,
            selection,
            text
        );

        const newEditorState = EditorState.push(
            editorState,
            newContentState,
            'insert-characters'
        );

        setEditorState(newEditorState);

        return 'handled';
    };

    useEffect(() => {
        if (notes) {
            try {
                const parsedNotes = JSON.parse(notes);
                let contentState;

                if (parsedNotes.blocks && parsedNotes.entityMap) {
                    contentState = convertFromRaw(parsedNotes);
                } else {
                    contentState = ContentState.createFromText(
                        typeof parsedNotes === 'string' ? parsedNotes : String(notes)
                    );
                }

                const newEditorState = EditorState.createWithContent(contentState);
                setEditorState(newEditorState);
            } catch (error) {
                const contentState = ContentState.createFromText(String(notes));
                const newEditorState = EditorState.createWithContent(contentState);
                setEditorState(newEditorState);
                console.error("Error parsing notes:", error);
            }
        }
    }, [notes]);

    // Cleanup timeout when component unmounts or dialog closes
    useEffect(() => {
        return () => {
            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }
        };
    }, [saveTimeout, open]);

    const saveToDatabase = async () => {
        const content = editorState.getCurrentContent();
        const plainText = content.getPlainText().trim();

        const rawContent = convertToRaw(content);
        const contentToSave = {
            blocks: rawContent.blocks,
            entityMap: rawContent.entityMap || {}
        };

        const serializedContent = plainText ? JSON.stringify(contentToSave) : null;

        try {
            await saveContent(serializedContent);
            // onClose();
        } catch (error) {
            console.error("Error saving notes:", error);
        }
    };

    // Formatting functions
    const toggleBold = () => {
        setEditorState(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
    };

    const toggleUnderline = () => {
        setEditorState(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
    };

    const toggleBulletPoints = () => {
        setEditorState(RichUtils.toggleBlockType(editorState, 'unordered-list-item'));
    };

    const handleColorClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        setEditorState(RichUtils.toggleInlineStyle(editorState, `COLOR-${color}`));
        setAnchorEl(null);
    };

    const colorOptions = ['red', 'green', 'blue', 'black', 'orange', 'purple'];

    return (
        <Dialog
            open={open}
            onClose={() => { saveToDatabase(); onClose() }}
            maxWidth="md"
            fullWidth
            aria-labelledby="notes-dialog-title"
        >
            <DialogTitle id="notes-dialog-title">
                Edit Notes
                <IconButton
                    aria-label="close"
                    onClick={() => { saveToDatabase(); onClose() }}
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
                <Toolbar>
                    <Button onClick={toggleBold}>Bold</Button>
                    <Button onClick={toggleUnderline}>Underline</Button>
                    <Button onClick={toggleBulletPoints}>Bullet Points</Button>
                    <Button onClick={handleColorClick}>Color</Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        {colorOptions.map(color => (
                            <MenuItem
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                style={{ color }}
                            >
                                {color}
                            </MenuItem>
                        ))}
                    </Menu>
                </Toolbar>
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
                        customStyleMap={colorStyleMap}
                    />

                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    saveToDatabase()
                    onClose()
                }} color="primary">
                    Close
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
