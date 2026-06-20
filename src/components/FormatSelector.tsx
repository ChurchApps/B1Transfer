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
            border: "2px solid",
            borderColor: selected ? "primary.main" : "grey.200",
            bgcolor: selected ? "rgba(21,101,192,0.06)" : "background.paper",
            transition: "all 0.15s ease",
            "&:hover": { borderColor: "primary.main", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box sx={{ color: selected ? "primary.main" : "grey.500", display: "flex", mt: "2px" }}>
              {React.cloneElement(ICONS[opt.value], { sx: { fontSize: 28 } } as any)}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2, color: selected ? "primary.main" : "text.primary" }}>
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
