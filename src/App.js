import React, { useCallback, useEffect, useState } from "react";
import "./styles/App.css";
import Header from "./views/Header";
import Home from "./views/Home";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// import { useHistory } from 'react-router-dom';
// import Login from './Login';
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./services/firebase";
import { useStateValue } from "./state-management/StateProvider";
import SignIn from "./views/SignIn";
import SignUp from "./views/SignUp";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Spinner from "./components/Spinner";
import AddRequestView from "./views/AddRequestView";
import Completed from "./views/Completed";
import AddLoanerView from "./views/AddLoanerView";
import LoanerManager from "./views/table-views/LoanerManager";
import SalesmenList from "./views/table-views/SalesmenList";
import TransportManager from "./views/table-views/TransportManager";
import { RequestPDF, TransportPDF } from "./components/RequestPDF";
import { PDFViewer } from "@react-pdf/renderer";
import { doc, getDoc } from "@firebase/firestore";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#367C2B",
    },
    secondary: {
      main: "#FFDE00",
    },
    success: {
      main: "#66bb6a",
    },
    error: {
      main: "#f44336",
    },
    info: {
      main: "#708090",
    },
    background: {
      default: "#e3e8e8",
    },
  },
});

function App() {
  // const [{ pdfData }] = useStateValue();
  const [{ user }, dispatch] = useStateValue();
  const [loading, setLoading] = useState(true);
  var [data, setData] = useState();

  const fetchdata = async (user) => {
    const docSnapshot = await getDoc(
      doc(db, "users", user?.uid, "pdf", "pdfData")
    );

    if (docSnapshot.exists()) {
      console.log("Document data:", docSnapshot.data());
      setData(docSnapshot.data());
      setLoading(false);
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        // setTimeout( function() { setLoading(false); }, 2000);

        dispatch({
          type: "SET_USER",
          user: user,
        });
        fetchdata(user);
        setTimeout(function () {
          setLoading(false);
        }, 1000);
      } else {
        // User is signed out
        dispatch({
          type: "SET_USER",
          user: null,
        });
        setTimeout(function () {
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
                  <TransportPDF
                    className="pdf"
                    request={data?.request}
                  />
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

            <Route path="/transport-manager">
              <Header />
              <TransportManager />
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

            <Route path="/signUp">
              <SignUp />
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
