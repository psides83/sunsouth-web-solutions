import React, { useState, useEffect } from 'react'
import './Header.css'
import { Link } from 'react-router-dom';
import { useStateValue } from './StateProvider';
import { auth, db } from './firebase';
import { onSnapshot, doc } from 'firebase/firestore';


function Header() {
    const [{ user }, dispatch] = useStateValue();
    const [userProfile, setProfile] = useState({});
    const fullName = userProfile?.firstName + ' ' + userProfile?.lastName
    

    useEffect(() => {
        const fetchProfile = async () => {
            try {
              onSnapshot(doc(db, "users", user?.uid), (doc) => {
                console.log("Current data: ", doc.data());
                setProfile(doc.data())
                dispatch({
                    type: 'SET_USER_PROFILE',
                    userProfile: doc.data(),
                })
            });
            } catch (error) {
              console.log('error', error)
            }

            
        }
        console.log(user)
        fetchProfile()
    }, [user, dispatch])

    const handleAuthentication = () => {
            if (user) {
                // User is signed in, see docs for a list of available properties
                // https://firebase.google.com/docs/reference/js/firebase.User
                auth.signOut();
            }
    };

    return (
        <div className="header">
            <div className="header-logo" >
            <Link className="link" to="/">
                <img src="/logo-ss-deere.png" alt=""/>
            </Link>
                <h4>{}</h4>
            </div>
            

            {/* <div className="header-search"> */}
                {/* <input
                    className="header-searchInput" 
                    type="text"/> */}
                {/* <SearchIcon className="header-searchIcon"/> */}
                {/* Logo */}
            {/* </div> */}

            <div className="header-nav">
                <Link className="link" to={!user && "/signIn"}>
                    <div onClick={handleAuthentication} className="header-option">
                        <span className="header-optionLineOne">Hello, {user ? fullName : "Guest"}</span>
                        <span className="header-optionLineTwo">{user ? "Logout" : "Sign-in"}</span>
                    </div>
                </Link>

                <Link className="link" to='/orders'>
                    <div className="header-option">
                        <span className="header-optionLineOne">Returns</span>
                        <span className="header-optionLineTwo">& Orders</span>
                    </div>
                </Link>

                <Link className="link">
                    <div className="header-option">
                        <span className="header-optionLineOne">Your</span>
                        <span className="header-optionLineTwo">Prime</span>
                    </div>
                </Link>

                <Link className="link" to="/checkout">
                    <div className="header-optionBasket">
                    </div>
                </Link>
            </div>
        </div>
    )
}

export default Header
