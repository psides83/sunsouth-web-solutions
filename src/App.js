import React, { useEffect, useState } from 'react';
import './styles/App.css';
import Header from './views/Header';
import Home from './views/Home';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// import { useHistory } from 'react-router-dom';
// import Login from './Login';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './services/firebase';
import { useStateValue } from './state-management/StateProvider';
import SignIn from './views/SignIn';
import SignUp from './views/SignUp';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import SpinnerProgress from './components/SpinnerProgress';
import AddRequestView from './views/AddRequestView';
import Completed from './views/Completed';
import AddLoanerView from './views/AddLoanerView';
import LoanerManager from './views/table-views/LoanerManager';
import SalesmenList from './views/table-views/SalesmenList';

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

function App() {
  // const history = useHistory();
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
  }, [dispatch])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <div className="app">
        <Router>
            <Switch>

              <Route path="/salesmen-list">
                <Header />
                <SalesmenList />
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
                { !loading && !user ? <SignIn /> : !loading && user ? <Home /> : <SpinnerProgress /> }
              </Route>
            </Switch>
        </Router>
      </div>
    </ThemeProvider>
  );
};

export default App;
