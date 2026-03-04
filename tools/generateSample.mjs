// Generates sampleimport.zip with demo data aligned to the API demo format.
// Run: node tools/generateSample.mjs

import JSZip from "jszip";
import { writeFileSync } from "fs";
import Papa from "papaparse";

// ── Households (25) ──────────────────────────────────────────────────────────
const households = [
  "Smith Family", "Johnson Family", "Williams Family", "Brown Family", "Jones Family",
  "Garcia Family", "Miller Family", "Davis Family", "Rodriguez Family", "Martinez Family",
  "Hernandez Family", "Lopez Family", "Gonzalez Family", "Wilson Family", "Anderson Family",
  "Thomas Family", "Taylor Family", "Moore Family", "Jackson Family", "Martin Family",
  "Lee Family", "Thompson Family", "White Family", "Harris Family", "Clark Family"
];

// ── People (81) ──────────────────────────────────────────────────────────────
// Columns: importKey, householdName, householdRole, displayName, lastName, firstName,
//   middleName, nickName, prefix, suffix, birthDate, gender, maritalStatus,
//   membershipStatus, homePhone, mobilePhone, workPhone, email,
//   address1, address2, city, state, zip
const people = [
  // Smith Family (Parents + 3 children)
  [1,"Smith Family","Head","John Smith","Smith","John","Robert","","Mr.","","1975-06-15","Male","Married","Member","(217) 555-0101","(217) 555-0102","(217) 555-0103","john.smith@email.com","123 Oak Street","","Springfield","IL","62701"],
  [2,"Smith Family","Spouse","Mary Smith","Smith","Mary","Elizabeth","","Mrs.","","1978-03-22","Female","Married","Member","(217) 555-0101","(217) 555-0104","","mary.smith@email.com","123 Oak Street","","Springfield","IL","62701"],
  [3,"Smith Family","Child","James Smith","Smith","James","William","","","","2005-11-08","Male","Single","Member","(217) 555-0101","(217) 555-0105","","james.smith@email.com","123 Oak Street","","Springfield","IL","62701"],
  [4,"Smith Family","Child","Sarah Smith","Smith","Sarah","Marie","","","","2008-04-17","Female","Single","Member","(217) 555-0101","(217) 555-0106","","sarah.smith@email.com","123 Oak Street","","Springfield","IL","62701"],
  [5,"Smith Family","Child","Michael Smith","Smith","Michael","Thomas","","","","2012-09-30","Male","Single","Member","(217) 555-0101","","","","123 Oak Street","","Springfield","IL","62701"],

  // Johnson Family (Parents + 2 children + 1 grandparent)
  [6,"Johnson Family","Head","Robert Johnson","Johnson","Robert","James","","Mr.","","1980-01-10","Male","Married","Member","(217) 555-0201","(217) 555-0202","(217) 555-0203","robert.johnson@email.com","456 Maple Avenue","","Chatham","IL","62629"],
  [7,"Johnson Family","Spouse","Patricia Johnson","Johnson","Patricia","Ann","","Mrs.","","1982-07-25","Female","Married","Member","(217) 555-0201","(217) 555-0204","","patricia.johnson@email.com","456 Maple Avenue","","Chatham","IL","62629"],
  [8,"Johnson Family","Child","Elizabeth Johnson","Johnson","Elizabeth","Grace","","","","2010-12-03","Female","Single","Member","(217) 555-0201","","","","456 Maple Avenue","","Chatham","IL","62629"],
  [9,"Johnson Family","Child","David Johnson","Johnson","David","Michael","","","","2014-05-19","Male","Single","Member","(217) 555-0201","","","","456 Maple Avenue","","Chatham","IL","62629"],
  [10,"Johnson Family","Other","Margaret Johnson","Johnson","Margaret","Louise","","Mrs.","","1955-08-14","Female","Widowed","Member","(217) 555-0205","(217) 555-0206","","margaret.johnson@email.com","456 Maple Avenue","","Chatham","IL","62629"],

  // Williams Family (Single parent + 2 children)
  [11,"Williams Family","Head","Jennifer Williams","Williams","Jennifer","Lynn","","Ms.","","1985-11-30","Female","Divorced","Member","(217) 555-0301","(217) 555-0302","(217) 555-0303","jennifer.williams@email.com","789 Pine Road","","Rochester","IL","62563"],
  [12,"Williams Family","Child","Christopher Williams","Williams","Christopher","Allen","","","","2011-03-15","Male","Single","Member","(217) 555-0301","","","","789 Pine Road","","Rochester","IL","62563"],
  [13,"Williams Family","Child","Emma Williams","Williams","Emma","Rose","","","","2013-07-22","Female","Single","Member","(217) 555-0301","","","","789 Pine Road","","Rochester","IL","62563"],

  // Brown Family (Young married couple)
  [14,"Brown Family","Head","Daniel Brown","Brown","Daniel","Joseph","","Mr.","","1992-04-18","Male","Married","Member","(217) 555-0401","(217) 555-0402","(217) 555-0403","daniel.brown@email.com","321 Cedar Lane","","Springfield","IL","62704"],
  [15,"Brown Family","Spouse","Lisa Brown","Brown","Lisa","Marie","","Mrs.","","1993-09-25","Female","Married","Member","(217) 555-0401","(217) 555-0404","","lisa.brown@email.com","321 Cedar Lane","","Springfield","IL","62704"],

  // Jones Family (Blended family)
  [16,"Jones Family","Head","Thomas Jones","Jones","Thomas","Edward","","Mr.","","1982-11-30","Male","Married","Member","(217) 555-0501","(217) 555-0502","(217) 555-0503","thomas.jones@email.com","654 Birch Court","","Sherman","IL","62684"],
  [17,"Jones Family","Spouse","Rebecca Jones","Jones","Rebecca","Jean","","Mrs.","","1984-05-12","Female","Married","Member","(217) 555-0501","(217) 555-0504","","rebecca.jones@email.com","654 Birch Court","","Sherman","IL","62684"],
  [18,"Jones Family","Child","Matthew Jones","Jones","Matthew","David","","","","2007-08-15","Male","Single","Member","(217) 555-0501","","","","654 Birch Court","","Sherman","IL","62684"],
  [19,"Jones Family","Child","Sophia Jones","Jones","Sophia","Grace","","","","2010-02-28","Female","Single","Member","(217) 555-0501","","","","654 Birch Court","","Sherman","IL","62684"],
  [20,"Jones Family","Child","Ethan Smith","Jones","Ethan","James","","","","2009-11-03","Male","Single","Member","(217) 555-0501","","","","654 Birch Court","","Sherman","IL","62684"],

  // Garcia Family (Multi-generational)
  [21,"Garcia Family","Head","Carlos Garcia","Garcia","Carlos","Miguel","","Mr.","","1978-07-22","Male","Married","Member","(217) 555-0601","(217) 555-0602","(217) 555-0603","carlos.garcia@email.com","987 Walnut Street","","Springfield","IL","62703"],
  [22,"Garcia Family","Spouse","Maria Garcia","Garcia","Maria","Isabel","","Mrs.","","1980-03-14","Female","Married","Member","(217) 555-0601","(217) 555-0604","","maria.garcia@email.com","987 Walnut Street","","Springfield","IL","62703"],
  [23,"Garcia Family","Child","Isabella Garcia","Garcia","Isabella","Maria","","","","2012-06-30","Female","Single","Member","(217) 555-0601","","","","987 Walnut Street","","Springfield","IL","62703"],
  [24,"Garcia Family","Other","Antonio Garcia","Garcia","Antonio","Jose","","Mr.","","1952-12-05","Male","Widowed","Member","(217) 555-0605","(217) 555-0606","","antonio.garcia@email.com","987 Walnut Street","","Springfield","IL","62703"],

  // Miller Family (Empty nesters)
  [25,"Miller Family","Head","Richard Miller","Miller","Richard","Alan","","Mr.","","1965-09-18","Male","Married","Member","(217) 555-0701","(217) 555-0702","(217) 555-0703","richard.miller@email.com","147 Spruce Drive","","Riverton","IL","62561"],
  [26,"Miller Family","Spouse","Susan Miller","Miller","Susan","Kay","","Mrs.","","1967-02-25","Female","Married","Member","(217) 555-0701","(217) 555-0704","","susan.miller@email.com","147 Spruce Drive","","Riverton","IL","62561"],

  // Davis Family (Young family)
  [27,"Davis Family","Head","Michael Davis","Davis","Michael","James","","Mr.","","1988-05-20","Male","Married","Member","(217) 555-0801","(217) 555-0802","(217) 555-0803","michael.davis@email.com","258 Elm Street","","Williamsville","IL","62693"],
  [28,"Davis Family","Spouse","Emily Davis","Davis","Emily","Anne","","Mrs.","","1989-11-15","Female","Married","Member","(217) 555-0801","(217) 555-0804","","emily.davis@email.com","258 Elm Street","","Williamsville","IL","62693"],
  [29,"Davis Family","Child","Olivia Davis","Davis","Olivia","Grace","","","","2018-03-10","Female","Single","Member","(217) 555-0801","","","","258 Elm Street","","Williamsville","IL","62693"],
  [30,"Davis Family","Child","Noah Davis","Davis","Noah","James","","","","2020-07-22","Male","Single","Member","(217) 555-0801","","","","258 Elm Street","","Williamsville","IL","62693"],

  // Rodriguez Family (Single parent)
  [31,"Rodriguez Family","Head","Sofia Rodriguez","Rodriguez","Sofia","Maria","","Ms.","","1986-08-12","Female","Divorced","Member","(217) 555-0901","(217) 555-0902","(217) 555-0903","sofia.rodriguez@email.com","369 Ash Avenue","","Springfield","IL","62702"],
  [32,"Rodriguez Family","Child","Lucas Rodriguez","Rodriguez","Lucas","Antonio","","","","2013-04-25","Male","Single","Member","(217) 555-0901","","","","369 Ash Avenue","","Springfield","IL","62702"],
  [33,"Rodriguez Family","Child","Mia Rodriguez","Rodriguez","Mia","Isabella","","","","2015-09-18","Female","Single","Member","(217) 555-0901","","","","369 Ash Avenue","","Springfield","IL","62702"],

  // Martinez Family (Senior couple)
  [34,"Martinez Family","Head","Jose Martinez","Martinez","Jose","Antonio","","Mr.","","1958-03-15","Male","Married","Member","(217) 555-1001","(217) 555-1002","(217) 555-1003","jose.martinez@email.com","741 Poplar Lane","","Pawnee","IL","62558"],
  [35,"Martinez Family","Spouse","Carmen Martinez","Martinez","Carmen","Rosa","","Mrs.","","1960-07-28","Female","Married","Member","(217) 555-1001","(217) 555-1004","","carmen.martinez@email.com","741 Poplar Lane","","Pawnee","IL","62558"],

  // Hernandez Family (Large family)
  [36,"Hernandez Family","Head","Miguel Hernandez","Hernandez","Miguel","Angel","","Mr.","","1983-01-20","Male","Married","Member","(217) 555-1101","(217) 555-1102","(217) 555-1103","miguel.hernandez@email.com","852 Cherry Street","","Springfield","IL","62704"],
  [37,"Hernandez Family","Spouse","Ana Hernandez","Hernandez","Ana","Maria","","Mrs.","","1984-06-15","Female","Married","Member","(217) 555-1101","(217) 555-1104","","ana.hernandez@email.com","852 Cherry Street","","Springfield","IL","62704"],
  [38,"Hernandez Family","Child","Diego Hernandez","Hernandez","Diego","Miguel","","","","2009-11-30","Male","Single","Member","(217) 555-1101","","","","852 Cherry Street","","Springfield","IL","62704"],
  [39,"Hernandez Family","Child","Valentina Hernandez","Hernandez","Valentina","Isabella","","","","2011-04-12","Female","Single","Member","(217) 555-1101","","","","852 Cherry Street","","Springfield","IL","62704"],
  [40,"Hernandez Family","Child","Gabriel Hernandez","Hernandez","Gabriel","Jose","","","","2014-08-25","Male","Single","Member","(217) 555-1101","","","","852 Cherry Street","","Springfield","IL","62704"],
  [41,"Hernandez Family","Child","Isabella Hernandez","Hernandez","Isabella","Maria","","","","2016-12-03","Female","Single","Member","(217) 555-1101","","","","852 Cherry Street","","Springfield","IL","62704"],

  // Lopez Family (Young professionals)
  [42,"Lopez Family","Head","David Lopez","Lopez","David","Robert","","Mr.","","1990-09-10","Male","Married","Member","(217) 555-1201","(217) 555-1202","(217) 555-1203","david.lopez@email.com","963 Magnolia Drive","","Auburn","IL","62615"],
  [43,"Lopez Family","Spouse","Laura Lopez","Lopez","Laura","Elizabeth","","Mrs.","","1991-12-05","Female","Married","Member","(217) 555-1201","(217) 555-1204","","laura.lopez@email.com","963 Magnolia Drive","","Auburn","IL","62615"],

  // Gonzalez Family (Multi-generational)
  [44,"Gonzalez Family","Head","Roberto Gonzalez","Gonzalez","Roberto","Carlos","","Mr.","","1975-04-18","Male","Married","Member","(217) 555-1301","(217) 555-1302","(217) 555-1303","roberto.gonzalez@email.com","159 Sycamore Road","","Springfield","IL","62703"],
  [45,"Gonzalez Family","Spouse","Elena Gonzalez","Gonzalez","Elena","Maria","","Mrs.","","1977-08-22","Female","Married","Member","(217) 555-1301","(217) 555-1304","","elena.gonzalez@email.com","159 Sycamore Road","","Springfield","IL","62703"],
  [46,"Gonzalez Family","Child","Adriana Gonzalez","Gonzalez","Adriana","Isabella","","","","2010-03-15","Female","Single","Member","(217) 555-1301","","","","159 Sycamore Road","","Springfield","IL","62703"],
  [47,"Gonzalez Family","Child","Fernando Gonzalez","Gonzalez","Fernando","Jose","","","","2012-07-28","Male","Single","Member","(217) 555-1301","","","","159 Sycamore Road","","Springfield","IL","62703"],
  [48,"Gonzalez Family","Other","Rosa Gonzalez","Gonzalez","Rosa","Maria","","Mrs.","","1950-11-30","Female","Widowed","Member","(217) 555-1305","(217) 555-1306","","rosa.gonzalez@email.com","159 Sycamore Road","","Springfield","IL","62703"],

  // Wilson Family (Blended family)
  [49,"Wilson Family","Head","James Wilson","Wilson","James","William","","Mr.","","1981-06-25","Male","Married","Member","(217) 555-1401","(217) 555-1402","(217) 555-1403","james.wilson@email.com","357 Oakwood Avenue","","Virden","IL","62690"],
  [50,"Wilson Family","Spouse","Sarah Wilson","Wilson","Sarah","Elizabeth","","Mrs.","","1983-02-14","Female","Married","Member","(217) 555-1401","(217) 555-1404","","sarah.wilson@email.com","357 Oakwood Avenue","","Virden","IL","62690"],
  [51,"Wilson Family","Child","Andrew Wilson","Wilson","Andrew","James","","","","2008-09-20","Male","Single","Member","(217) 555-1401","","","","357 Oakwood Avenue","","Virden","IL","62690"],
  [52,"Wilson Family","Child","Emma Thompson","Wilson","Emma","Marie","Thompson","","","2011-05-12","Female","Single","Member","(217) 555-1401","","","","357 Oakwood Avenue","","Virden","IL","62690"],
  [53,"Wilson Family","Child","Benjamin Wilson","Wilson","Benjamin","Thomas","","","","2014-11-30","Male","Single","Member","(217) 555-1401","","","","357 Oakwood Avenue","","Virden","IL","62690"],

  // Anderson Family (Senior with adult child)
  [54,"Anderson Family","Head","William Anderson","Anderson","William","Thomas","","Mr.","","1948-03-10","Male","Widowed","Member","(217) 555-1501","(217) 555-1502","","william.anderson@email.com","486 Pine Street","","Springfield","IL","62702"],
  [55,"Anderson Family","Child","Elizabeth Anderson","Anderson","Elizabeth","Marie","","Ms.","","1975-08-15","Female","Single","Member","(217) 555-1501","(217) 555-1503","(217) 555-1504","elizabeth.anderson@email.com","486 Pine Street","","Springfield","IL","62702"],

  // Thomas Family (Young family)
  [56,"Thomas Family","Head","Christopher Thomas","Thomas","Christopher","Michael","","Mr.","","1987-12-05","Male","Married","Member","(217) 555-1601","(217) 555-1602","(217) 555-1603","christopher.thomas@email.com","753 Cedar Court","","Springfield","IL","62704"],
  [57,"Thomas Family","Spouse","Amanda Thomas","Thomas","Amanda","Jean","","Mrs.","","1989-04-18","Female","Married","Member","(217) 555-1601","(217) 555-1604","","amanda.thomas@email.com","753 Cedar Court","","Springfield","IL","62704"],
  [58,"Thomas Family","Child","Daniel Thomas","Thomas","Daniel","James","","","","2017-06-22","Male","Single","Member","(217) 555-1601","","","","753 Cedar Court","","Springfield","IL","62704"],
  [59,"Thomas Family","Child","Sophia Thomas","Thomas","Sophia","Marie","","","","2019-09-15","Female","Single","Member","(217) 555-1601","","","","753 Cedar Court","","Springfield","IL","62704"],

  // Taylor Family (Single adult)
  [60,"Taylor Family","Head","Jessica Taylor","Taylor","Jessica","Marie","","Ms.","","1992-07-30","Female","Single","Member","(217) 555-1701","(217) 555-1702","(217) 555-1703","jessica.taylor@email.com","951 Maple Lane","","Springfield","IL","62703"],

  // Moore Family (Empty nesters)
  [61,"Moore Family","Head","Robert Moore","Moore","Robert","James","","Mr.","","1962-05-12","Male","Married","Member","(217) 555-1801","(217) 555-1802","(217) 555-1803","robert.moore@email.com","264 Birch Street","","Springfield","IL","62701"],
  [62,"Moore Family","Spouse","Patricia Moore","Moore","Patricia","Ann","","Mrs.","","1964-09-25","Female","Married","Member","(217) 555-1801","(217) 555-1804","","patricia.moore@email.com","264 Birch Street","","Springfield","IL","62701"],

  // Jackson Family (Multi-generational)
  [63,"Jackson Family","Head","Marcus Jackson","Jackson","Marcus","Anthony","","Mr.","","1979-11-15","Male","Married","Member","(217) 555-1901","(217) 555-1902","(217) 555-1903","marcus.jackson@email.com","852 Walnut Court","","Springfield","IL","62704"],
  [64,"Jackson Family","Spouse","Nicole Jackson","Jackson","Nicole","Marie","","Mrs.","","1981-03-28","Female","Married","Member","(217) 555-1901","(217) 555-1904","","nicole.jackson@email.com","852 Walnut Court","","Springfield","IL","62704"],
  [65,"Jackson Family","Child","Jordan Jackson","Jackson","Jordan","Michael","","","","2013-08-10","Male","Single","Member","(217) 555-1901","","","","852 Walnut Court","","Springfield","IL","62704"],
  [66,"Jackson Family","Child","Grace Jackson","Jackson","Grace","Elizabeth","","","","2015-12-22","Female","Single","Member","(217) 555-1901","","","","852 Walnut Court","","Springfield","IL","62704"],
  [67,"Jackson Family","Other","Dorothy Jackson","Jackson","Dorothy","Jean","","Mrs.","","1953-06-18","Female","Widowed","Member","(217) 555-1905","(217) 555-1906","","dorothy.jackson@email.com","852 Walnut Court","","Springfield","IL","62704"],

  // Martin Family (Young couple)
  [68,"Martin Family","Head","Kevin Martin","Martin","Kevin","James","","Mr.","","1991-02-20","Male","Married","Member","(217) 555-2001","(217) 555-2002","(217) 555-2003","kevin.martin@email.com","147 Elm Avenue","","Springfield","IL","62702"],
  [69,"Martin Family","Spouse","Rachel Martin","Martin","Rachel","Elizabeth","","Mrs.","","1992-08-15","Female","Married","Member","(217) 555-2001","(217) 555-2004","","rachel.martin@email.com","147 Elm Avenue","","Springfield","IL","62702"],

  // Lee Family (Single parent)
  [70,"Lee Family","Head","Michelle Lee","Lee","Michelle","Elizabeth","","Ms.","","1984-10-05","Female","Divorced","Member","(217) 555-2101","(217) 555-2102","(217) 555-2103","michelle.lee@email.com","369 Pine Road","","Springfield","IL","62703"],
  [71,"Lee Family","Child","Ryan Lee","Lee","Ryan","James","","","","2012-01-18","Male","Single","Member","(217) 555-2101","","","","369 Pine Road","","Springfield","IL","62703"],
  [72,"Lee Family","Child","Ava Lee","Lee","Ava","Marie","","","","2014-04-30","Female","Single","Member","(217) 555-2101","","","","369 Pine Road","","Springfield","IL","62703"],

  // Thompson Family (Senior couple)
  [73,"Thompson Family","Head","George Thompson","Thompson","George","William","","Mr.","","1956-07-22","Male","Married","Member","(217) 555-2201","(217) 555-2202","(217) 555-2203","george.thompson@email.com","582 Cedar Lane","","Springfield","IL","62701"],
  [74,"Thompson Family","Spouse","Margaret Thompson","Thompson","Margaret","Ann","","Mrs.","","1958-12-15","Female","Married","Member","(217) 555-2201","(217) 555-2204","","margaret.thompson@email.com","582 Cedar Lane","","Springfield","IL","62701"],

  // White Family (Young family)
  [75,"White Family","Head","Steven White","White","Steven","James","","Mr.","","1986-03-10","Male","Married","Member","(217) 555-2301","(217) 555-2302","(217) 555-2303","steven.white@email.com","753 Oak Street","","Springfield","IL","62704"],
  [76,"White Family","Spouse","Melissa White","White","Melissa","Marie","","Mrs.","","1987-09-25","Female","Married","Member","(217) 555-2301","(217) 555-2304","","melissa.white@email.com","753 Oak Street","","Springfield","IL","62704"],
  [77,"White Family","Child","Jacob White","White","Jacob","Thomas","","","","2016-05-18","Male","Single","Member","(217) 555-2301","","","","753 Oak Street","","Springfield","IL","62704"],
  [78,"White Family","Child","Madison White","White","Madison","Elizabeth","","","","2018-11-30","Female","Single","Member","(217) 555-2301","","","","753 Oak Street","","Springfield","IL","62704"],

  // Harris Family (Single adult)
  [79,"Harris Family","Head","Brian Harris","Harris","Brian","James","","Mr.","","1993-04-15","Male","Single","Member","(217) 555-2401","(217) 555-2402","(217) 555-2403","brian.harris@email.com","951 Maple Court","","Springfield","IL","62702"],

  // Clark Family (Empty nesters)
  [80,"Clark Family","Head","Donald Clark","Clark","Donald","James","","Mr.","","1960-08-28","Male","Married","Member","(217) 555-2501","(217) 555-2502","(217) 555-2503","donald.clark@email.com","264 Birch Avenue","","Springfield","IL","62703"],
  [81,"Clark Family","Spouse","Carol Clark","Clark","Carol","Marie","","Mrs.","","1962-01-12","Female","Married","Member","(217) 555-2501","(217) 555-2504","","carol.clark@email.com","264 Birch Avenue","","Springfield","IL","62703"],
];

const peopleCols = [
  "importKey","householdName","householdRole","displayName","lastName","firstName",
  "middleName","nickName","prefix","suffix","birthDate","gender","maritalStatus",
  "membershipStatus","homePhone","mobilePhone","workPhone","email",
  "address1","address2","city","state","zip"
];

// ── Services (campus / service / time) ───────────────────────────────────────
const servicesCsv = [
  { importKey: 1, campus: "Main Campus", service: "Sunday Morning Service", time: "9:00 AM Service" },
  { importKey: 2, campus: "Main Campus", service: "Sunday Morning Service", time: "10:30 AM Service" },
  { importKey: 3, campus: "Main Campus", service: "Sunday Evening Service", time: "6:00 PM Service" },
  { importKey: 4, campus: "Main Campus", service: "Wednesday Evening Service", time: "7:00 PM Service" },
];

// ── Groups (30) ──────────────────────────────────────────────────────────────
// importKey, serviceTimeKey, categoryName, name, trackAttendance
const groups = [
  // Worship Services (linked to service times)
  { importKey: 1, serviceTimeKey: 1, categoryName: "Worship", name: "Sunday Morning Service", trackAttendance: "TRUE" },
  { importKey: 1, serviceTimeKey: 2, categoryName: "", name: "", trackAttendance: "" },
  { importKey: 2, serviceTimeKey: 3, categoryName: "Worship", name: "Sunday Evening Service", trackAttendance: "TRUE" },
  { importKey: 3, serviceTimeKey: 4, categoryName: "Worship", name: "Wednesday Prayer Service", trackAttendance: "TRUE" },

  // Sunday School Classes
  { importKey: 4, serviceTimeKey: 1, categoryName: "Sunday School", name: "Adult Bible Class", trackAttendance: "TRUE" },
  { importKey: 5, serviceTimeKey: 1, categoryName: "Sunday School", name: "Young Adults Class", trackAttendance: "TRUE" },
  { importKey: 6, serviceTimeKey: 1, categoryName: "Sunday School", name: "Senior Adults Class", trackAttendance: "TRUE" },

  // Children's Ministry
  { importKey: 7, serviceTimeKey: 1, categoryName: "Children", name: "Nursery (0-2)", trackAttendance: "TRUE" },
  { importKey: 8, serviceTimeKey: 1, categoryName: "Children", name: "Preschool (3-5)", trackAttendance: "TRUE" },
  { importKey: 9, serviceTimeKey: 1, categoryName: "Children", name: "Elementary (K-2)", trackAttendance: "TRUE" },
  { importKey: 10, serviceTimeKey: 1, categoryName: "Children", name: "Elementary (3-5)", trackAttendance: "TRUE" },

  // Youth Ministry
  { importKey: 11, serviceTimeKey: 1, categoryName: "Youth", name: "Middle School Youth", trackAttendance: "TRUE" },
  { importKey: 12, serviceTimeKey: 1, categoryName: "Youth", name: "High School Youth", trackAttendance: "TRUE" },
  { importKey: 13, serviceTimeKey: "", categoryName: "Youth", name: "Youth Group", trackAttendance: "TRUE" },

  // Small Groups (no service time)
  { importKey: 14, serviceTimeKey: "", categoryName: "Small Groups", name: "Young Families Group", trackAttendance: "TRUE" },
  { importKey: 15, serviceTimeKey: "", categoryName: "Small Groups", name: "Empty Nesters Group", trackAttendance: "TRUE" },
  { importKey: 16, serviceTimeKey: "", categoryName: "Small Groups", name: "Men's Bible Study", trackAttendance: "TRUE" },
  { importKey: 17, serviceTimeKey: "", categoryName: "Small Groups", name: "Women's Bible Study", trackAttendance: "TRUE" },

  // Music Ministry
  { importKey: 18, serviceTimeKey: "", categoryName: "Music", name: "Adult Choir", trackAttendance: "TRUE" },
  { importKey: 19, serviceTimeKey: "", categoryName: "Music", name: "Praise Team", trackAttendance: "TRUE" },
  { importKey: 20, serviceTimeKey: "", categoryName: "Music", name: "Children's Choir", trackAttendance: "TRUE" },

  // Outreach Ministry
  { importKey: 21, serviceTimeKey: "", categoryName: "Outreach", name: "Food Pantry Team", trackAttendance: "TRUE" },
  { importKey: 22, serviceTimeKey: "", categoryName: "Outreach", name: "Missions Committee", trackAttendance: "TRUE" },
  { importKey: 23, serviceTimeKey: "", categoryName: "Outreach", name: "Community Service Team", trackAttendance: "TRUE" },

  // Special Ministries
  { importKey: 24, serviceTimeKey: "", categoryName: "Special", name: "Prayer Team", trackAttendance: "TRUE" },
  { importKey: 25, serviceTimeKey: "", categoryName: "Special", name: "Greeters Ministry", trackAttendance: "TRUE" },
  { importKey: 26, serviceTimeKey: "", categoryName: "Special", name: "Ushers Ministry", trackAttendance: "TRUE" },

  // Support Groups
  { importKey: 27, serviceTimeKey: "", categoryName: "Support", name: "Divorce Care", trackAttendance: "TRUE" },
  { importKey: 28, serviceTimeKey: "", categoryName: "Support", name: "Grief Support", trackAttendance: "TRUE" },
  { importKey: 29, serviceTimeKey: "", categoryName: "Support", name: "Financial Peace", trackAttendance: "TRUE" },

  // Events
  { importKey: 30, serviceTimeKey: "", categoryName: "Events", name: "Vacation Bible School", trackAttendance: "TRUE" },
];

// ── Group Members (90+) ─────────────────────────────────────────────────────
const groupMembers = [
  // Sunday Morning Service (worship — sample of regular attenders)
  {groupKey:1,personKey:1},{groupKey:1,personKey:2},{groupKey:1,personKey:3},{groupKey:1,personKey:4},{groupKey:1,personKey:5},
  {groupKey:1,personKey:6},{groupKey:1,personKey:7},{groupKey:1,personKey:8},{groupKey:1,personKey:9},{groupKey:1,personKey:10},
  {groupKey:1,personKey:11},{groupKey:1,personKey:12},{groupKey:1,personKey:13},{groupKey:1,personKey:14},{groupKey:1,personKey:15},

  // Sunday School — Adult Bible
  {groupKey:4,personKey:1},{groupKey:4,personKey:2},{groupKey:4,personKey:25},{groupKey:4,personKey:26},
  // Young Adults
  {groupKey:5,personKey:27},{groupKey:5,personKey:28},{groupKey:5,personKey:42},{groupKey:5,personKey:43},
  // Senior Adults
  {groupKey:6,personKey:54},{groupKey:6,personKey:73},{groupKey:6,personKey:74},

  // Children's Ministry
  {groupKey:7,personKey:29},{groupKey:7,personKey:30}, // Nursery
  {groupKey:8,personKey:32},{groupKey:8,personKey:33}, // Preschool
  {groupKey:9,personKey:3},{groupKey:9,personKey:4}, // Elementary K-2
  {groupKey:10,personKey:38},{groupKey:10,personKey:39}, // Elementary 3-5

  // Youth Ministry
  {groupKey:11,personKey:18},{groupKey:11,personKey:19},{groupKey:11,personKey:20}, // Middle School
  {groupKey:12,personKey:51},{groupKey:12,personKey:52}, // High School
  {groupKey:13,personKey:18},{groupKey:13,personKey:19},{groupKey:13,personKey:20},{groupKey:13,personKey:51},{groupKey:13,personKey:52}, // Youth Group

  // Small Groups
  {groupKey:14,personKey:27},{groupKey:14,personKey:28},{groupKey:14,personKey:56},{groupKey:14,personKey:57}, // Young Families
  {groupKey:15,personKey:25},{groupKey:15,personKey:26},{groupKey:15,personKey:61},{groupKey:15,personKey:62}, // Empty Nesters
  {groupKey:16,personKey:1},{groupKey:16,personKey:16},{groupKey:16,personKey:21},{groupKey:16,personKey:36}, // Men's Bible Study
  {groupKey:17,personKey:2},{groupKey:17,personKey:17},{groupKey:17,personKey:22},{groupKey:17,personKey:37}, // Women's Bible Study

  // Music Ministry
  {groupKey:18,personKey:2},{groupKey:18,personKey:17},{groupKey:18,personKey:22}, // Adult Choir
  {groupKey:19,personKey:27},{groupKey:19,personKey:28},{groupKey:19,personKey:42}, // Praise Team
  {groupKey:20,personKey:3},{groupKey:20,personKey:4},{groupKey:20,personKey:38},{groupKey:20,personKey:39}, // Children's Choir

  // Outreach Ministry
  {groupKey:21,personKey:16},{groupKey:21,personKey:17},{groupKey:21,personKey:21}, // Food Pantry
  {groupKey:22,personKey:36},{groupKey:22,personKey:37},{groupKey:22,personKey:44}, // Missions Committee
  {groupKey:23,personKey:75},{groupKey:23,personKey:76},{groupKey:23,personKey:61}, // Community Service

  // Special Ministries
  {groupKey:24,personKey:54},{groupKey:24,personKey:73},{groupKey:24,personKey:74}, // Prayer Team
  {groupKey:25,personKey:68},{groupKey:25,personKey:69},{groupKey:25,personKey:79}, // Greeters
  {groupKey:26,personKey:56},{groupKey:26,personKey:75},{groupKey:26,personKey:80}, // Ushers

  // Support Groups
  {groupKey:27,personKey:31},{groupKey:27,personKey:70}, // Divorce Care
  {groupKey:28,personKey:73},{groupKey:28,personKey:74}, // Grief Support
  {groupKey:29,personKey:56},{groupKey:29,personKey:57},{groupKey:29,personKey:68},{groupKey:29,personKey:69}, // Financial Peace

  // VBS
  {groupKey:30,personKey:3},{groupKey:30,personKey:4},
];

// ── Donations (4 weeks × ~7 donors, matching API giving pattern) ─────────────
const donationsCsv = [];
const weeks = [
  { batch: "March 2, 2025 Batch", date: "2025-03-02" },
  { batch: "March 9, 2025 Batch", date: "2025-03-09" },
  { batch: "March 16, 2025 Batch", date: "2025-03-16" },
  { batch: "March 23, 2025 Batch", date: "2025-03-23" },
];

// Regular donor patterns: personKey, method, methodDetails, {fund: amount} pairs
const donors = [
  { personKey: 1,  method: "Credit Card", methodDetails: "STRIPE", notes: "Monthly tithe",   funds: [["General Fund",400],["Building Fund",100]] },
  { personKey: 6,  method: "Credit Card", methodDetails: "STRIPE", notes: "Monthly giving",  funds: [["General Fund",200],["Missions Fund",50]] },
  { personKey: 16, method: "Credit Card", methodDetails: "STRIPE", notes: "Monthly tithe",   funds: [["General Fund",240],["Youth Ministry",60]] },
  { personKey: 21, method: "Credit Card", methodDetails: "STRIPE", notes: "Monthly giving",  funds: [["General Fund",160],["Food Pantry",40]] },
  { personKey: 25, method: "Credit Card", methodDetails: "STRIPE", notes: "Monthly tithe",   funds: [["General Fund",320],["Benevolence Fund",80]] },
  { personKey: 27, method: "Credit Card", methodDetails: "STRIPE", notes: "Weekly giving",   funds: [["General Fund",120],["Youth Ministry",30]] },
  { personKey: 36, method: "Cash",        methodDetails: "",       notes: "Weekly tithe",    funds: [["General Fund",100]] },
];

// Some donors only appear on certain weeks for variety
const extraDonors = [
  { week: 1, personKey: 44, method: "Check", methodDetails: "1001", notes: "Weekly tithe",  funds: [["General Fund",140],["Missions Fund",35]] },
  { week: 2, personKey: 49, method: "Credit Card", methodDetails: "STRIPE", notes: "Weekly giving", funds: [["General Fund",100],["Food Pantry",25]] },
  { week: 3, personKey: 56, method: "Credit Card", methodDetails: "STRIPE", notes: "Weekly giving", funds: [["General Fund",180],["Youth Ministry",45]] },
];

weeks.forEach((w, wi) => {
  donors.forEach(d => {
    d.funds.forEach(([fund, amount]) => {
      donationsCsv.push({ batch: w.batch, date: w.date, personKey: d.personKey, method: d.method, methodDetails: d.methodDetails, amount, fund, notes: d.notes });
    });
  });
  extraDonors.filter(e => e.week === wi).forEach(d => {
    d.funds.forEach(([fund, amount]) => {
      donationsCsv.push({ batch: w.batch, date: w.date, personKey: d.personKey, method: d.method, methodDetails: d.methodDetails, amount, fund, notes: d.notes });
    });
  });
});

// ── Attendance (4 Sundays of 9:00 AM service attendance) ─────────────────────
const attendanceCsv = [];
const attendanceDates = ["2025-03-02","2025-03-09","2025-03-16","2025-03-23"];
// Regular attendees: Smith (1-5), Johnson (6-10), Williams (11-13), Brown (14-15), Davis (27-28)
const regularAttenders9am = [
  { personKey: 1, groupKey: 1 }, { personKey: 2, groupKey: 1 },
  { personKey: 3, groupKey: 9 }, { personKey: 4, groupKey: 9 },
  { personKey: 5, groupKey: 7 },
  { personKey: 6, groupKey: 1 }, { personKey: 7, groupKey: 1 },
  { personKey: 8, groupKey: 10 }, { personKey: 9, groupKey: 10 },
  { personKey: 10, groupKey: 6 },
];
const regularAttenders1030 = [
  { personKey: 11, groupKey: 1 }, { personKey: 12, groupKey: 1 },
  { personKey: 13, groupKey: 9 },
  { personKey: 14, groupKey: 1 }, { personKey: 15, groupKey: 1 },
  { personKey: 27, groupKey: 1 }, { personKey: 28, groupKey: 1 },
  { personKey: 29, groupKey: 7 }, { personKey: 30, groupKey: 7 },
];

attendanceDates.forEach(date => {
  regularAttenders9am.forEach(a => {
    attendanceCsv.push({ date, serviceTimeKey: 1, groupKey: a.groupKey, personKey: a.personKey });
  });
  regularAttenders1030.forEach(a => {
    attendanceCsv.push({ date, serviceTimeKey: 2, groupKey: a.groupKey, personKey: a.personKey });
  });
});

// Extra Palm Sunday (March 23) visitors
[{personKey:16,groupKey:1},{personKey:17,groupKey:1},{personKey:21,groupKey:1},{personKey:22,groupKey:1}].forEach(a => {
  attendanceCsv.push({ date: "2025-03-23", serviceTimeKey: 2, groupKey: a.groupKey, personKey: a.personKey });
});

// ── Forms ────────────────────────────────────────────────────────────────────
const formsCsv = [
  { importKey: 1, name: "Visitor Card", contentType: "person" },
  { importKey: 2, name: "Volunteer Application", contentType: "person" },
];

const questionsCsv = [
  { questionKey: 1, formKey: 1, title: "How did you hear about us?", fieldType: "Text" },
  { questionKey: 2, formKey: 1, title: "Would you like more information?", fieldType: "Yes/No" },
  { questionKey: 3, formKey: 2, title: "Area of interest", fieldType: "Text" },
  { questionKey: 4, formKey: 2, title: "Available days", fieldType: "Text" },
];

const formSubmissionsCsv = [
  { formKey: 1, personKey: 14, contentType: "person" },
  { formKey: 1, personKey: 15, contentType: "person" },
  { formKey: 2, personKey: 79, contentType: "person" },
];

const answersCsv = [
  { questionKey: 1, formSubmissionKey: 1, value: "Friend invited us" },
  { questionKey: 2, formSubmissionKey: 1, value: "Yes" },
  { questionKey: 1, formSubmissionKey: 2, value: "Drove past the church" },
  { questionKey: 2, formSubmissionKey: 2, value: "Yes" },
  { questionKey: 3, formSubmissionKey: 3, value: "Greeting team, youth ministry" },
  { questionKey: 4, formSubmissionKey: 3, value: "Sundays, Wednesdays" },
];

// ── Build CSV strings ────────────────────────────────────────────────────────
function toCsv(data) { return Papa.unparse(data); }

const peopleRows = people.map(r => {
  const obj = {};
  peopleCols.forEach((c, i) => obj[c] = r[i]);
  return obj;
});

// ── Write ZIP ────────────────────────────────────────────────────────────────
const zip = new JSZip();
zip.file("people.csv", toCsv(peopleRows));
zip.file("services.csv", toCsv(servicesCsv));
zip.file("groups.csv", toCsv(groups));
zip.file("groupmembers.csv", toCsv(groupMembers));
zip.file("donations.csv", toCsv(donationsCsv));
zip.file("attendance.csv", toCsv(attendanceCsv));
zip.file("forms.csv", toCsv(formsCsv));
zip.file("questions.csv", toCsv(questionsCsv));
zip.file("formSubmissions.csv", toCsv(formSubmissionsCsv));
zip.file("answers.csv", toCsv(answersCsv));

const buf = await zip.generateAsync({ type: "nodebuffer" });
writeFileSync("public/sampleimport.zip", buf);
console.log(`Written public/sampleimport.zip (${buf.length} bytes)`);
console.log(`  ${peopleRows.length} people across ${households.length} households`);
console.log(`  ${servicesCsv.length} service times`);
console.log(`  ${groups.length} group rows (${new Set(groups.filter(g => g.name).map(g => g.importKey)).size} unique groups)`);
console.log(`  ${groupMembers.length} group memberships`);
console.log(`  ${donationsCsv.length} donation rows across ${weeks.length} weeks`);
console.log(`  ${attendanceCsv.length} attendance records`);
console.log(`  ${formsCsv.length} forms, ${questionsCsv.length} questions, ${formSubmissionsCsv.length} submissions, ${answersCsv.length} answers`);
