import * as React from "react";
import { Grid, Box, Skeleton } from "@mui/material";

function Media() {
  return (
    <Grid container wrap="nowrap">
      <Box sx={{ width: "90%", margin: 5, my: 5 }}>
        <Box sx={{ pt: 0.5 }}>
          <Skeleton width="20%" height={50} />
        </Box>
        <Skeleton variant="rectangular" height={600} />
      </Box>
    </Grid>
  );
}

export default function HomeSkeleton() {
  return (
    <Box sx={{ overflow: "hidden" }}>
      <Media />
    </Box>
  );
}
