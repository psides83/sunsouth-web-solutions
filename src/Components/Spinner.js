import * as React from 'react';
// import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CircularProgress, { circularProgressClasses, } from '@mui/material/CircularProgress';

// Inspired by the former Facebook spinners.
export default function Spinner(frame) {

    return (
      <React.Fragment>
      {
      frame === true
      ?
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", alignContent: "center", height: "100vh" }}>
        <CircularProgress
          variant="determinate"
          sx={{
            color: (theme) =>
              theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
              position: "absolute",
          }}
          size={40}
          thickness={4}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: "#FFDE00",
            animationDuration: '550ms',
            left: 0,
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: 'round',
            },
          }}
          size={40}
          thickness={4}
        />
      </Box>
      :
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", alignContent: "center", height: "100vh" }}>
        <CircularProgress
          variant="determinate"
          sx={{
            color: (theme) =>
              theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
              position: "absolute",
          }}
          size={40}
          thickness={4}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: "#FFDE00",
            animationDuration: '550ms',
            left: 0,
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: 'round',
            },
          }}
          size={40}
          thickness={4}
        />
      </div>
     }
     </React.Fragment>
    );
}

