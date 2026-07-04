import React, { useMemo, useState } from "react";
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, Alert, LinearProgress, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { CheckCircle, RadioButtonUnchecked, Error, Loop, TaskAlt, Undo } from "@mui/icons-material";
import { DataSourceType } from "../types";

interface Props {
  dataExportSource: string | null;
  isExporting: boolean;
  status: Record<string, string>;
  undoCount?: number;
  onUndo?: (onProgress?: (done: number, total: number) => void) => Promise<void>;
  batchId?: string;
}

export const TabRun = (props: Props) => {

  const [confirmUndo, setConfirmUndo] = useState(false);
  const [undoState, setUndoState] = useState<"idle" | "running" | "done">("idle");
  const [undoProgress, setUndoProgress] = useState({ done: 0, total: 0 });

  const runUndo = async () => {
    setConfirmUndo(false);
    setUndoState("running");
    await props.onUndo?.((done, total) => setUndoProgress({ done, total }));
    setUndoState("done");
  };

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
    if (props.dataExportSource === DataSourceType.B1_DB) {
      return [
        "Campuses/Services/Times",
        "Households",
        "People",
        "Photos",
        "Groups",
        "Group Service Times",
        "Group Members",
        "Attendance",
        "Funds",
        "Donation Batches",
        "Donations",
        "Forms",
        "Questions",
        "Answers",
        "Form Submissions"
      ];
    }
    return [
      "Campuses/Services/Times",
      "People",
      "Photos",
      "Groups",
      "Group Members",
      "Donations",
      "Attendance",
      "Forms",
      "Questions",
      "Answers",
      "Form Submissions",
      "Compressing"
    ];
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

              {props.dataExportSource === DataSourceType.B1_DB && props.batchId && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This import was saved as a batch and can be undone anytime from B1Admin → Settings → Batches.
                </Typography>
              )}

              {props.dataExportSource === DataSourceType.B1_DB && !!props.undoCount && undoState === "idle" && (
                <Box sx={{ mt: 3 }}>
                  <Button variant="outlined" color="error" startIcon={<Undo />} onClick={() => setConfirmUndo(true)}>
                    Undo Import
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Deletes the {props.undoCount} records this import created.
                  </Typography>
                </Box>
              )}

              {undoState === "running" && (
                <Box sx={{ mt: 3, maxWidth: 360, mx: "auto" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Undoing import... {undoProgress.done}/{undoProgress.total}
                  </Typography>
                  <LinearProgress variant="determinate" value={undoProgress.total ? Math.round((undoProgress.done / undoProgress.total) * 100) : 0} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              )}

              {undoState === "done" && (
                <Alert severity="success" sx={{ mt: 3 }}>Import undone. The records created by this transfer were deleted.</Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Dialog open={confirmUndo} onClose={() => setConfirmUndo(false)}>
          <DialogTitle>Undo this import?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will delete the {props.undoCount} records created by this transfer. This cannot be reversed. Continue?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmUndo(false)}>Cancel</Button>
            <Button onClick={runUndo} color="error" variant="contained">Delete records</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, color: "primary.main", mb: 0.5 }}>
        Transfer in Progress
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track each step as your data is processed.
      </Typography>

      {!props.isExporting && (
        <Alert severity="info">
          The transfer will begin once you choose a destination on the previous step.
        </Alert>
      )}

      {props.dataExportSource && props.isExporting && getExportSteps()}
    </Box>
  );
};
