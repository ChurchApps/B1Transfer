import React, { useRef, useState, useCallback } from "react";
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, Link, Alert } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { ImportDataInterface } from "../helpers/ImportHelper";
import { DataSourceType, FieldMapping as FieldMappingType } from "../types";
import UserContext from "../UserContext";
import readB1Zip from "../helpers/ImportHelpers/ImportB1ZipHelper";
import getB1Data from "../helpers/ImportHelpers/ImportB1DbHelper";
import readBreezeZip from "../helpers/ImportHelpers/ImportBreezeZipHelper";
import readPlanningCenterZip from "../helpers/ImportHelpers/ImportPlanningCenterZipHelper";
import readCustomCsv from "../helpers/ImportHelpers/ImportCustomCsvHelper";
import readTithelyCsv from "../helpers/ImportHelpers/ImportTithelyHelper";
import readCCBCsv from "../helpers/ImportHelpers/ImportCCBHelper";
import { UploadHelper } from "../helpers/UploadHelper";
import { FieldMappingUI } from "./FieldMapping";
import Papa from "papaparse";

interface Props {
  dataImportSource?: string;
  importData: ImportDataInterface;
  isLoadingSourceData: boolean;
  setActiveTab: (tabName: string) => void
  setImportData: (data: ImportDataInterface) => void
  setDataImportSource: (data: string | null) => void
}

export const TabSource = (props: Props) => {
  const context = React.useContext(UserContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputIsFile = props.dataImportSource !== DataSourceType.B1_DB;
  const [, setUploadedFileName] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Custom CSV state
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [showMapping, setShowMapping] = useState(false);

  const dataSourceDropDown = [
    { label: "B1 DB", value: DataSourceType.B1_DB },
    { label: "B1 zip", value: DataSourceType.B1_ZIP },
    { label: "Breeze zip", value: DataSourceType.BREEZE_ZIP },
    { label: "Planning center zip", value: DataSourceType.PLANNING_CENTER_ZIP },
    { label: "Custom CSV/XLSX", value: DataSourceType.CUSTOM_CSV },
    { label: "Tithe.ly CSV", value: DataSourceType.TITHELY_CSV },
    { label: "CCB/Pushpay CSV", value: DataSourceType.CCB_CSV }
  ];

  const processFile = useCallback(async (file: File) => {
    setParseError(null);

    if (props.dataImportSource === DataSourceType.CUSTOM_CSV) {
      try {
        let data: any[];
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "xlsx" || ext === "xls") {
          const reader = new FileReader();
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(new DOMException("Could not read file"));
            reader.readAsArrayBuffer(file);
          });
          const sheets = UploadHelper.readXlsx(buffer);
          const firstSheet = Object.keys(sheets)[0];
          data = sheets[firstSheet];
        } else {
          const text = await file.text();
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          data = parsed.data as any[];
        }
        if (!data || data.length === 0) {
          setParseError("File appears to be empty or could not be parsed.");
          return;
        }
        const columns = Object.keys(data[0]).filter(k => k.trim() !== "");
        setCsvColumns(columns);
        setCsvData(data);
        setShowMapping(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setParseError(`Failed to parse file: ${message}`);
      }
      return;
    }

    props.setActiveTab("step2");
    props.setImportData(null);
    try {
      let importData: ImportDataInterface;
      switch (props.dataImportSource) {
        case DataSourceType.B1_ZIP: {
          importData = await readB1Zip(file);
          break;
        }
        case DataSourceType.BREEZE_ZIP: {
          importData = await readBreezeZip(file);
          break;
        }
        case DataSourceType.PLANNING_CENTER_ZIP: {
          importData = await readPlanningCenterZip(file);
          break;
        }
        case DataSourceType.TITHELY_CSV: {
          importData = await readTithelyCsv(file);
          break;
        }
        case DataSourceType.CCB_CSV: {
          importData = await readCCBCsv(file);
          break;
        }
        default: {
          return;
        }
      }
      props.setImportData(importData);
    } catch (e) {
      props.setActiveTab("step1");
      const message = e instanceof Error ? e.message : "Unknown error";
      setParseError(`Failed to parse file: ${message}. Please check that you selected the correct file format.`);
    }
  }, [props.dataImportSource]);

  const handleMappingConfirm = (mappings: FieldMappingType[]) => {
    try {
      const importData = readCustomCsv(csvData, mappings);
      setShowMapping(false);
      props.setImportData(importData);
      props.setActiveTab("step2");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setParseError(`Failed to import data: ${message}`);
    }
  };

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (file) await processFile(file);
  };

  const importFromDb = async () => {
    setParseError(null);
    props.setImportData(null);
    try {
      const importData: ImportDataInterface = await getB1Data();
      props.setImportData(importData);
    } catch (e) {
      props.setActiveTab("step1");
      const message = e instanceof Error ? e.message : "Unknown error";
      setParseError(`Failed to load B1 data: ${message}`);
    }
  };

  const handleDisplayFileDetails = () => {
    inputRef.current?.files
      && setUploadedFileName(inputRef.current.files[0].name);
    handleUpload();
  };

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleImportSelection = (e: string) => {
    setLoginError(false);
    setShowMapping(false);
    setCsvColumns([]);
    setCsvData([]);
    if (e === DataSourceType.B1_DB && !context?.user) {
      setLoginError(true);
      return;
    }
    props.setDataImportSource(e);
    if (e === DataSourceType.B1_DB) {
      props.setActiveTab("step2");
      importFromDb();
    }
  };

  if (showMapping && csvColumns.length > 0) {
    return (
      <Box>
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: "primary.main", mb: 3 }}>
          Step 1 - Map Fields
        </Typography>
        <FieldMappingUI columns={csvColumns} sampleData={csvData.slice(0, 3)} onConfirm={handleMappingConfirm} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: "primary.main", mb: 3 }}>
        Step 1 - Import Source
      </Typography>
      <Typography variant="body1" paragraph>
        Choose data source for import data
      </Typography>

      {loginError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          You must be logged in to use B1 Database as a source. Please{" "}
          <Link href="/login" sx={{ color: "inherit", fontWeight: "bold", textDecoration: "underline" }}>
            log in
          </Link>{" "}
          first.
        </Alert>
      )}

      {parseError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setParseError(null)}>
          {parseError}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
        <InputLabel id="import-source-select-label">Data Source</InputLabel>
        <Select
          labelId="import-source-select-label"
          value={props.dataImportSource || ""}
          label="Data Source"
          onChange={(e) => handleImportSelection(e.target.value)}
        >
          <MenuItem value={DataSourceType.B1_DB}>B1 Database</MenuItem>
          <MenuItem value={DataSourceType.B1_ZIP}>B1 Import Zip</MenuItem>
          <MenuItem value={DataSourceType.BREEZE_ZIP}>Breeze Import Zip</MenuItem>
          <MenuItem value={DataSourceType.PLANNING_CENTER_ZIP}>Planning Center zip</MenuItem>
          <MenuItem value={DataSourceType.CUSTOM_CSV}>Custom CSV / Excel</MenuItem>
          <MenuItem value={DataSourceType.TITHELY_CSV}>Tithe.ly CSV</MenuItem>
          <MenuItem value={DataSourceType.CCB_CSV}>CCB / Pushpay CSV</MenuItem>
        </Select>
      </FormControl>

      {props.dataImportSource === DataSourceType.CUSTOM_CSV && (
        <Alert severity="info" sx={{ mb: 2, maxWidth: 500 }}>
          Upload any CSV or Excel file containing people data. You'll be able to map your columns to B1 fields in the next step.
        </Alert>
      )}

      {(props.dataImportSource && inputIsFile && props.importData == null && !showMapping) && (
        <Box sx={{ mt: 2 }}>
          <input ref={inputRef} style={{ display: "none" }} type="file" onChange={handleDisplayFileDetails} accept=".zip,.csv,.xlsx,.xls" />
          <Box
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) processFile(file);
            }}
            onClick={handleSelectFile}
            sx={{
              border: "2px dashed",
              borderColor: isDragging ? "primary.main" : "grey.300",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: isDragging ? "primary.50" : "grey.50",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
              maxWidth: 500
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: isDragging ? "primary.main" : "grey.400", mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Drag & drop your {dataSourceDropDown.find(s => s.value === props.dataImportSource)?.label} file here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
          </Box>
          {(props.dataImportSource === DataSourceType.B1_ZIP) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                You can download sample files <Link href="/sampleimport.zip">here</Link>.
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
