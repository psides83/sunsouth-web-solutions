import React from "react";
import { Box, Container } from "@mui/material";
import CompletedTable from "./table-views/CompletedTable";

function Completed() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ flexGrow: 1 }}>
        <CompletedTable />
      </Box>
    </Container>
  );
}

export default Completed;
