import React, { useState } from "react";
import { useStateValue } from "../../state-management/StateProvider";
import "../../styles/Table.css";
import { TableCell, TableRow, Typography } from "@mui/material";
import TransportEquipmentForm from "../EditTransportEquipmentView";

// Equipment row view:
export default function TransportEquipmentRow(props) {
  //#region State Properties
  const { request, item } = props;
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  // #endregion

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  // Equipment row UI:
  return (
    <React.Fragment>
      <TableRow key={item.id} sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell key="model" align="left" component="th" scope="row">
          {item.model}
        </TableCell>

        <TableCell key="serial" align="left">
          {`Stock: ${item.stock}`}
          <Typography component="p" variant="caption">
            Serial: {item.serial}
          </Typography>
        </TableCell>

        <TableCell key="notes" align="left">
          {item.notes}
        </TableCell>
        <TransportEquipmentForm request={request} equipment={item} />
      </TableRow>
    </React.Fragment>
  );
}
