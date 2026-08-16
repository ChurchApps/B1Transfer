import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import UserContext from "./UserContext";
import { LoginPage } from "@churchapps/apphelper/login";
import { ChurchInterface, UserInterface } from "@churchapps/apphelper";
import ReactGA from "react-ga4";
import { EnvironmentHelper, resolveSsoJwt } from "./helpers";
import { Box } from "@mui/material";

export const Login: React.FC = () => {
  const [errors] = React.useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const context = React.useContext(UserContext);
  const [cookies] = useCookies(["jwt"]);

  const search = new URLSearchParams(window.location.search);
  const returnUrl = search.get("returnUrl") || location.state?.from?.pathname || "/";
  const jwt = resolveSsoJwt(cookies.jwt);
  const auth = search.get("auth") || "";

  const handleRedirect = (url: string) => {
    navigate(url);
  };

  const postChurchRegister = async (_church: ChurchInterface) => {
    if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") ReactGA.event({ category: "Church", action: "Register" });
  };

  const trackUserRegister = async (_user: UserInterface) => {
    if (EnvironmentHelper.Common.GoogleAnalyticsTag !== "") ReactGA.event({ category: "User", action: "Register" });
  };

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "#EEE",
        minHeight: "100vh"
      }}
    >
      <Box
        sx={{
          marginLeft: "auto",
          marginRight: "auto"
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
