import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Line } from '@react-pdf/renderer';

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
      fontSize: 22,
      fontWeight: 'bold',
      margin: 12,
      color: 'rgb(150,150,150)',
      // textAlign: 'center',
    },
    text: {
      margin: 6,
      fontSize: 16,
      // textAlign: 'justify',
    }
  });

// Create Document Component
export const RequestDetails = ({request, equipment}) => (
    <Document>
    <Page size="A4" style={styles.body}>
      <View style={styles.section}>
        <Text style={styles.text}>{request.timestamp}</Text>
        <Text style={styles.text}>{`Work Order: ${request.workOrder}`}</Text>
        <Text style={styles.text}>{`Salesman:    ${request.salesman}`}</Text>
      </View>
      {
          equipment.map((item) => (
            <View style={styles.section}>
              <Svg height="5" width="500">
              <Line
                x1="0"
                y1="0"
                x2="500"
                y2="0"
                strokeWidth={3}
                stroke="rgb(150,150,150)"
              />
            </Svg>
              	
                <Text style={styles.title}>{`Equipment ${equipment.indexOf(item) + 1}`}</Text>
                <Text style={styles.text}>{`Model:  ${item.model}`}</Text>
                <Text style={styles.text}>{`Stock:  ${item.stock}`}</Text>
                <Text style={styles.text}>{`Serial:  ${item.serial}`}</Text>
                <Text style={styles.text}>{`Work:  ${item.work}`}</Text>
              	<Text style={styles.text}>{`Notes:  ${item.notes}`}</Text>
            </View>
          ))
      }
    </Page>
  </Document>
);