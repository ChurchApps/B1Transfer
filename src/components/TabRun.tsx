import React, { useMemo } from "react";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, Alert, LinearProgress } from "@mui/material";
import { CheckCircle, RadioButtonUnchecked, Error, Loop, TaskAlt } from "@mui/icons-material";
import { DataSourceType } from "../types";

interface Props {
  dataExportSource: string | null;
  isExporting: boolean;
  status: Record<string, string>;
}

export const TabRun = (props: Props) => {

  const getProgress = (name: string) => {
    const status = props.status[name];

    let icon;
    let color: any = "text.secondary";
    let detail = "";

    if (status === undefined) {
      icon = <RadioButtonUnchecked sx={{ color: "grey.400" }} />;
    } else if (status === "error") {
      icon = <Error sx={{ color: "error.main" }} />;
      color = "error.main";
    } else if (status.includes("running")) {
      icon = <Loop sx={{ color: "primary.main", animation: "spin 1s linear infinite" }} />;
      color = "primary.main";
      const match = status.match(/\((.+)\)/);
      if (match) detail = match[1];
    } else if (status === "complete") {
      icon = <CheckCircle sx={{ color: "success.main" }} />;
      color = "success.main";
    } else {
      icon = <RadioButtonUnchecked sx={{ color: "grey.400" }} />;
    }

    return (
      <ListItem key={name} dense>
        <ListItemIcon sx={{ minWidth: 36 }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={name}
          secondary={detail}
          sx={{
            color,
            "& .MuiTypography-root": { fontWeight: status?.includes("running") ? 600 : 400 },
            "& .MuiListItemText-secondary": { fontSize: "0.75rem", color: "text.secondary" }
          }}
        />
      </ListItem>
    );
  };

  const steps = useMemo(() => {
    let s = [
      "Campuses/Services/Times", "People", "Photos", "Groups", "Group Members", "Donations", "Attendance", "Forms", "Questions", "Answers", "Form Submissions", "Compressing"
    ];
    if (props.dataExportSource === DataSourceType.B1_DB) s = s.filter(step => step !== "Compressing");
    return s;
  }, [props.dataExportSource]);

  const { completedCount, errorCount, isAllDone } = useMemo(() => {
    let completed = 0;
    let errors = 0;
    for (const step of steps) {
      const s = props.status[step];
      if (s === "complete") completed++;
      else if (s === "error") errors++;
    }
    const allDone = steps.every(step => {
      const s = props.status[step];
      return s === "complete" || s === "error";
    });
    return { completedCount: completed, errorCount: errors, isAllDone: allDone };
  }, [props.status, steps]);

  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const getExportSteps = () => {
    if (!props.isExporting) return null;

    const stepsHtml: React.ReactElement[] = [];
    steps.forEach((s) => stepsHtml.push(getProgress(s)));

    return (
      <>
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary" sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              Export Progress
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {isAllDone ? "Export complete" : "Exporting content..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {completedCount}/{steps.length} steps ({progressPercent}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <List dense sx={{ bgcolor: "background.paper" }}>
              {stepsHtml}
            </List>

            {!isAllDone && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Please wait:</strong> This process may take some time. It is important that you do not close your browser until it has finished.
              </Alert>
            )}
          </CardContent>
        </Card>

        {isAllDone && (
          <Card sx={{ mt: 3, border: errorCount > 0 ? "1px solid" : "2px solid", borderColor: errorCount > 0 ? "warning.main" : "success.main" }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <TaskAlt sx={{ fontSize: 56, color: errorCount > 0 ? "warning.main" : "success.main", mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {errorCount > 0 ? "Export Completed with Errors" : "Export Complete!"}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {completedCount} of {steps.length} steps completed successfully
                {errorCount > 0 && `, ${errorCount} failed`}
              </Typography>
              {props.dataExportSource !== DataSourceType.B1_DB && errorCount === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Your file has been downloaded. Check your browser's downloads folder.
                </Typography>
              )}
              {props.dataExportSource === DataSourceType.B1_DB && errorCount === 0 && (
                <Typography variant="body2" color="text.secondary">
                  All data has been successfully imported into your B1 database.
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: "primary.main", mb: 3 }}>
        Step 4 - Export Progress
      </Typography>

      {!props.isExporting && (
        <Alert severity="info">
          Export will begin once you complete the previous steps and click "Confirm" in Step 3.
        </Alert>
      )}

      {props.dataExportSource && props.isExporting && getExportSteps()}
    </Box>
  );
};
