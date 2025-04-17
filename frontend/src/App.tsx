import React, { useEffect, useState } from "react";

import { Box, Container, Tab } from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Entry from "./Pages/Entry";
import Dashboard from "./Pages/Dashboard";
import PointsMetric from "./Pages/PointsMetric";

const App: React.FC = () => {
  const [value, setValue] = React.useState("1");



  

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
  
      <Box sx={{ width: "100%", typography: "body1" }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="lab API tabs example">
              <Tab label="Tasks" value="1" />
              <Tab label="Points Metric" value="2" />
              <Tab label="Habit Metrics" value="3" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <Entry />
          </TabPanel>
          <TabPanel value="2">
            <PointsMetric />
          </TabPanel>
          <TabPanel value="3">
            <Dashboard />
          </TabPanel>
        </TabContext>
      </Box>

  );
};

export default App;
