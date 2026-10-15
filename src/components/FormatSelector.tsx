import React from "react";
import { Box, Card, Stack, Typography } from "@mui/material";
import { Storage, FolderZip, Air, EventNote, GridOn, Paid, Groups } from "@mui/icons-material";
import { DataSourceType } from "../types";

const ICONS: Record<string, React.ReactElement> = {
  [DataSourceType.B1_DB]: <Storage />,
  [DataSourceType.B1_ZIP]: <FolderZip />,
  [DataSourceType.BREEZE_ZIP]: <Air />,
  [DataSourceType.PLANNING_CENTER_ZIP]: <EventNote />,
  [DataSourceType.CUSTOM_CSV]: <GridOn />,
  [DataSourceType.TITHELY_CSV]: <Paid />,
  [DataSourceType.CCB_CSV]: <Groups />
};

export interface FormatOption {
  value: string;
  label: string;
  description: string;
}

interface Props {
  options: FormatOption[];
  value?: string | null;
  onSelect: (value: string) => void;
}

export const FormatSelector: React.FC<Props> = ({ options, value, onSelect }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 3 }}>
    {options.map(opt => {
      const selected = value === opt.value;
      return (
        <Card
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          sx={{
            cursor: "pointer",
            p: 2,
            borderColor: selected ? "primary.main" : "divider",
            bgcolor: selected ? "action.selected" : "background.paper",
            boxShadow: selected ? (theme) => `inset 0 0 0 1px ${theme.palette.primary.main}` : "none",
            transition: "background-color 140ms, border-color 140ms",
            "&:hover": { borderColor: "primary.main", bgcolor: selected ? "action.selected" : "action.hover" }
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ color: selected ? "primary.main" : "text.secondary", display: "flex", mt: "2px" }}>
              {React.cloneElement(ICONS[opt.value], { sx: { fontSize: 28 } } as any)}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2, color: selected ? "primary.dark" : "text.primary" }}>
                {opt.label}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {opt.description}
              </Typography>
            </Box>
          </Stack>
        </Card>
      );
    })}
  </Box>
);
