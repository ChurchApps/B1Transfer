import React from "react";
import UserContext from "./UserContext";
import { LogoutPage } from "@churchapps/apphelper/login";
import { clearSsoJwt } from "./helpers";

export const Logout = () => {
  const context = React.useContext(UserContext);
  clearSsoJwt();
  return (<LogoutPage context={context} />);
};
