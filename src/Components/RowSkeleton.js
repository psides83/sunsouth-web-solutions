import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';


function Media() {

  return (
    <Grid container wrap="nowrap">
      <Box sx={{ width: 800, margin: 5, my: 5 }}>
      
          <Skeleton variant="text" width="100%" height={50} />
      </Box>
    </Grid>
  );
}

export default function YouTube() {
  return (
    <Box sx={{ overflow: 'hidden' }}>
      <Media />
      <Media />
    </Box>
  );
}