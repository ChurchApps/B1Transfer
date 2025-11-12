import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Header } from "./components";
import { UserHelper } from "@churchapps/apphelper";
import UserContext from "./UserContext";

export const Authenticated: React.FC = () => {
  const context = React.useContext(UserContext);

  // Sync UserHelper with context
  UserHelper.currentUserChurch = context.userChurch;
  UserHelper.userChurches = context.userChurches;
  UserHelper.user = context.user;
  UserHelper.person = context.person;

  if (UserHelper.churchChanged) {
    UserHelper.churchChanged = false;
    return <Navigate to="/" />
  }
  else return (
    <>
      <Header></Header>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Navigate to={window.location.pathname} />} />
        </Routes>
      </div>
    </>
  );
};
