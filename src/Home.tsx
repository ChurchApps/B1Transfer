import { useState } from "react";
import { Tabs, Tab, Box, Typography, Button, Card, CardContent } from "@mui/material";
import { ImportExport as ImportExportIcon } from "@mui/icons-material";
import "react-activity/dist/Dots.css"
import "react-activity/dist/Windmill.css"
import { Footer, Header } from "./components"
import { PageHeader } from "./components/ui";
import { ImportDataInterface } from "./helpers/ImportHelper";
import { TabSource } from "./components/TabSource";
import { TabPreview } from "./components/TabPreview";
import { TabDestination } from "./components/TabDestination";
import { TabRun } from "./components/TabRun";

export const Home = () => {
  const [dataImportSource, setDataImportSource] = useState<string | null>(null);
  const [dataExportSource, setDataExportSource] = useState<string | null>(null);

  const [importData, setImportData] = useState<ImportDataInterface | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [status, setStatus] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>("step1");

  const [showFinalCount, setShowFinalCount] = useState<boolean>(false);

  const isLoadingSourceData = dataImportSource && !importData;

  const handleStartOver = () => {
    setActiveTab("step1")
    setImportData(null)
    setDataImportSource(null)
    setDataExportSource(null)
    setIsExporting(false)
    setStatus({})
    setShowFinalCount(false);
  };


  return (
    <>
      <Header />
      <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Page Header */}
        <PageHeader
          icon={<ImportExportIcon />}
          title="Import/Export Tool"
          subtitle="Backup, transfer, and import your B1 data"
        >
          <Button
            variant="outlined"
            size="small"
            href="https://b1.church/"
            sx={{
              color: '#FFF',
              borderColor: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#FFF',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Go to B1
          </Button>
        </PageHeader>

        <Box sx={{ py: 4, px: 3 }}>
          {/* Instructions Section */}
          <Card sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            mb: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="body1" paragraph sx={{ color: 'text.primary', mb: 2 }}>
                Welcome to the import/export tool for B1. You can use this file to backup your B1 data or transfer your data out of B1 to be used in another system. If you're just getting started you can also use this tool to import existing data into B1.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                We support three different data formats: the B1 export file format, along with Breeze and Planning Center file formats. You can use this tool to convert between any of these three in addition to reading/writing to your hosted B1 database.
              </Typography>
            </CardContent>
          </Card>

          {/* Wizard Tabs */}
          <Card sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200',
            overflow: 'hidden'
          }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              sx={{
                backgroundColor: 'grey.50',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                },
                '& .Mui-selected': {
                  color: 'var(--c1)',
                  fontWeight: 600
                }
              }}
            >
              <Tab label="Step 1 - Source" value="step1" disabled={activeTab !== "step1"} />
              <Tab label="Step 2 - Preview" value="step2" disabled={activeTab !== "step2"} />
              <Tab label="Step 3 - Destination" value="step3" disabled={activeTab !== "step3"} />
              <Tab label="Step 4 - Run" value="step4" disabled={activeTab !== "step4"} />
            </Tabs>

            <Box sx={{
              p: 4,
              bgcolor: 'background.paper',
              minHeight: 400
            }}>
              {activeTab === "step1" && (
                <TabSource importData={importData} isLoadingSourceData={isLoadingSourceData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} setDataImportSource={setDataImportSource} setImportData={setImportData} />
              )}
              {activeTab === "step2" && (
                <TabPreview importData={importData} isLoadingSourceData={isLoadingSourceData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} />
              )}
              {activeTab === "step3" && (
                <TabDestination importData={importData} setActiveTab={setActiveTab} dataImportSource={dataImportSource} dataExportSource={dataExportSource} setDataExportSource={setDataExportSource} setIsExporting={setIsExporting} setStatus={setStatus} showFinalCount={showFinalCount} setShowFinalCount={setShowFinalCount} />
              )}
              {activeTab === "step4" && (
                <TabRun dataExportSource={dataExportSource} isExporting={isExporting} status={status} />
              )}
            </Box>
          </Card>

          {/* Action Buttons */}
          {importData && (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={handleStartOver}
                variant="outlined"
                color="error"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                Start Over
              </Button>
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  )
}
