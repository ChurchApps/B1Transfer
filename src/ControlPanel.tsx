import React from "react";
import UserContext from "./UserContext";

import { ApiHelper } from "./components";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Login } from "./Login";

import { Authenticated } from "./Authenticated";
import { Logout } from "./Logout";
import ReactGA from "react-ga4";
import { EnvironmentHelper } from "./helpers";
import { Home } from "./Home";

export const ControlPanel = () => {
  console.log("***CONTROL PANEL");

  const location = useLocation();
  if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") {
    ReactGA.initialize(EnvironmentHelper.Common.GoogleAnalyticsTag);
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }
  React.useEffect(() => {
    if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") {
      ReactGA.send({ hitType: "pageview", page: location.pathname });
    }
  }, [location]);

  const user = React.useContext(UserContext).user; //to force rerender on login
  console.log(user === null);
  //if (user === null) return null;
  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Authenticated />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  if (!ApiHelper.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
