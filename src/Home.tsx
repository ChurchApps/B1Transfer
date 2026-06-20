import { useState } from "react";
import { Box, Typography, Button, Card, CardContent, Stepper, Step, StepButton } from "@mui/material";
import { ImportExport } from "@mui/icons-material";
import { PageHeader } from "@churchapps/apphelper";
import "react-activity/dist/Dots.css";
import "react-activity/dist/Windmill.css";
import { Footer, Header } from "./components";
import { ImportDataInterface } from "./helpers/ImportHelper";
import { TabSource } from "./components/TabSource";
import { TabPreview } from "./components/TabPreview";
import { TabDestination } from "./components/TabDestination";
import { TabRun } from "./components/TabRun";
import { ErrorBoundary } from "./components/ErrorBoundary";

export interface ExportCategoriesInterface {
  people: boolean;
  groups: boolean;
  attendance: boolean;
  donations: boolean;
  forms: boolean;
}

const defaultCategories: ExportCategoriesInterface = { people: true, groups: true, attendance: true, donations: true, forms: true };

const STEPS = [
  { key: "step1", label: "Source" },
  { key: "step2", label: "Preview" },
  { key: "step3", label: "Destination" },
  { key: "step4", label: "Run" }
];

export const Home = () => {
  const [dataImportSource, setDataImportSource] = useState<string | null>(null);
  const [dataExportSource, setDataExportSource] = useState<string | null>(null);

  const [importData, setImportData] = useState<ImportDataInterface | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [status, setStatus] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>("step1");

  const [showFinalCount, setShowFinalCount] = useState<boolean>(false);
  const [exportCategories, setExportCategories] = useState<ExportCategoriesInterface>({ ...defaultCategories });

  const isLoadingSourceData = dataImportSource && !importData;
  const activeIndex = STEPS.findIndex(s => s.key === activeTab);

  const handleStartOver = () => {
    setActiveTab("step1");
    setImportData(null);
    setDataImportSource(null);
    setDataExportSource(null);
    setIsExporting(false);
    setStatus({});
    setShowFinalCount(false);
    setExportCategories({ ...defaultCategories });
  };

  return (
    <>
      <Header />
      <Box sx={{ minHeight: "calc(100vh - 200px)" }}>
        <PageHeader icon={<ImportExport />} title="Import / Export Tool" subtitle="Backup, transfer, and import your B1 data">
          <Button
            variant="outlined"
            size="small"
            href="https://b1.church/"
            sx={{
              color: "#FFF",
              borderColor: "rgba(255,255,255,0.5)",
              "&:hover": { borderColor: "#FFF", backgroundColor: "rgba(255,255,255,0.1)" }
            }}
          >
            Go to B1
          </Button>
        </PageHeader>

        <Box sx={{ py: 4, px: 3, maxWidth: 1100, mx: "auto" }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 1.5 }}>
                Back up your B1 data, move it to another system, or load existing data into B1 for the first time.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports B1, Breeze, and Planning Center files, plus custom CSV/Excel with field mapping. Convert between
                any of these formats or read and write directly to your hosted B1 database.
              </Typography>
            </CardContent>
          </Card>

          <Stepper nonLinear activeStep={activeIndex} sx={{ mb: 4 }}>
            {STEPS.map((s, i) => (
              <Step key={s.key} completed={i < activeIndex}>
                <StepButton color="inherit" disabled={i >= activeIndex || isExporting} onClick={() => setActiveTab(s.key)}>
                  {s.label}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 4 }, minHeight: 360 }}>
              <ErrorBoundary>
                {activeTab === "step1" && (
                  <TabSource importData={importData} isLoadingSourceData={isLoadingSourceData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} setDataImportSource={setDataImportSource} setImportData={setImportData} />
                )}
                {activeTab === "step2" && (
                  <TabPreview importData={importData} isLoadingSourceData={isLoadingSourceData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} />
                )}
                {activeTab === "step3" && (
                  <TabDestination
                    importData={importData}
                    setActiveTab={setActiveTab}
                    dataImportSource={dataImportSource}
                    dataExportSource={dataExportSource}
                    setDataExportSource={setDataExportSource}
                    setIsExporting={setIsExporting}
                    setStatus={setStatus}
                    showFinalCount={showFinalCount}
                    setShowFinalCount={setShowFinalCount}
                    exportCategories={exportCategories}
                    setExportCategories={setExportCategories}
                  />
                )}
                {activeTab === "step4" && (
                  <TabRun dataExportSource={dataExportSource} isExporting={isExporting} status={status} />
                )}
              </ErrorBoundary>
            </CardContent>
          </Card>

          {importData && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Button onClick={handleStartOver} variant="outlined" color="error">
                Start Over
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
};
