import React, { useState, useEffect } from "react";
import "../styles/Header.css";
import { Link, useHistory } from "react-router-dom";
import { useStateValue } from "../state-management/StateProvider";
import { auth, db } from "../services/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { Skeleton, Typography } from "@mui/material";

function Header() {
  const history = useHistory();
  const [{ user }, dispatch] = useStateValue();
  const [userProfile, setProfile] = useState({});
  const [showingSkeleton, setShowingSkeleton] = useState(true);
  const fullName = `${userProfile?.firstName} ${userProfile?.lastName}`;

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          onSnapshot(doc(db, "users", user?.uid), (doc) => {
            console.log("Current User: ", doc.data());
            setProfile(doc.data());
            dispatch({
              type: "SET_USER_PROFILE",
              userProfile: doc.data(),
            });
          });
        } catch (error) {
          console.log("error", error);
        }
      }
    };

    fetchProfile();

    setTimeout(function () {
      setShowingSkeleton(false);
    }, 500);
  }, [user, dispatch]);

  const handleAuthentication = () => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      auth.signOut();
      history.push("/sign-in");
    }
  };

  return (
    <div className="header">
      <div className="header-logo">
        <Link className="link" to="/">
          <img src="/logo-ss-deere.png" alt="" />
        </Link>
        <Typography
          variant="h4"
          noWrap
          component="div"
          sx={{
            flexGrow: 1,
            display: { xs: "none", sm: "block" },
            color: "white",
            ml: "10px",
            fontWeight: "bold",
          }}
        >
          {`SunSouth ${userProfile?.branch}`}
        </Typography>
      </div>

      <div className="header-nav">
        <Link style={{ display: userProfile.role === "driver" ? "none" : "" }} className="link" to={user && "/"}>
          <div className="header-option">
            <span className="header-optionLineOne">Active</span>
            <span className="header-optionLineTwo">Setup Rquests</span>
          </div>
        </Link>

        <Link style={{ display: userProfile.role === "driver" || userProfile.role === "parts" ? "none" : "" }} className="link" to={user && "/loaner-manager"}>
          <div className="header-option">
            <span className="header-optionLineOne">Loaned Equipment</span>
            <span className="header-optionLineTwo">Manager</span>
          </div>
        </Link>

        <Link style={{ display: userProfile.role === "parts" ? "none" : "" }} className="link" to={user && "/transport-manager"}>
          <div className="header-option">
            <span className="header-optionLineOne">Transport</span>
            <span className="header-optionLineTwo">Manager</span>
          </div>
        </Link>

        <Link style={{ display: userProfile.role === "driver" || userProfile.role === "service" || userProfile.role === "parts" ? "none" : "" }} className="link" to={user && "/salesmen-list"}>
          <div className="header-option">
            <span className="header-optionLineOne">Salesmen</span>
            <span className="header-optionLineTwo">List</span>
          </div>
        </Link>

        <Link className="link" to={!user && "/signIn"}>
          <div onClick={handleAuthentication} className="header-option">
            {showingSkeleton ? (
              <Skeleton
                variant="text"
                sx={{ bgcolor: "grey.900" }}
                width="73px"
                height={25}
              />
            ) : (
              <span className="header-optionLineOne">
                {user ? fullName : ""}
              </span>
            )}
            {showingSkeleton ? (
              <Skeleton
                variant="text"
                s
                x={{ bgcolor: "grey.900" }}
                width="45px"
                height={28}
              />
            ) : (
              <span className="header-optionLineTwo">
                {user ? "Logout" : "Sign-in"}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Header;
