import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Svg,
  Line,
} from "@react-pdf/renderer";
import moment from "moment";
import { useStateValue } from "../state-management/StateProvider";

// Create styles
const styles = StyleSheet.create({
  body: {
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 25,
  },
  section: {
    margin: 10,
    // padding: 10,
    // flexGrow: 1
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    margin: 12,
    color: "rgb(125,125,125)",
    textAlign: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 12,
    color: "rgb(125,125,125)",
    // textAlign: 'center',
  },
  text: {
    margin: 6,
    fontSize: 12,
    color: "rgb(75,75,75)",
    // textAlign: 'justify',
  },
});

// Create Document Component
export const RequestPDF = ({ request, equipment }) => (
  <Document>
    <Page size="A4" style={styles.body}>
      <View style={styles.section}>
        <Text style={styles.title}>PDI/Setup Request</Text>
        <Text style={styles.text}>{request.timestamp}</Text>
        <Text style={styles.text}>{`Work Order:   ${request.workOrder}`}</Text>
        <Text style={styles.text}>{`Salesman:      ${request.salesman}`}</Text>
      </View>
      {equipment.map((item) => (
        <View style={styles.section}>
          <Svg height="5" width="500">
            <Line
              x1="0"
              y1="0"
              x2="500"
              y2="0"
              strokeWidth={3}
              stroke="rgb(175,175,175)"
            />
          </Svg>

          <Text style={styles.heading}>{`Equipment  ${
            equipment.indexOf(item) + 1
          }`}</Text>
          <Text style={styles.text}>{`Model:   ${item.model}`}</Text>
          <Text style={styles.text}>{`Stock:   ${item.stock}`}</Text>
          <Text style={styles.text}>{`Serial:   ${item.serial}`}</Text>
          <Text style={styles.text}>{`Work:    ${item.work}`}</Text>
          <Text style={styles.text}>{`Notes:   ${item.notes}`}</Text>
        </View>
      ))}
    </Page>
  </Document>
);

// Create Document Component
export const TransportPDF = ({ request }) => (
  <Document>
    <Page size="A4" style={styles.body}>
      <View style={styles.section}>
        <Text style={styles.title}>Equipment {request.type} Request</Text>
        <Text style={styles.text}>{request.timestamp}</Text>
        <Text
          style={styles.text}
        >{`Work Order:            ${request.workOrder}`}</Text>
        <Text
          style={styles.text}
        >{`Created By:            ${request.salesman}`}</Text>
        <Text
          style={styles.text}
        >{`Status:                   ${request.status}`}</Text>
        {request.status !== "Requested" ? (
          <Text style={styles.text}>{`Scheduled Date:   ${moment(
            request.startDate
          ).format("llll")} - ${moment(request.endDate).format("LT")}`}</Text>
        ) : (
          <Text style={styles.text}>{`Requested Date:   ${moment(
            request.requestedDate
          ).format("LL")}`}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text
          style={styles.text}
        >{`Customer:             ${request.name}`}</Text>
        <Text
          style={styles.text}
        >{`Phone:                  ${request.phone}`}</Text>
        <Text style={styles.text}>{`Address:`}</Text>
        <Text style={styles.text}>{`${request.street}`}</Text>
        <Text
          style={styles.text}
        >{`${request.city}, ${request.state} ${request.zip}`}</Text>
      </View>
      {request.equipment.map((item) => (
        <View style={styles.section}>
          <Svg height="5" width="500">
            <Line
              x1="0"
              y1="0"
              x2="500"
              y2="0"
              strokeWidth={3}
              stroke="rgb(175,175,175)"
            />
          </Svg>

          <Text style={styles.heading}>{`Equipment  ${
            request.equipment.indexOf(item) + 1
          }`}</Text>
          <Text style={styles.text}>{`Model:   ${item.model}`}</Text>
          <Text style={styles.text}>{`Stock:   ${item.stock}`}</Text>
          <Text style={styles.text}>{`Serial:   ${item.serial}`}</Text>
          <Text style={styles.text}>{`Notes:   ${item.notes}`}</Text>
        </View>
      ))}
    </Page>
  </Document>
);
