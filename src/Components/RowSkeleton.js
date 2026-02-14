import * as React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

export default function RowSkeleton() {
  return (
    <Box sx={{ overflow: "hidden", px: 1.5, py: 1 }}>
      {[1, 2].map((item) => (
        <Stack key={item} direction="row" spacing={1} sx={{ py: 0.6 }}>
          <Skeleton variant="circular" width={20} height={20} />
          <Skeleton variant="text" width="24%" height={24} />
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="text" width="20%" height={24} />
          <Skeleton variant="rounded" width={95} height={22} />
        </Stack>
      ))}
    </Box>
  );
}
