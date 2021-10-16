import React, { useEffect } from 'react';
import './App.css';
import Header from './Header';
import Home from './Home';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// import Login from './Login';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './firebase';
import { useStateValue } from './StateProvider';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

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
  const [{ user }, dispatch] = useStateValue();  

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {    
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        
        dispatch({
          type: 'SET_USER',
          user: user,
        })
      } else {
        // User is signed out
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
            <Route path="/orders">
              <Header />
            </Route>

            <Route path="/signIn">
              <Header />
              <SignIn />
            </Route>

            <Route path="/signUp">
              <Header />
              <SignUp />
            </Route>

            <Route path="/">
              <Header />
              {user ? <Home /> : <SignIn/>}
            </Route>
          </Switch>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
