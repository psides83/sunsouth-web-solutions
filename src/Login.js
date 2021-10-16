import React, { useState } from 'react'
import { Link, useHistory } from 'react-router-dom';
import './Login.css'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase';

function Login() {
    const history = useHistory();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const signIn = e => {
        e.preventDefault();
        
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        history.goBack();
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });
    };

    

    const register = e => {
        e.preventDefault()

        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            if(user) {
                history.goBack();
            }
          })
          .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..
          });
    };

    
    
    return (
        <div className="login">

            <Link to='/'>
                <img 
                    className="login-logo" 
                    src="/public/logo-ss-deere.png" 
                    alt=""
                />
            </Link>

            <div className="login-container">

                <h1 className="loginForm-title">Sign-in</h1>

                <form className="loginForm">
                    <h5>Email</h5>
                    <input 
                        className="loginForm-username" 
                        type="text" value={email} 
                        onChange={e=> setEmail(e.target.value)}
                    />

                    <h5>Password</h5>

                    <input 
                        className="loginForm-password" 
                        type="password" value={password} 
                        onChange={e=> setPassword(e.target.value)}
                    />

                    <button className="loginForm-signInButton" type="submit" onClick={signIn}>Sign-in</button>

                    <p>
                        By signing-in you agree to the Amazon Conditions of Use & Sale. Please see our Privacy Notice, our Cookies Notice and our interest-Based Ads Notice.
                    </p>

                    <button className="loginForm-registerButton" onClick={register}>Create Account</button>
                </form>
            </div>
        </div>
    );
};

export default Login;