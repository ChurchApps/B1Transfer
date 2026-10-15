import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { ControlPanel } from "./ControlPanel";
import { UserProvider } from "./UserContext";
import { CookiesProvider } from "react-cookie";

// Soft Blue light tokens, copied from B1Admin src/helpers/Themes.ts (b1Tokens.soft.light) so the two apps match.
const t = {
  canvas: "#F3F7FC",
  surface: "#FFFFFF",
  header: "#102E59",
  headerHover: "#204575",
  primary: "#1765C1",
  primaryHover: "#12539F",
  primaryPressed: "#104786",
  selected: "#DCEBFC",
  onSelected: "#114F9A",
  hover: "#EDF4FD",
  text: "#172B45",
  muted: "#576B82",
  border: "#DCE5EF",
  controlBorder: "#788CA3",
  focus: "#155EEF",
  success: "#236A43",
  successBg: "#E8F4EC",
  warning: "#805000",
  warningBg: "#FFF3D6",
  danger: "#AC2834",
  dangerBg: "#FDEDEF",
  neutral: "#465A71",
  neutralBg: "#EDF1F6",
  disabledBg: "#E7ECF2",
  disabledText: "#66788D",
  link: "#0E6FAE",
  accent: "#D9A441",
  onAccent: "#3E2C08"
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: t.primary, dark: t.primaryHover, light: "#4A8BD6", contrastText: "#FFFFFF" },
    secondary: { main: t.accent, contrastText: t.onAccent },
    success: { main: t.success },
    warning: { main: t.warning },
    error: { main: t.danger },
    info: { main: t.link },
    text: { primary: t.text, secondary: t.muted, disabled: t.disabledText },
    background: { default: t.canvas, paper: t.surface },
    divider: t.border,
    action: { hover: t.hover, selected: t.selected, disabled: t.disabledText, disabledBackground: t.disabledBg }
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
    h1: { fontSize: "1.875rem", lineHeight: "36px", fontWeight: 650, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.375rem", lineHeight: "29px", fontWeight: 650 },
    h3: { fontSize: "1.125rem", lineHeight: "25px", fontWeight: 600 },
    h4: { fontSize: "1.375rem", lineHeight: "29px", fontWeight: 650 },
    h5: { fontSize: "1.125rem", lineHeight: "25px", fontWeight: 600 },
    h6: { fontSize: "1.125rem", lineHeight: "25px", fontWeight: 600 },
    subtitle1: { fontSize: "1rem", lineHeight: "24px", fontWeight: 600 },
    subtitle2: { fontSize: "0.875rem", lineHeight: "21px", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: "24px" },
    body2: { fontSize: "0.875rem", lineHeight: "21px" },
    caption: { fontSize: "0.75rem", lineHeight: "18px" },
    overline: { fontSize: "0.75rem", lineHeight: "18px", fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase" },
    button: { fontSize: "0.875rem", fontWeight: 600, textTransform: "none" }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // legacy apphelper/all.css variables, re-pointed so SiteHeader picks up the Soft Blue navy
        ":root:root": { "--c1": t.primary, "--c1d2": t.headerHover, "--c1d5": t.header, "--link": t.link, "--focus": t.focus, "--bg-main": t.canvas, "--text-main": t.text, "--text-muted": t.muted, "--border-main": t.border, "--border-light": t.border },
        body: { backgroundColor: t.canvas, color: t.text },
        ":root :is(a, button, [tabindex]):focus-visible": { outline: `3px solid ${t.focus}`, outlineOffset: 3 },
        "#site-header :focus-visible": { outlineColor: "#FFFFFF !important" },
        "#site-toolbar": { minHeight: "64px" },
        "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, minHeight: 44, padding: "9px 16px", transition: "background-color 140ms, border-color 140ms" },
        sizeSmall: { minHeight: 32, padding: "4px 10px" },
        sizeLarge: { minHeight: 48, padding: "11px 20px", fontSize: "1rem" },
        contained: { "&.Mui-disabled": { backgroundColor: t.disabledBg, color: t.disabledText } },
        containedPrimary: { "&:active": { backgroundColor: t.primaryPressed } },
        outlined: { backgroundColor: t.surface, "&.Mui-disabled": { borderColor: t.disabledBg } },
        outlinedPrimary: { color: t.text, borderColor: t.controlBorder, "&:hover": { backgroundColor: t.hover, borderColor: t.controlBorder } },
        text: { "&:hover": { backgroundColor: t.hover } }
      }
    },
    MuiIconButton: { styleOverrides: { root: { "&:hover": { backgroundColor: t.hover } } } },
    MuiTextField: { defaultProps: { margin: "normal" } },
    MuiInputLabel: { styleOverrides: { root: { color: t.muted, fontWeight: 500 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: t.surface,
          borderRadius: 6,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: t.controlBorder },
          "&:hover:not(.Mui-disabled):not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline": { borderColor: t.text },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: t.focus, borderWidth: 2 },
          "&.Mui-disabled": { backgroundColor: t.disabledBg }
        }
      }
    },
    MuiFormHelperText: { styleOverrides: { root: { fontSize: "0.875rem", lineHeight: "21px", marginLeft: 0, marginRight: 0 } } },
    MuiLink: { defaultProps: { underline: "hover" }, styleOverrides: { root: { textUnderlineOffset: 3, color: t.link } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 10, border: `1px solid ${t.border}`, boxShadow: "none", backgroundImage: "none" } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" }, elevation1: { border: `1px solid ${t.border}`, "&.MuiPaper-rounded": { borderRadius: 10 } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 10 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: "1.375rem", lineHeight: "29px", fontWeight: 650 } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        sizeSmall: { fontSize: "0.75rem", height: 24 },
        filled: { "&.MuiChip-colorDefault": { backgroundColor: t.neutralBg, color: t.neutral } },
        outlined: { "&.MuiChip-colorDefault": { borderColor: t.controlBorder, color: t.text } }
      }
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: { backgroundColor: t.successBg, color: t.success },
        standardWarning: { backgroundColor: t.warningBg, color: t.warning },
        standardError: { backgroundColor: t.dangerBg, color: t.danger },
        standardInfo: { backgroundColor: t.selected, color: t.onSelected }
      }
    },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: "3px 3px 0 0" } } },
    MuiTab: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem", minHeight: 44 } } },
    MuiTableContainer: { styleOverrides: { root: { border: `1px solid ${t.border}`, borderRadius: 10 } } },
    MuiTableRow: { styleOverrides: { root: { transition: "background-color 140ms", "tbody &:hover": { backgroundColor: t.hover }, "&:last-child > td": { borderBottom: 0 } } } },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: "12px 16px", borderBottom: `1px solid ${t.border}` },
        head: { fontSize: "0.75rem", lineHeight: "18px", fontWeight: 600, color: t.muted, backgroundColor: "transparent" },
        body: { fontSize: "0.875rem", lineHeight: "21px", fontVariantNumeric: "tabular-nums" },
        sizeSmall: { padding: "8px 12px" }
      }
    }
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

