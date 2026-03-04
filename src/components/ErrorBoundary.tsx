import React from "react";
import { Box, Typography, Button, Alert } from "@mui/material";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: "center", maxWidth: 600, mx: "auto", mt: 8 }}>
          <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Something went wrong</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </Typography>
          </Alert>
          <Button variant="contained" onClick={this.handleReset} sx={{ textTransform: "none", borderRadius: 2 }}>
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
