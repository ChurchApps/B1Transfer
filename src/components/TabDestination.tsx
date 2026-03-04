import React, { useState } from "react";
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, Button, Alert, Link, FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import { ImportDataInterface } from "../helpers/ImportHelper";
import { DataSourceType } from "../types";
import UserContext from "../UserContext";
import getB1Data from "../helpers/ImportHelpers/ImportB1DbHelper";
import generateBreezeZip from "../helpers/ExportHelpers/ExportBreezeZipHelper";
import generateB1Zip from "../helpers/ExportHelpers/ExportB1ZipHelper";
import exportToB1Db from "../helpers/ExportHelpers/ExportB1DbHelper";
import generatePlanningCenterZip from "../helpers/ExportHelpers/ExportPlanningCenterZipHelper";
import generateTithelyZip from "../helpers/ExportHelpers/ExportTithelyHelper";
import generateCCBZip from "../helpers/ExportHelpers/ExportCCBHelper";
import { FinalCountPreview } from "./FinalCountPreview";
import { ExportCategoriesInterface } from "../Home";

interface Props {
  dataImportSource?: string;
  importData: ImportDataInterface;
  setActiveTab: (tabName: string) => void;
  dataExportSource: string | null;
  setDataExportSource: (src: string | null) => void
  setStatus: (status: Record<string, string>) => void
  setIsExporting: (exporting: boolean) => void;
  showFinalCount: boolean;
  setShowFinalCount: (showing: boolean) => void;
  exportCategories: ExportCategoriesInterface;
  setExportCategories: (cats: ExportCategoriesInterface) => void;
}

export const TabDestination = (props: Props) => {
  const context = React.useContext(UserContext);
  const [b1Data, setB1Data] = useState<ImportDataInterface>();
  const [loginError, setLoginError] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const progress: any = {};

  const setProgress = (name: string, status: string) => {
    progress[name] = status;
    props.setStatus({ ...progress });
  };

  const getB1DBData = async () => {
    const data = await getB1Data();
    setB1Data(data);
  };

  const handleSelect = (e: string) => {
    setLoginError(false);
    if (e === DataSourceType.B1_DB && !context?.user) {
      setLoginError(true);
      return;
    }
    if (e === DataSourceType.B1_DB) {
      props.setDataExportSource(e);
      getB1DBData();
      props.setShowFinalCount(true);
    } else {
      props.setShowFinalCount(false);
      handleExport(e);
    }
  };

  const getFilteredData = (): ImportDataInterface => {
    const cats = props.exportCategories;
    const data = props.importData;
    return {
      people: cats.people ? data.people : [],
      households: cats.people ? data.households : [],
      campuses: data.campuses,
      services: data.services,
      serviceTimes: data.serviceTimes,
      groupServiceTimes: cats.groups ? data.groupServiceTimes : [],
      groups: cats.groups ? data.groups : [],
      groupMembers: cats.groups ? data.groupMembers : [],
      visits: cats.attendance ? data.visits : [],
      sessions: cats.attendance ? data.sessions : [],
      visitSessions: cats.attendance ? data.visitSessions : [],
      batches: cats.donations ? data.batches : [],
      donations: cats.donations ? data.donations : [],
      funds: cats.donations ? data.funds : [],
      fundDonations: cats.donations ? data.fundDonations : [],
      forms: cats.forms ? data.forms : [],
      questions: cats.forms ? data.questions : [],
      formSubmissions: cats.forms ? data.formSubmissions : [],
      answers: cats.forms ? data.answers : []
    };
  };

  const handleExport = async (e: string) => {
    props.setDataExportSource(e);
    setExportError(null);
    if (e === props.dataImportSource) {
      setExportError("Export source must be different than import source to avoid duplication of data.");
      return;
    } else {
      props.setIsExporting(true);
      props.setActiveTab("step4");
      const exportData = getFilteredData();
      try {
        switch (e) {
          case DataSourceType.B1_DB: {
            await exportToB1Db(exportData, setProgress);
            break;
          }
          case DataSourceType.B1_ZIP: {
            await generateB1Zip(exportData, setProgress);
            break;
          }
          case DataSourceType.BREEZE_ZIP: {
            generateBreezeZip(exportData, setProgress);
            break;
          }
          case DataSourceType.PLANNING_CENTER_ZIP: {
            generatePlanningCenterZip(exportData, setProgress);
            break;
          }
          case DataSourceType.TITHELY_CSV: {
            generateTithelyZip(exportData, setProgress);
            break;
          }
          case DataSourceType.CCB_CSV: {
            generateCCBZip(exportData, setProgress);
            break;
          }
          default: {
            break;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setExportError(`Export failed: ${message}`);
        props.setActiveTab("step3");
        props.setIsExporting(false);
      }
    }
  };

  const handleCategoryChange = (key: keyof ExportCategoriesInterface) => {
    props.setExportCategories({ ...props.exportCategories, [key]: !props.exportCategories[key] });
  };

  const categoryLabels: { key: keyof ExportCategoriesInterface; label: string; count: string }[] = [
    { key: "people", label: "People & Households", count: `${props.importData?.people?.length ?? 0} people` },
    { key: "groups", label: "Groups & Members", count: `${props.importData?.groups?.length ?? 0} groups` },
    { key: "attendance", label: "Attendance", count: `${props.importData?.sessions?.length ?? 0} sessions` },
    { key: "donations", label: "Donations", count: `${props.importData?.donations?.length ?? 0} donations` },
    { key: "forms", label: "Forms & Submissions", count: `${props.importData?.forms?.length ?? 0} forms` }
  ];

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: "primary.main", mb: 3 }}>
        Step 3 - Choose Export Destination
      </Typography>
      <Typography variant="body1" paragraph>
        Choose export format and select which data categories to include
      </Typography>

      {loginError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          You must be logged in to use B1 Database as a destination. Please{" "}
          <Link href="/login" sx={{ color: "inherit", fontWeight: "bold", textDecoration: "underline" }}>
            log in
          </Link>{" "}
          first.
        </Alert>
      )}

      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}

      <Box sx={{ mb: 3, p: 2, border: "1px solid", borderColor: "grey.200", borderRadius: 2, maxWidth: 400 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Data Categories</Typography>
        <FormGroup>
          {categoryLabels.map(({ key, label, count }) => (
            <FormControlLabel
              key={key}
              control={<Checkbox checked={props.exportCategories[key]} onChange={() => handleCategoryChange(key)} size="small" />}
              label={<Typography variant="body2">{label} <Typography component="span" variant="body2" color="text.secondary">({count})</Typography></Typography>}
            />
          ))}
        </FormGroup>
      </Box>

      <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
        <InputLabel id="export-destination-select-label">Export Destination</InputLabel>
        <Select
          labelId="export-destination-select-label"
          value={props.dataExportSource || ""}
          label="Export Destination"
          onChange={(e) => handleSelect(e.target.value)}
        >
          <MenuItem value={DataSourceType.B1_DB}>B1 Database</MenuItem>
          <MenuItem value={DataSourceType.B1_ZIP}>B1 Export Zip</MenuItem>
          <MenuItem value={DataSourceType.BREEZE_ZIP}>Breeze Export Zip</MenuItem>
          <MenuItem value={DataSourceType.PLANNING_CENTER_ZIP}>Planning Center zip</MenuItem>
          <MenuItem value={DataSourceType.TITHELY_CSV}>Tithe.ly Export Zip</MenuItem>
          <MenuItem value={DataSourceType.CCB_CSV}>CCB / Pushpay Export Zip</MenuItem>
        </Select>
      </FormControl>

      {props.showFinalCount && props.importData && b1Data && (
        <Box sx={{ mt: 3 }}>
          <FinalCountPreview importData={getFilteredData()} b1Data={b1Data} />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleExport(DataSourceType.B1_DB)}
              sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, px: 4 }}
            >
              Start Transfer
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
