import React, { useEffect, useState } from 'react';
import './App.css';
import Header from './Header';
import Home from './Home';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { useHistory } from 'react-router-dom';
// import Login from './Login';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import { useStateValue } from './StateProvider';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import HomeSkeleton from './HomeSkeleton'
import SpinnerProgress from './SpinnerProgress';
import AddRequestView from './AddRequestView';
import Completed from './Completed';
import AddLoanerView from './AddLoanerView';
import LoanerManager from './LoanerManager';

const theme = createTheme({
  palette: {
    primary: {
      light: '#5e9655',
      main: '#367C2B',
      dark: '#25561e',
    },
    secondary: {
      light: '#ffe433',
      main: '#FFDE00',
      dark: '#b29b00',
    }
  },
});

function LoadView(user) {
  return (
    <div>
      {user ? <Home /> : <SignIn />}
    </div>
  );
};

function App() {
  const history = useHistory();
  const [{ user }, dispatch] = useStateValue();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {    
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        // setTimeout( function() { setLoading(false); }, 2000);
        setTimeout( function() { setLoading(false); }, 1000);
        dispatch({
          type: 'SET_USER',
          user: user,
        })
      } else {
        // User is signed out
        setTimeout( function() { setLoading(false); }, 500);
        dispatch({
          type: 'SET_USER',
          user: null
        })
      }  
    });
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <Router>
        <div className="app">
          <Switch>

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
              <Header />
              { !loading && !user ? <SignIn /> : !loading && user ? <Home /> : <SpinnerProgress /> }
            </Route>
          </Switch>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
