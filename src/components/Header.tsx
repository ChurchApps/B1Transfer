import React from "react";
import { SiteHeader } from "@churchapps/apphelper";
import UserContext from "../UserContext";

export const Header: React.FC = () => {
  const context = React.useContext(UserContext);

  return (
    <SiteHeader
      primaryMenuItems={[]}
      primaryMenuLabel={"B1 Transfer"}
      secondaryMenuItems={[]}
      secondaryMenuLabel={""}
      context={context}
      appName={"B1Transfer"}
    />
  );
};
