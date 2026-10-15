import { useState } from "react";
import { Box, Typography, Button, Card, CardContent, Stack, Stepper, Step, StepButton } from "@mui/material";
import "react-activity/dist/Dots.css";
import "react-activity/dist/Windmill.css";
import { Footer, Header } from "./components";
import { ImportDataInterface } from "./helpers/ImportHelper";
import { TabSource } from "./components/TabSource";
import { TabPreview } from "./components/TabPreview";
import { TabDestination } from "./components/TabDestination";
import { TabRun } from "./components/TabRun";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { undoB1DbImport, UndoEntry } from "./helpers/ExportHelpers/ExportB1DbHelper";

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
  const [exportError, setExportError] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const [status, setStatus] = useState<Record<string, string>>({});
  const [undoLog, setUndoLog] = useState<UndoEntry[]>([]);
  const [batchId, setBatchId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("step1");

  const handleUndo = async (onProgress?: (done: number, total: number) => void) => {
    await undoB1DbImport(undoLog, onProgress);
    setUndoLog([]);
  };

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
    setExportError(null);
    setSourceError(null);
    setStatus({});
    setUndoLog([]);
    setBatchId(undefined);
    setShowFinalCount(false);
    setExportCategories({ ...defaultCategories });
  };

  return (
    <>
      <Header />
      <Box sx={{ minHeight: "calc(100vh - 200px)" }}>
        <Box sx={{ pt: { xs: 2, md: 3, lg: 4 }, pb: 4, px: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
          <Stack id="page-header" component="header" direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 4 }}>
            <Box>
              <Typography id="page-header-title" variant="h1">Import / Export Tool</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Back up your B1 data, move it to another system, or load existing data into B1 for the first time.
              </Typography>
            </Box>
            <Button variant="outlined" href="https://b1.church/" sx={{ flexShrink: 0 }}>Go to B1</Button>
          </Stack>

          <Stepper nonLinear alternativeLabel activeStep={activeIndex} sx={{ mb: 4 }}>
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
                  <TabSource importData={importData} isLoadingSourceData={isLoadingSourceData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} setDataImportSource={setDataImportSource} setImportData={setImportData}
                    parseError={sourceError} setParseError={setSourceError} />
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
                    exportError={exportError}
                    setExportError={setExportError}
                    setStatus={setStatus}
                    showFinalCount={showFinalCount}
                    setShowFinalCount={setShowFinalCount}
                    exportCategories={exportCategories}
                    setExportCategories={setExportCategories}
                    setUndoLog={setUndoLog}
                    setBatchId={setBatchId}
                  />
                )}
                {activeTab === "step4" && (
                  <TabRun dataExportSource={dataExportSource} isExporting={isExporting} exportError={exportError} status={status} undoCount={undoLog.length} onUndo={handleUndo} batchId={batchId} />
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
