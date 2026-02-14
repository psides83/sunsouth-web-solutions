import React from "react";
import { Box, Container } from "@mui/material";
import ActiveRequestsTable from "../views/table-views/ActiveRequestsTable";

function Home() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ flexGrow: 1 }}>
        <ActiveRequestsTable />
      </Box>
    </Container>
  );
}

export default Home;
