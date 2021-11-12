import React, { useEffect, useState } from 'react';
import { useStateValue } from '../../state-management/StateProvider';
import IconButton from '@material-ui/core/IconButton';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { TextField, Tooltip } from '@material-ui/core';
import moment from 'moment';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import '../../styles/Table.css'
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { sendEquipmentUpdateEmail } from '../../services/email-service'

// Equipment row view:
export default function EquipmentRow({classes, request, item}) {
  //#region State Properties
    const [{ userProfile }] = useStateValue();
    var [model, setModel] = useState('')
    var [stock, setStock] = useState('');
    var [serial, setSerial] = useState('');
    var [work, setWork] = useState('');
    var [notes, setNotes] = useState('');
    const [currentValues, setCurrentValues] = useState({
      model: '',
      stock: '',
      serial: '',
      work: '',
      notes: ''
    });
    var [isEditingEquipment, setIsEditingEquipment] = useState(false);
    var [equipmentHasChanges, setEquipmentHasChanges] = useState(false);
    const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`
    // #endregion
  
    // Handles editing of the equipment values.
    // Either opens the edit textfields or sets new edits to firestore
    const editEquipment = async () => {
  
      // If isEditingEquipment is true,
      // check for changes to the equipment values
      if (isEditingEquipment) {
  
        var changeDetails = []
  
        // The model has changes
        if (currentValues.model !== model) {
          changeDetails.push(`equipment model updated from ${currentValues.model} to ${model}`)
        }
  
        // The stock number has changes
        if (currentValues.stock !== stock) {
          changeDetails.push(`equipment stock number updated from ${currentValues.stock} to ${stock}`)
        }
  
        // The serial number has changes
        if (currentValues.serial !== serial) {
          changeDetails.push(`equipment serial number updated from ${currentValues.serial} to ${serial}`)
        }
  
        // The work list has changes
        if (currentValues.work !== work) {
          changeDetails.push(`equipment work required updated from ${currentValues.work} to ${work}`)
        }
  
        // The notes have changes
        if (currentValues.notes !== notes) {
          changeDetails.push(`equipment notes from ${currentValues.notes === '' ? 'blank' : currentValues.notes} to ${notes}`)
        }
  
        // If the eaquipmentHasChanges check is true, 
        // set the values for the changLog, 
        // append the new changeLog object to the changeLog array, 
        // then set the new equipment values to the document in Firestore
        if (equipmentHasChanges) {
  
          const changeLogEntry = {
            user: fullName,
            change: changeDetails, 
            timestamp: moment().format("DD-MMM-yyyy hh:mmA")
          }
  
          item.changeLog.push(changeLogEntry)
  
          await setDoc(doc(db, 'branches', userProfile.branch, "requests", item.requestID, "equipment", item.stock), { 
            model: model,
            stock: stock,
            serial: serial,
            work: work,
            notes: notes,
            changeLog: item.changeLog
          }, { merge: true })
  
          sendEquipmentUpdateEmail(currentValues, request, request.salesman, userProfile, fullName, model, stock, serial, work, notes)
          setIsEditingEquipment(false)
  
        // if equipmentHasChanges check is false, 
        // do noting but set the isEditingEquipment Bool to false to close the Texfields and toggle the edit button
        } else {
          console.log("no changes to equipment")
          setIsEditingEquipment(false)
        }
  
      // If isEditingEquipment Bool is false, 
      // set firestore document values to state properties that update int he TextFields, 
      // and se tthe original values to an object so that we can check the TextField values for changes
      } else { 
  
        setCurrentValues({
          model: item.model,
          stock: item.stock,
          serial: item.serial,
          work: item.work,
          notes: item.notes
        })
  
        setModel(item.model)
        setStock(item.stock)
        setSerial(item.serial)
        setWork(item.work)
        setNotes(item.notes)
        setIsEditingEquipment(true)
      }
    }
  
    useEffect(() => {
  
      // Receives the changes on the equipment TextFields and 
      // sets the equipmentHasChanges Bool to true if 
      // current equipment TextField value doesn't match the original value loaded from Firestore 
      if (currentValues.model !== model || currentValues.stock !== stock || currentValues.serial !== serial || currentValues.work !== work || currentValues.notes !== notes) {
  
        setEquipmentHasChanges(true)
      } else {
  
        setEquipmentHasChanges(false)
      }
    }, [currentValues, model, stock, serial, work, notes, setEquipmentHasChanges])
  
    // Equipment row UI:
    return (
  
      <React.Fragment>
        <TableRow 
          key={item.requestID} 
          style={{ fontSize: 18 }} 
          className={classes.root} 
          sx={{ '& > *': { borderBottom: 'unset' } }}
        >
          <TableCell key={model} align="left" component="th" scope="row"> {
            isEditingEquipment 
            ? 
            <TextField 
              variant="outlined" 
              label="Model" 
              inputProps={{style: {fontSize: 14}}} 
              style={{ fontSize: 18 }} 
              size="small" 
              onChange={e=> setModel(e.target.value.toUpperCase())} 
              value={model}> 
            </TextField> 
            : 
            item.model
          }
          </TableCell>
  
          { isEditingEquipment 
            ?
            <TableCell key={stock} align="left">
                <br/>
                <p>
                  <TextField 
                    variant="outlined" 
                    label="Stock" 
                    inputProps={{style: {fontSize: 14}}} 
                    style={{ fontSize: 18 }} 
                    size="small" 
                    onChange={e=> setStock(e.target.value)} 
                    value={stock}>
                  </TextField>
                </p>
                <br/>
                <p>
                  <small>
                    <TextField 
                      variant="outlined" 
                      label="Serial" 
                      inputProps={{style: {fontSize: 14}}} 
                      style={{ fontSize: 18 }} 
                      size="small" 
                      onChange={e=> setSerial(e.target.value.toUpperCase())} 
                      value={serial}>
                    </TextField>
                  </small>
                </p>
            </TableCell>
            :
            <TableCell key={serial} align="left">
                { `Stock: ${item.stock}` }
                <p><small>{ `Serial: ${item.serial}` }</small></p>
            </TableCell>
          }
  
          <TableCell key={work} align="left">  {
            isEditingEquipment 
            ? 
            <TextField 
              variant="outlined" 
              label="Work" 
              inputProps={{style: {fontSize: 14}}} 
              style={{ fontSize: 18 }} 
              size="small" 
              onChange={e=> setWork(e.target.value)} 
              value={work}>
            </TextField> 
            : 
            item.work
          }
          </TableCell>
  
          <TableCell key={notes} align="left"> {
            isEditingEquipment 
            ? 
            <TextField 
              variant="outlined" 
              label="Notes" 
              inputProps={{style: {fontSize: 14}}} 
              style={{ fontSize: 18 }} 
              size="small" 
              onChange={e=> setNotes(e.target.value)} 
              value={notes}>
            </TextField> 
            : 
            item.notes
          }
          </TableCell>
          
          <TableCell key="editSaveCancelbutton" align="center">
            <IconButton 
              color="success" 
              style={{ fontSize: 20 }}
              onClick={editEquipment}> { 
                isEditingEquipment 
                ? 
                equipmentHasChanges
                ?
                <Tooltip title="Save">
                  <CheckIcon 
                  color="success" 
                  style={{ fontSize: 18 }}/> 
                </Tooltip>
                :
                <Tooltip title="Cancel">
                  <CloseIcon 
                    color="success" 
                    style={{ fontSize: 18 }}
                  />
                </Tooltip>
                : 
                <Tooltip title="Edit Equipment">
                  <EditRoundedIcon 
                  color="success" 
                  style={{ fontSize: 18 }}/> 
                </Tooltip>
              }
            </IconButton>
          </TableCell>
        </TableRow>
      </React.Fragment>
    )
  }