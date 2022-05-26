import React, { useCallback, useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import {
  ViewState,
  EditingState,
  IntegratedEditing,
} from "@devexpress/dx-react-scheduler";
import {
  Scheduler,
  DayView,
  WeekView,
  MonthView,
  Appointments,
  DateNavigator,
  ViewSwitcher,
  AppointmentForm,
  AllDayPanel,
  Toolbar,
  TodayButton,
  AppointmentTooltip,
} from "@devexpress/dx-react-scheduler-material-ui";
import moment from "moment";
import { Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PhoneRounded, RestorePage, Room } from "@mui/icons-material";

const currentDate = moment().format();

const Appointment = ({ style, data, ...restProps }) => (
  <Appointments.Appointment
    {...restProps}
    style={{
      ...style,
      backgroundColor: `${data.status === "Requested" ? "gray" : "#367C2B"}`,
      borderRadius: "8px",
    }}
    data={data}
  />
);

const Header = ({ children, appointmentData, ...restProps }) => (
  <AppointmentTooltip.Header {...restProps} appointmentData={appointmentData}>
    <Grid container alignItems="center">
      <Grid item xs={10} style={{ textAlign: "center", marginTop: "5px" }}>
        <Typography
          variant="h5"
          style={{
            fontWeight: "bold",
            color: appointmentData.status === "Requested" ? "gray" : "#367C2B",
          }}
        >
          {appointmentData.status}
        </Typography>
      </Grid>
    </Grid>
  </AppointmentTooltip.Header>
);

const Content = ({ children, appointmentData, ...restProps }) => (
  <AppointmentTooltip.Content {...restProps} appointmentData={appointmentData}>
    <Grid container alignItems="center">
      <Grid item xs={2} style={{ textAlign: "center" }}></Grid>
      <Grid item xs={10} style={{ textAlign: "start" }}>
        <Typography style={{ fontWeight: "bold", color: "gray" }}>
          {appointmentData.type}
        </Typography>
      </Grid>
      <Grid item xs={2} style={{ textAlign: "center" }}></Grid>
      <Grid item xs={10} style={{ textAlign: "start" }}>
        <Typography style={{ fontWeight: "bold", color: "gray" }}>
          {appointmentData.hasTrade ? "Return Trade" : null}
        </Typography>
      </Grid>
      <Grid item xs={2} style={{ textAlign: "center" }}>
        <PhoneRounded style={{ color: "gray" }} />
      </Grid>
      <Grid item xs={10}>
        <a href={`tel:${appointmentData.phone}`}>{appointmentData.phone} </a>
      </Grid>
    </Grid>
    <Grid container alignItems="center">
      <Grid item xs={2} style={{ textAlign: "center" }}>
        <Room style={{ color: "gray" }} />
      </Grid>
      <Grid item xs={10}>
        <span>{appointmentData.location}</span>
      </Grid>
    </Grid>
  </AppointmentTooltip.Content>
);

export default function CalendarView(props) {
  const { calendarRequests } = props;

  console.log(calendarRequests);

  return (
    <Paper
      style={{
        padding: "5px",
        // margin: "0 20px 0 20px",
        borderRadius: "10px",
      }}
    >
      <Scheduler height={600} data={calendarRequests}>
        {/* <EditingState onCommitChanges={null} /> */}
        {/* <IntegratedEditing /> */}
        <ViewState
          defaultCurrentDate={currentDate}
          defaultCurrentViewName="Week"
        />
        <MonthView />
        <WeekView excludedDays={[0, 6]} startDayHour={6.5} endDayHour={17.5} />
        <DayView startDayHour={6.5} endDayHour={17.5} />
        <Toolbar />
        <DateNavigator />
        <TodayButton />
        <ViewSwitcher />
        <Appointments appointmentComponent={Appointment} />
        <AppointmentTooltip
          headerComponent={Header}
          contentComponent={Content}
          showCloseButton
        />
        <AllDayPanel />
        <AppointmentForm readOnly />
      </Scheduler>
    </Paper>
  );
}
