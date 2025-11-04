import React from "react"
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, Alert } from "@mui/material";
import { CheckCircle, RadioButtonUnchecked, Error, Loop } from "@mui/icons-material";
import { DataSourceType } from "../types";

interface Props {
  dataExportSource: string | null;
  isExporting: boolean;
  status: any;
}

export const TabRun = (props: Props) => {

  const getProgress = (name: string) => {
    const status = props.status[name];

    let icon;
    let color: any = 'text.secondary';

    if (status === undefined) {
      icon = <RadioButtonUnchecked sx={{ color: 'grey.400' }} />;
    } else if (status === "error") {
      icon = <Error sx={{ color: 'error.main' }} />;
      color = 'error.main';
    } else if (status.includes("running")) {
      icon = <Loop sx={{ color: 'primary.main', animation: 'spin 1s linear infinite' }} />;
      color = 'primary.main';
    } else if (status === "complete") {
      icon = <CheckCircle sx={{ color: 'success.main' }} />;
      color = 'success.main';
    } else {
      icon = <RadioButtonUnchecked sx={{ color: 'grey.400' }} />;
    }

    return (
      <ListItem key={name} dense>
        <ListItemIcon sx={{ minWidth: 36 }}>
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={name}
          sx={{
            color,
            '& .MuiTypography-root': {
              fontWeight: status === 'running' ? 600 : 400
            }
          }}
        />
      </ListItem>
    );
  }

  const getExportSteps = () => {
    if (!props.isExporting) return null;

    let steps = ["Campuses/Services/Times", "People", "Photos", "Groups", "Group Members", "Donations", "Attendance", "Forms", "Questions", "Answers", "Form Submissions", "Compressing"];
    if (props.dataExportSource === DataSourceType.B1_DB) steps = steps.filter(s => s !== "Compressing")
    let stepsHtml: React.ReactElement[] = [];
    steps.forEach((s) => stepsHtml.push(getProgress(s)));

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            Export Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Exporting content:
          </Typography>
          <List dense sx={{ bgcolor: 'background.paper' }}>
            {stepsHtml}
          </List>
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Please wait:</strong> This process may take some time. It is important that you do not close your browser until it has finished.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
        Step 4 - Export Progress
      </Typography>

      {!props.isExporting && (
        <Alert severity="info">
          Export will begin once you complete the previous steps and click "Confirm" in Step 3.
        </Alert>
      )}

      {props.dataExportSource && props.isExporting && getExportSteps()}
    </Box>
  )
}
