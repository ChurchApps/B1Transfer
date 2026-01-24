import React from "react";
import { SiteHeader } from "@churchapps/apphelper";
import UserContext from "../UserContext";
import { useNavigate } from "react-router-dom";

export const Header: React.FC = () => {
  const context = React.useContext(UserContext);
  const navigate = useNavigate();

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  return (
    <SiteHeader
      primaryMenuItems={[]}
      primaryMenuLabel={"B1 Transfer"}
      secondaryMenuItems={[]}
      secondaryMenuLabel={""}
      context={context}
      appName={"B1Admin"}
      onNavigate={handleNavigate}
    />
  );
};
