import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import { TasksTable } from "./TasksTable"

interface SearchProps {

}

export interface searchFilters {
  text: string,
  page?: number,
  limit?: number;
  notes?: boolean;
  startDate?: string;
  endDate?:string;
}

export const Search: React.FC<SearchProps> = ({ }) => {
  const [searchText, setSearchText] = useState<searchFilters>({ text: '', notes: true, startDate: '',endDate:'' })
  const [delayedText, setDelayedText] = useState<searchFilters>(searchText)


  return <>
    <TextField id="outlined-basic" label="Search by Task Name" variant="outlined" value={searchText.text} onChange={(e) => setSearchText({ ...searchText, text: e.target.value })} sx={{ width: '40%' }} />

    {/* <TextField
      id="outlined-number"
      label="page"
      type="number"
      sx={{ width: '10%' }}
      value={searchText.page}
      onChange={(e) => setSearchText({ ...searchText, page: parseInt(e.target.value) })}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
    /> */}

    {/* <TextField
      id="outlined-number"
      label="limit"
      type="number"
      sx={{ width: '10%' }}
      value={searchText.limit}
      onChange={(e) => setSearchText({ ...searchText, limit: parseInt(e.target.value) })}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
    /> */}
  
  <TextField
      id="outlined-number"
      label="Start Date"
      type="date"
      sx={{ width: '20%' }}
      value={searchText.startDate}
      onChange={(e) => setSearchText({ ...searchText, startDate:e.target.value })}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
    />

<TextField
      id="outlined-number"
      label="End Date"
      type="date"
      sx={{ width: '20%' }}
      value={searchText.endDate}
      onChange={(e) => setSearchText({ ...searchText, endDate:e.target.value })}
      slotProps={{
        inputLabel: {
          shrink: true,
        },
      }}
    />


   
      <FormControl>
        <InputLabel id="demo-simple-select-label">Notes</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={searchText.notes ? "Yes" : "No"}
          label="Notes"
          onChange={(e) =>
            setSearchText({ ...searchText, notes: e.target.value === "Yes" ? true : false })
          }
        >
          <MenuItem value={"Yes"}>Yes</MenuItem>
          <MenuItem value={"No"}>No</MenuItem>

        </Select>
      </FormControl>
  

      <Button variant="contained" color="secondary" onClick={()=>setDelayedText(searchText)}>Search</Button>
    {delayedText.text && <TasksTable search={delayedText} />}

  </>

}