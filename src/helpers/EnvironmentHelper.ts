import { ApiHelper, CommonEnvironmentHelper, Locale } from "@churchapps/apphelper";

export class EnvironmentHelper {
  static Common = CommonEnvironmentHelper;

  static init = async () => {
    const stage = import.meta.env.VITE_STAGE;
    console.log("STAGE IS", stage);

    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    EnvironmentHelper.Common.init(stage);


    ApiHelper.apiConfigs = [
      { keyName: "AttendanceApi", url: EnvironmentHelper.Common.AttendanceApi, jwt: "", permissions: [] },
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permissions: [] },
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permissions: [] },
      { keyName: "MessagingApi", url: EnvironmentHelper.Common.MessagingApi, jwt: "", permissions: [] }
    ];

    await Locale.init([`/locales/{{lng}}.json?v=1`, `/apphelper/locales/{{lng}}.json`]);
  };

  static initDev = () => {
    this.initStaging();
  };

  static initStaging = () => {
  };

  static initProd = () => {
  };

}

