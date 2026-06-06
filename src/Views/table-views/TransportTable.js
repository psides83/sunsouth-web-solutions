import React from "react";
import { Box } from "@mui/material";
import TransportRow from "./TransportManagerRow";

function TransportTable(props) {
  const { requests } = props;
  return (
    <Box
      sx={{
        maxHeight: { xs: "unset", md: "72vh" },
        overflowY: { xs: "visible", md: "auto" },
        pr: { xs: 0, md: 0.5 },
      }}
    >
      {requests.map((request) => (
        <Box key={request.id} sx={{ mb: 1 }}>
          <TransportRow request={request} cardMode />
        </Box>
      ))}
    </Box>
  );
}

export default TransportTable;
