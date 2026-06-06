import React, { useEffect, useState } from "react";
import "./styles/App.css";
import Header from "./views/Header";
import Home from "./views/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./services/firebase";
import { useStateValue } from "./state-management/StateProvider";
import SignIn from "./views/SignIn";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Spinner from "./components/Spinner";
import AddRequestView from "./views/AddRequestView";
import Completed from "./views/Completed";
import AddLoanerView from "./views/AddLoanerView";
import LoanerManager from "./views/table-views/LoanerManager";
import SalesmenList from "./views/table-views/SalesmenList";
import TransportManager from "./views/table-views/TransportManager";
import ProfileView from "./views/ProfileView";
import BranchUsersView from "./views/BranchUsersView";
import { RequestPDF, TransportPDF } from "./components/RequestPDF";
import { PDFViewer } from "@react-pdf/renderer";
import { doc, getDoc } from "@firebase/firestore";
import TransportCustomerView from "./views/TransportCustomerView";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2f7d31",
      light: "#5da35f",
      dark: "#1d5e1f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ffd347",
      light: "#ffe386",
      dark: "#d5a100",
      contrastText: "#2d2410",
    },
    success: {
      main: "#2e7d32",
    },
    error: {
      main: "#c62828",
    },
    info: {
      main: "#275f8f",
    },
    background: {
      default: "#f4f8f4",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a261b",
      secondary: "#4a5c4b",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ["'Roboto'", "'Helvetica'", "'Arial'", "sans-serif"].join(","),
    h4: {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    h5: {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: 0.2,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingInline: 16,
          "&:focus-visible": {
            outline: "3px solid rgba(47, 125, 49, 0.35)",
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          boxShadow: "0 6px 20px rgba(47, 125, 49, 0.25)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 40,
          minHeight: 40,
          padding: 8,
          "&:focus-visible": {
            outline: "3px solid rgba(47, 125, 49, 0.35)",
            outlineOffset: 2,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: "#1a261b",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
        },
      },
    },
  },
});

function App() {
  const [{ user }, dispatch] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();

  const fetchdata = async (activeUser) => {
    const docSnapshot = await getDoc(
      doc(db, "users", activeUser?.uid, "pdf", "pdfData"),
    );

    if (docSnapshot.exists()) {
      setData(docSnapshot.data());
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (activeUser) => {
      if (activeUser) {
        dispatch({
          type: "SET_USER",
          user: activeUser,
        });
        fetchdata(activeUser);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        dispatch({
          type: "SET_USER",
          user: null,
        });
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    });
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app">
        <Router>
          <Switch>
            <Route path="/transport-pdf">
              {loading ? (
                <Spinner frame />
              ) : (
                <PDFViewer width="100%" height="1080">
                  <TransportPDF className="pdf" request={data?.request} />
                </PDFViewer>
              )}
            </Route>

            <Route path="/request-pdf">
              {loading ? (
                <Spinner frame />
              ) : (
                <PDFViewer width="100%" height="1080">
                  <RequestPDF
                    className="pdf"
                    request={data?.request}
                    equipment={data?.equipment}
                  />
                </PDFViewer>
              )}
            </Route>

            <Route path="/salesmen-list">
              <Header />
              <SalesmenList />
            </Route>

            <Route path="/profile">
              <Header />
              <ProfileView />
            </Route>

            <Route path="/branch-users">
              <Header />
              <BranchUsersView />
            </Route>

            <Route path="/transport-manager">
              <Header />
              <TransportManager />
            </Route>

            <Route path="/transport-view/:branch/:requestId/:token">
              <TransportCustomerView />
            </Route>

            <Route path="/loaner-manager">
              <Header />
              <LoanerManager />
            </Route>

            <Route path="/add-loaner">
              <Header />
              <AddLoanerView />
            </Route>

            <Route path="/completed">
              <Header />
              <Completed />
            </Route>

            <Route path="/add-request">
              <Header />
              <AddRequestView />
            </Route>

            <Route path="/signIn">
              <SignIn />
            </Route>

            <Route path="/">
              {user && <Header />}
              {!loading && !user ? (
                <SignIn />
              ) : !loading && user ? (
                <Home />
              ) : (
                <Spinner frame />
              )}
            </Route>
          </Switch>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
