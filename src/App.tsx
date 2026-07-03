import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ControlPanel } from "./ControlPanel";
import { UserProvider } from "./UserContext";
import { CookiesProvider } from "react-cookie";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1565C0",
      light: "#568BDA",
      dark: "#0D47A1",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#568BDA",
      light: "#8CABDB",
      dark: "#1358AB",
      contrastText: "#ffffff"
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff"
    },
    text: {
      primary: "#333333",
      secondary: "#666666"
    },
    grey: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#eeeeee",
      300: "#e0e0e0",
      400: "#bdbdbd",
      500: "#9e9e9e",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121"
    }
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h4: {
      fontWeight: 600,
      color: "#333333"
    },
    h5: {
      fontWeight: 600,
      color: "#333333"
    },
    h6: {
      fontWeight: 600,
      color: "#1565C0"
    },
    body1: {
      color: "#333333",
      fontSize: "1rem"
    },
    body2: {
      color: "#666666",
      fontSize: "0.875rem"
    },
    caption: {
      color: "rgba(0,0,0,0.6)",
      fontSize: "0.75rem"
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f5f5f5" },
        "@keyframes spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8
        },
        contained: {
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          "&:hover": { boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }
        },
        outlined: {
          borderWidth: "1px",
          "&:hover": { borderWidth: "1px" }
        }
      }
    },
    MuiTextField: {
      defaultProps: { margin: "normal" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            "& fieldset": { borderColor: "#e0e0e0" },
            "&:hover fieldset": { borderColor: "#bdbdbd" },
            "&.Mui-focused fieldset": { borderColor: "#1565C0" }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          boxShadow: "none",
          transition: "all 0.2s ease-in-out"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          "&.MuiCard-root": { border: "1px solid #e0e0e0" }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          minHeight: 48
        },
        indicator: {
          backgroundColor: "#1565C0",
          height: 3
        }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          color: "#666666",
          fontSize: "0.875rem",
          "&.Mui-selected": {
            color: "#1565C0",
            fontWeight: 600
          },
          "&:hover": {
            color: "#1565C0",
            opacity: 0.8
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: 8
        }
      }
    },
    MuiTableHead: { styleOverrides: { root: { backgroundColor: "#f5f5f5" } } },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#f5f5f5",
          fontWeight: 600,
          color: "#333333",
          borderBottom: "2px solid #e0e0e0",
          fontSize: "0.875rem"
        },
        body: {
          color: "#333333",
          borderBottom: "1px solid #f0f0f0"
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "#f5f5f5" },
          transition: "background-color 0.2s ease"
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        standardInfo: {
          backgroundColor: "#e3f2fd",
          color: "#0d47a1",
          border: "1px solid #90caf9"
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          padding: "16px"
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: "16px 24px 8px",
          fontWeight: 600,
          color: "#333333"
        }
      }
    },
    MuiDialogContent: { styleOverrides: { root: { padding: "8px 24px 16px" } } }
  }
});

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <UserProvider>
      <CookiesProvider>
        <Router>
          <Routes>
            <Route path="/*" element={<ControlPanel />} />
          </Routes>
        </Router>
      </CookiesProvider>
    </UserProvider>
  </ThemeProvider>
);
export default App;

