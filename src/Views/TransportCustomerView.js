import React, { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import moment from "moment";
import { db } from "../services/firebase";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

export default function TransportCustomerView() {
  const { branch, requestId, token } = useParams();
  const decodedBranch = useMemo(() => decodeURIComponent(branch || ""), [branch]);
  const decodedRequestId = useMemo(
    () => decodeURIComponent(requestId || ""),
    [requestId],
  );
  const decodedToken = useMemo(() => decodeURIComponent(token || ""), [token]);

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const fetchRequest = async () => {
      if (!decodedBranch || !decodedRequestId || !decodedToken) {
        if (isCurrent) {
          setError("Invalid delivery link.");
          setLoading(false);
        }
        return;
      }

      try {
        const requestSnapshot = await getDoc(
          doc(db, "branches", decodedBranch, "transport", decodedRequestId),
        );
        if (!requestSnapshot.exists()) {
          if (isCurrent) {
            setError("Delivery was not found.");
            setLoading(false);
          }
          return;
        }

        const requestData = requestSnapshot.data();
        if ((requestData.customerAccessToken || "") !== decodedToken) {
          if (isCurrent) {
            setError("This delivery link is no longer valid.");
            setLoading(false);
          }
          return;
        }

        if (isCurrent) {
          setRequest(requestData);
          setLoading(false);
        }
      } catch (fetchError) {
        if (isCurrent) {
          setError("Unable to load delivery details.");
          setLoading(false);
        }
      }
    };

    fetchRequest();

    return () => {
      isCurrent = false;
    };
  }, [decodedBranch, decodedRequestId, decodedToken]);

  const renderScheduledWindow = () => {
    if (!request?.startDate || !request?.endDate) {
      return "-";
    }

    return `${moment(request.startDate).format("ddd, MMM D YYYY h:mm A")} - ${moment(
      request.endDate,
    ).format("h:mm A")}`;
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "60vh" }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Box
              sx={{
                mb: 1.5,
                mx: -2,
                mt: -2,
                px: 2,
                py: 1.5,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                background:
                  "linear-gradient(95deg, rgba(25,34,26,0.96) 0%, rgba(37,58,38,0.95) 60%, rgba(31,47,32,0.94) 100%)",
              }}
            >
              <Box
                component="img"
                src="/logo-ss-deere.png"
                alt="SunSouth"
                sx={{ width: { xs: 132, sm: 164 }, display: "block" }}
              />
            </Box>
            <Typography variant="h5" color="primary" sx={{ mb: 0.5 }}>
              {request.type} Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer delivery/transport information
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Status:</strong> {request.status || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Last Updated:</strong> {request.statusTimestamp || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Scheduled Window:</strong> {renderScheduledWindow()}
              </Typography>
              <Typography variant="body2">
                <strong>Requested Date:</strong>{" "}
                {request.requestedDate
                  ? moment(request.requestedDate).format("ddd, MMM D YYYY")
                  : "-"}
              </Typography>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Delivery Address
            </Typography>
            <Typography variant="body2">{request.name || "-"}</Typography>
            <Typography variant="body2">{request.phone || "-"}</Typography>
            <Typography variant="body2">{request.street || "-"}</Typography>
            <Typography variant="body2">
              {`${request.city || ""}, ${request.state || ""} ${request.zip || ""}`}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              Equipment
            </Typography>
            <List dense disablePadding>
              {(request.equipment || []).map((item, index) => (
                <ListItem
                  key={`customer-transport-eq-${item.id || index}`}
                  sx={{ px: 0, alignItems: "flex-start" }}
                >
                  <ListItemText
                    primary={`${item.model || "-"} • Stock: ${item.stock || "-"} • Serial: ${
                      item.serial || "-"
                    }`}
                    secondary={item.notes || ""}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2">
              <strong>Work Order:</strong> {request.workOrder || "-"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Notes:</strong> {request.notes || "-"}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
