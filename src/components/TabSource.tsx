import React, { useRef, useState } from "react"
import { Select, MenuItem, FormControl, InputLabel, Box, Typography, Button, Link, Alert } from "@mui/material";
import { ImportDataInterface } from "../helpers/ImportHelper";
import { DataSourceType } from "../types";
import UserContext from "../UserContext";
import readB1Zip from "../helpers/ImportHelpers/ImportB1ZipHelper"
import getB1Data from "../helpers/ImportHelpers/ImportB1DbHelper"
import readBreezeZip from "../helpers/ImportHelpers/ImportBreezeZipHelper"
import readPlanningCenterZip from "../helpers/ImportHelpers/ImportPlanningCenterZipHelper"

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

  const dataSourceDropDown = [
    { label: "B1 DB", value: DataSourceType.B1_DB },
    { label: "B1 zip", value: DataSourceType.B1_ZIP },
    { label: "Breeze zip", value: DataSourceType.BREEZE_ZIP },
    { label: "Planning center zip", value: DataSourceType.PLANNING_CENTER_ZIP }
  ];

  const handleUpload = async () => {
    props.setActiveTab("step2")
    props.setImportData(null)
    let importData: ImportDataInterface;
    switch (props.dataImportSource) {
      case DataSourceType.B1_ZIP: {
        importData = await readB1Zip(inputRef.current?.files[0])
        break;
      }
      case DataSourceType.BREEZE_ZIP: {
        importData = await readBreezeZip(inputRef.current?.files[0])
        break;
      }
      case DataSourceType.PLANNING_CENTER_ZIP: {
        importData = await readPlanningCenterZip(inputRef.current?.files[0])
        break;
      }
      default: {
        break;
      }
    }
    props.setImportData(importData);
  }

  const importFromDb = async () => {
    props.setImportData(null)
    let importData: ImportDataInterface;
    importData = await getB1Data();
    props.setImportData(importData);
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
    if (e === DataSourceType.B1_DB && !context?.user) {
      setLoginError(true);
      return;
    }
    props.setDataImportSource(e)
    if (e === DataSourceType.B1_DB) {
      props.setActiveTab("step2")
      importFromDb();
    }
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
        Step 1 - Import Source
      </Typography>
      <Typography variant="body1" paragraph>
        Choose data source for import data
      </Typography>

      {loginError && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          You must be logged in to use B1 Database as a source. Please{' '}
          <Link href="/login" sx={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>
            log in
          </Link>{' '}
          first.
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 3, maxWidth: 300 }}>
        <InputLabel id="import-source-select-label">Data Source</InputLabel>
        <Select
          labelId="import-source-select-label"
          value={props.dataImportSource || ''}
          label="Data Source"
          onChange={(e) => handleImportSelection(e.target.value)}
        >
          <MenuItem value={DataSourceType.B1_DB}>B1 Database</MenuItem>
          <MenuItem value={DataSourceType.B1_ZIP}>B1 Import Zip</MenuItem>
          <MenuItem value={DataSourceType.BREEZE_ZIP}>Breeze Import Zip</MenuItem>
          <MenuItem value={DataSourceType.PLANNING_CENTER_ZIP}>Planning Center zip</MenuItem>
        </Select>
      </FormControl>

      {(props.dataImportSource && inputIsFile && props.importData == null) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please select your {dataSourceDropDown.find(s => s.value === props.dataImportSource)?.label} file
          </Typography>
          <input ref={inputRef} style={{ display: 'none' }} type="file" onChange={handleDisplayFileDetails} />
          <Button onClick={handleSelectFile} variant="outlined" color="primary" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600, px: 4 }}>
            Upload
          </Button>
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
}
