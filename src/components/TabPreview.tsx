import { Box, Typography, Button } from "@mui/material";
import { ImportDataInterface } from "../helpers/ImportHelper";
import { ImportPreview } from "../components";
import { Loading } from "./ui";
import { DataSourceType } from "../types";

interface Props {
  dataImportSource?: string;
  importData: ImportDataInterface;
  isLoadingSourceData: boolean;
  setActiveTab: (tabName: string) => void
}

export const TabPreview = (props: Props) => {
  const getPreview = () => {
    if (props.importData) return <ImportPreview triggerRender={1} importData={props.importData} />;
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: "primary.main", mb: 0.5 }}>
        Preview Your Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review what was found before choosing a destination.
      </Typography>

      {props.isLoadingSourceData && props.dataImportSource === DataSourceType.B1_DB && (
        <Loading message="Loading data from B1 database..." />
      )}

      {props.importData && (
        <Box
          sx={{
            maxHeight: "60vh",
            overflowY: "auto",
            mb: 3,
            border: 1,
            borderColor: "divider",
            borderRadius: 1
          }}
        >
          {getPreview()}
        </Box>
      )}

      {props.importData && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={() => props.setActiveTab("step3")}
            variant="contained"
            color="primary"
            size="large"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
              px: 4
            }}
          >
            Continue to Destination
          </Button>
        </Box>
      )}
    </Box>
  );
};
