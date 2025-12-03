import { ApiHelper, CommonEnvironmentHelper, Locale } from "@churchapps/apphelper";

export class EnvironmentHelper {
  //static B1Url = "";
  static Common = CommonEnvironmentHelper;

  //static ContentRoot = "";
  //static GoogleAnalyticsTag = "";

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
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permissions: [] }
    ];

    await Locale.init([`/locales/{{lng}}.json?v=1`, `/apphelper/locales/{{lng}}.json`]);
  }

  static initDev = () => {
    this.initStaging()
    /*;
    EnvironmentHelper.AttendanceApi = import.meta.env.VITE_ATTENDANCE_API || EnvironmentHelper.AttendanceApi;
    EnvironmentHelper.GivingApi = import.meta.env.VITE_GIVING_API || EnvironmentHelper.GivingApi;
    EnvironmentHelper.MembershipApi = import.meta.env.VITE_MEMBERSHIP_API || EnvironmentHelper.MembershipApi;
    */
    //EnvironmentHelper.ContentRoot = import.meta.env.VITE_CONTENT_ROOT || EnvironmentHelper.ContentRoot;


    //EnvironmentHelper.GoogleAnalyticsTag = import.meta.env.VITE_GOOGLE_ANALYTICS || EnvironmentHelper.GoogleAnalyticsTag;
    //EnvironmentHelper.B1Url = import.meta.env.VITE_B1_URL || EnvironmentHelper.B1Url;
  }

  //NOTE: None of these values are secret.
  static initStaging = () => {
    /*
    EnvironmentHelper.AttendanceApi = "https://attendanceapi.staging.churchapps.org";
    EnvironmentHelper.GivingApi = "https://givingapi.staging.churchapps.org";
    EnvironmentHelper.MembershipApi = "https://membershipapi.staging.churchapps.org";
    EnvironmentHelper.ContentRoot = "https://content.staging.churchapps.org";
    EnvironmentHelper.GoogleAnalyticsTag = "";
    EnvironmentHelper.B1Url = "https://app.staging.b1.church";*/
  }

  //NOTE: None of these values are secret.
  static initProd = () => {
    /*
    EnvironmentHelper.AttendanceApi = "https://attendanceapi.churchapps.org";
    EnvironmentHelper.GivingApi = "https://givingapi.churchapps.org";
    EnvironmentHelper.MembershipApi = "https://membershipapi.churchapps.org";
    EnvironmentHelper.ContentRoot = "https://content.churchapps.org";
    EnvironmentHelper.GoogleAnalyticsTag = "UA-164774603-4";
    EnvironmentHelper.B1Url = "https://app.b1.church";*/
  }

}

