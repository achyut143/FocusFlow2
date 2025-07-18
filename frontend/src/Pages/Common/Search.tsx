import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { TasksTable } from "./TasksTable";
import SearchIcon from "@mui/icons-material/Search";

interface SearchProps {

}

export interface searchFilters {
  text: string,
  page?: number,
  limit?: number;
  notes?: boolean;
  unfinished?:boolean;
  startDate?: string;
  endDate?: string;
}

export const Search: React.FC<SearchProps> = ({ }) => {
const [searchText, setSearchText] = useState<searchFilters>(() => {
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  return { 
    text: '', 
    startDate: today, 
    endDate: today 
  };
})
  const [delayedText, setDelayedText] = useState<searchFilters>(searchText)
  // const [showresults,setShowResults] = useState(false)

 

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'primary.main' }}>
          Task Search
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth
              id="search-task-name" 
              label="Search by Task Name" 
              variant="outlined" 
              value={searchText.text} 
              onChange={(e) => setSearchText({ ...searchText, text: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              id="start-date"
              label="Start Date"
              type="date"
              value={searchText.startDate}
              onChange={(e) => setSearchText({ ...searchText, startDate: e.target.value })}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              id="end-date"
              label="End Date"
              type="date"
              value={searchText.endDate}
              onChange={(e) => setSearchText({ ...searchText, endDate: e.target.value })}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="notes-select-label">Include Notes</InputLabel>
              <Select
                labelId="notes-select-label"
                id="notes-select"
                value={searchText.notes ? "Yes" : "N/A"}
                label="Include Notes"
                onChange={(e) =>
                  setSearchText({ ...searchText, notes: e.target.value === "Yes" ? true : false })
                }
              >
                <MenuItem value={"Yes"}>Yes</MenuItem>
                <MenuItem value={"N/A"}>N/A</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="unfinished-tasks-label">Unfinished Tasks</InputLabel>
              <Select
                labelId="unfinished-tasks-label"
                id="unfinished-tasks-select"
                value={searchText.unfinished ? "Yes" : "N/A"}
                label="Unfinished Tasks"
                onChange={(e) =>
                  setSearchText({ ...searchText, unfinished: e.target.value === "Yes" ? true : false })
                }
              >
                <MenuItem value={"Yes"}>Yes</MenuItem>
                <MenuItem value={"N/A"}>N/A</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, alignItems: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => setDelayedText(searchText)}
              sx={{ 
                minWidth: 120, 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
              startIcon={<SearchIcon />}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
    
        <Box sx={{ mt: 3 }}>
          <TasksTable search={delayedText} />
        </Box>
 
    </Box>
  )

}