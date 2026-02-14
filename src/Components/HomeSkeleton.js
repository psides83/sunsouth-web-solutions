import * as React from "react";
import { Box, Card, Skeleton, Stack } from "@mui/material";

export default function HomeSkeleton() {
  return (
    <Box sx={{ overflow: "hidden", p: { xs: 1, sm: 2 } }}>
      <Card sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid", borderColor: "divider" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Skeleton variant="text" width={220} height={36} />
            <Skeleton variant="text" width={300} height={24} />
          </Box>
          <Skeleton variant="rounded" width={130} height={34} />
        </Stack>

        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Skeleton variant="rectangular" height={44} />
          {[1, 2, 3, 4, 5].map((row) => (
            <Stack
              key={row}
              direction="row"
              spacing={1}
              sx={{
                px: 1.5,
                py: 1.2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="20%" height={24} />
              <Skeleton variant="text" width="23%" height={24} />
              <Skeleton variant="text" width="18%" height={24} />
              <Skeleton variant="rounded" width={120} height={26} />
            </Stack>
          ))}
        </Box>
      </Card>
    </Box>
  );
}
