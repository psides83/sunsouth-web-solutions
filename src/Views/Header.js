import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useHistory, useLocation } from "react-router-dom";
import { useStateValue } from "../state-management/StateProvider";
import { auth, db } from "../services/firebase";
import { onSnapshot, doc } from "firebase/firestore";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";

function Header() {
  const history = useHistory();
  const location = useLocation();
  const [{ user }, dispatch] = useStateValue();
  const [userProfile, setProfile] = useState({});

  const fullName = `${userProfile?.firstName || ""} ${
    userProfile?.lastName || ""
  }`.trim();

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user?.uid), (document) => {
      const profile = document.data() || {};
      setProfile(profile);
      dispatch({
        type: "SET_USER_PROFILE",
        userProfile: profile,
      });
    });

    return () => unsubscribe();
  }, [user, dispatch]);

  const navItems = useMemo(
    () => [
      {
        to: "/",
        label: "Active Requests",
        hidden: userProfile.role === "driver",
      },
      {
        to: "/loaner-manager",
        label: "Loaners",
        hidden: userProfile.role === "driver" || userProfile.role === "parts",
      },
      {
        to: "/transport-manager",
        label: "Transport",
        hidden: userProfile.role === "parts",
      },
      {
        to: "/salesmen-list",
        label: "Salesmen",
        hidden:
          userProfile.role === "driver" ||
          userProfile.role === "service" ||
          userProfile.role === "parts",
      },
    ],
    [userProfile.role]
  );

  const handleAuthentication = () => {
    if (user) {
      auth.signOut();
      history.push("/signIn");
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderRadius: 0,
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        background:
          "linear-gradient(95deg, rgba(25,34,26,0.96) 0%, rgba(37,58,38,0.95) 60%, rgba(31,47,32,0.94) 100%)",
        backdropFilter: "blur(6px)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 76, md: 72 },
          px: { xs: 2, md: 3 },
          py: 1,
          gap: 1.5,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            component={RouterLink}
            to="/"
            sx={{ display: "inline-flex", alignItems: "center" }}
          >
            <Box
              component="img"
              src="/logo-ss-deere.png"
              alt="SunSouth"
              sx={{ width: { xs: 122, sm: 148 }, display: "block" }}
            />
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              SunSouth {userProfile?.branch || ""}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Setup & Transport Operations
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          {navItems
            .filter((item) => !item.hidden)
            .map((item) => {
              const active = location.pathname === item.to;
              return (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  variant={active ? "contained" : "text"}
                  color={active ? "secondary" : "inherit"}
                  sx={{
                    color: active ? "secondary.contrastText" : "common.white",
                    borderRadius: 8,
                    px: 1.4,
                    minWidth: "auto",
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

          {user && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
              <Chip
                avatar={<Avatar sx={{ bgcolor: "primary.main" }}>{fullName.charAt(0)}</Avatar>}
                label={fullName || "User"}
                variant="outlined"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.28)" }}
              />
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleAuthentication}
                sx={{ borderColor: "rgba(255,255,255,0.28)" }}
              >
                Logout
              </Button>
            </Stack>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
