import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import UserContext from "./UserContext";
import { LoginPage } from "@churchapps/apphelper-login";
import { ChurchInterface, UserInterface } from "@churchapps/apphelper";
import ReactGA from "react-ga4";
import { EnvironmentHelper } from "./helpers";
import { Box } from "@mui/material";

export const Login: React.FC = () => {
  const [errors] = React.useState<string[]>([])
  const location = useLocation();
  const navigate = useNavigate();
  const context = React.useContext(UserContext);
  const [cookies] = useCookies(["jwt"]);

  const search = new URLSearchParams(window.location.search);
  const returnUrl = search.get("returnUrl") || location.state?.from?.pathname || "/";

  const handleRedirect = (url: string) => {
    navigate(url);
  };

  const postChurchRegister = async (_church: ChurchInterface) => {
    if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") ReactGA.event({ category: "Church", action: "Register" });
  }

  const trackUserRegister = async (_user: UserInterface) => {
    if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") ReactGA.event({ category: "User", action: "Register" });
  }

  let jwt = search.get("jwt") || cookies.jwt;
  let auth = search.get("auth");
  if (!jwt) jwt = "";
  if (!auth) auth = "";

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "#EEE",
        minHeight: "100vh",
      }}
    >
      <Box
        sx={{
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <LoginPage
          auth={auth}
          context={context}
          jwt={jwt}
          appName="B1Transfer"
          appUrl={window.location.href}
          churchRegisteredCallback={postChurchRegister}
          userRegisteredCallback={trackUserRegister}
          callbackErrors={errors}
          returnUrl={returnUrl}
          handleRedirect={handleRedirect}
        />
      </Box>
    </Box>
  );
};
