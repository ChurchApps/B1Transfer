import React from "react";
import { Box, Typography } from "@mui/material";

export const Footer: React.FC = () => (
  <Box sx={{
    backgroundColor: '#333',
    color: '#eee',
    py: 5,
    textAlign: 'center'
  }}>
    <img src="/images/logo-footer.png?v=1" alt="logo" style={{ maxWidth: 300, marginBottom: 20 }} />
    <Typography variant="body2">
      Phone: 918-994-2638 | support@b1.church
    </Typography>
    <Typography variant="body2">
      2022 © Live Church Solutions. All rights reserved.
    </Typography>
  </Box>
)
