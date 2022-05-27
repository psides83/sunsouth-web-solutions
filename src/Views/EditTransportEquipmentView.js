//Imports
import React, { useCallback, useEffect, useState } from "react";
import { db } from "../services/firebase";
import { setDoc, doc, deleteDoc } from "@firebase/firestore";
import moment from "moment";
import { styled } from "@mui/material/styles";
import {
  Box,
  Grid,
  Stack,
  Button,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  CheckRounded,
  Close,
  DeleteRounded,
  EditRounded,
  SaveRounded,
} from "@mui/icons-material";
import { useStateValue } from "../state-management/StateProvider";

export default function TransportEquipmentForm(props) {
  //#region State Properties
  const { request, equipment } = props;
  const [{ userProfile }] = useStateValue();
  var [model, setModel] = useState("");
  var [stock, setStock] = useState("");
  var [serial, setSerial] = useState("");
  var [notes, setNotes] = useState("");
  var [changeLog, setChangeLog] = useState([]);
  var [change, setChange] = useState([]);
  const [importedData, setImportedData] = useState({});
  const [dataHasChanges, setDataHasChanges] = useState(false);
  const [isShowingDialog, setIsShowingDialog] = useState(false);
  const [isShowingConfirmDialog, setIsShowingConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  //#endregion

  const handleCloseDialog = async () => {
    setIsShowingDialog(false);
    setIsShowingConfirmDialog(false);
    resetRequestForm();
  };

  const handleToggleDialog = () => {
    setDataHasChanges(false);
    setSuccess(false);
    setIsShowingDialog(!isShowingDialog);
  };

  const handleCloseConfirmDialog = () => {
    setIsShowingConfirmDialog(false);
  };

  const handleToggleConfirmDialog = () => {
    setIsShowingConfirmDialog(!isShowingConfirmDialog);
  };

  // load data from equipment
  const loadEquipmentData = useCallback(() => {
    setModel(equipment.model);
    setStock(equipment.stock);
    setSerial(equipment.serial);
    setNotes(equipment.notes);
    setChangeLog(equipment.changeLog);
    setImportedData({
      model: equipment.model,
      stock: equipment.stock,
      serial: equipment.serial,
      notes: equipment.notes,
    });
  }, [isShowingDialog]);

  useEffect(() => {
    loadEquipmentData();
  }, [loadEquipmentData]);

  const deleteEquipment = async () => {
    const requestRef = doc(db, "transport", request.id);

    const equipmentIndex = request.equipment.indexOf(equipment);

    request.equipment.splice(equipmentIndex, 1);

    await setDoc(requestRef, { equipment: request.equipment }, { merge: true });

    setIsShowingDialog(false);
  };

  const logChanges = () => {
    if (model !== importedData.model) {
      console.log(importedData);
      setChange(
        change.push(
          `Model edited from ${
            importedData.model === "" ? "BLANK" : importedData.model
          } to ${model === "" ? "BLANK" : model}`
        )
      );
    }
    console.log(change);

    if (stock !== importedData.stock) {
      setChange(
        change.push(
          `Stock # for ${model} edited from ${
            importedData.stock === "" ? "BLANK" : importedData.stock
          } to ${stock === "" ? "BLANK" : stock}`
        )
      );
    }

    if (serial !== importedData.serial) {
      setChange(
        change.push(
          `Serial # for ${model} edited from ${
            importedData.serial === "" ? "BLANK" : importedData.serial
          } to ${serial === "" ? "BLANK" : serial}`
        )
      );
    }

    if (notes !== importedData.notes) {
      setChange(
        change.push(
          `Notes on ${model} edited from ${
            importedData.notes === "" ? "BLANK" : importedData.notes
          } to ${notes === "" ? "BLANK" : notes}`
        )
      );
    }
  };

  // Add the equipment to the firestore "requests" collection and the equipment to the fire store "equipment" collection.
  const setEquipmentToFirestore = async () => {
    const timestamp = moment().format("DD-MMM-yyyy hh:mmA");
    const id = equipment ? equipment.id : moment().format("yyyyMMDDHHmmss");
    logChanges();
    var changeString = change.toString().replace(/,/g, ", ");

    if (changeString[0] === ",") {
      changeString = changeString.substring(1).trim();
    }

    request.changeLog.push({
      id: moment().format("yyyyMMDDHHmmss"),
      change: equipment ? changeString : `${model} added`,
      timestamp: timestamp,
    });

    const editedEquipment = {
      id: id,
      model: model,
      stock: stock,
      serial: serial,
      notes: notes,
    };

    const currentEquipmentIndex = request.equipment.indexOf(equipment);
    request.equipment[currentEquipmentIndex] = editedEquipment;

    console.log("you made it here");
    console.log(request.equipment);
    console.log(request.id);
    const requestRef = doc(
      db,
      "branches",
      userProfile.branch,
      "transport",
      request.id
    );

    await setDoc(
      requestRef,
      { equipment: request.equipment, changeLog: request.changeLog },
      { merge: true }
    );

    setLoading(false);
    setSuccess(true);
    handleCloseDialog();
  };

  // Reset the request form
  const resetRequestForm = () => {
    setModel("");
    setStock("");
    setSerial("");
    setNotes("");
    setChangeLog([]);
    setChange([]);
    setImportedData({});
    setDataHasChanges(false);
  };

  // Requst submission validation.
  const equipmentSubmitValidation = async (event) => {
    event.preventDefault();
    setLoading(true);

    const lowerCaseLetters = /[a-z]/g;
    const upperCaseLetters = /[A-Z]/g;

    if (model === "") {
      return;
    } else {
      await setEquipmentToFirestore();
    }
  };

  // Handle request model input and capitolize each word
  const handleModelInput = (e) => {
    setModel(e.target.value.toUpperCase());

    if (e.target.value !== importedData.model) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.model) {
      setDataHasChanges(false);
    }
  };

  // Handle request stock input and capitolize each word
  const handleStockInput = (e) => {
    setStock(e.target.value);

    if (e.target.value !== importedData.stock) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.stock) {
      setDataHasChanges(false);
    }
  };

  // Handle request serial input and capitolize each word
  const handleSerialInput = (e) => {
    setSerial(e.target.value.toUpperCase());

    if (e.target.value !== importedData.serial) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.serial) {
      setDataHasChanges(false);
    }
  };

  // Handle request notes input and capitolize each word
  const handleNotesInput = (e) => {
    setNotes(e.target.value);

    if (e.target.value !== importedData.notes) {
      setDataHasChanges(true);
    } else if (e.target.value === importedData.notes) {
      setDataHasChanges(false);
    }
  };

  // UI view of the submission form
  return (
    <>
      <Tooltip title="Edit Request">
        <IconButton
          color="primary"
          style={{ fontSize: 20 }}
          onClick={handleToggleDialog}
        >
          <EditRounded style={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Dialog
        onClose={handleCloseDialog}
        open={isShowingDialog}
        style={{ backdropFilter: "blur(5px)" }}
        PaperProps={{ style: { borderRadius: 8 }, elevation: 24 }}
      >
        <Box
          sx={{
            maxWidth: "380px",
            padding: (theme) => theme.spacing(1),
            paddingLeft: (theme) => theme.spacing(4),
            paddingRight: (theme) => theme.spacing(4),
            paddingBottom: (theme) => theme.spacing(3),
          }}
        >
          <Stack direction="row" justifyContent="space-between">
            <DialogTitle variant="h4">Edit Equipment</DialogTitle>

            <IconButton sx={{ height: 44 }} onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                size="small"
                id="model"
                name="model"
                label="Model"
                variant="outlined"
                onChange={handleModelInput}
                value={model}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                id="stock"
                name="stock"
                label="Stock"
                variant="outlined"
                onChange={handleStockInput}
                value={stock}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                id="serial"
                name="serial"
                label="Serial"
                variant="outlined"
                onChange={handleSerialInput}
                value={serial}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                type="text"
                size="small"
                id="eqNotes"
                name="eqNotes"
                label="Equipment Notes"
                variant="outlined"
                value={notes}
                onChange={handleNotesInput}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                color="error"
                onClick={handleToggleConfirmDialog}
                startIcon={<DeleteRounded />}
              >
                Delete
              </Button>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                endIcon={success ? <CheckRounded /> : <SaveRounded />}
                disabled={!dataHasChanges || loading}
                onClick={equipmentSubmitValidation}
              >
                {loading && (
                  <CircularProgress
                    size={24}
                    color="primary"
                    sx={{
                      // color: green[500],
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      marginTop: "-12px",
                      marginLeft: "-12px",
                    }}
                  />
                )}
                {success ? "Success" : loading ? "Saving" : "Save"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Dialog>

      <Dialog onClose={handleCloseConfirmDialog} open={isShowingConfirmDialog}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            margin: "5px 25px 25px 25px",
          }}
        >
          <DialogTitle>Confirm Delete</DialogTitle>

          <div>
            <Typography>Are you sure you want to</Typography>

            <Typography>delete this request?</Typography>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: "25px",
              }}
            >
              <Button
                variant="outlined"
                color="info"
                onClick={handleCloseConfirmDialog}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={deleteEquipment}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
