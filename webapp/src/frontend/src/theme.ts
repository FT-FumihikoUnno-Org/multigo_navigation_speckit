import { createTheme } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Define custom colors
const primaryColor = '#007bff'; // Example primary blue
const secondaryColor = '#6c757d'; // Example secondary gray
const backgroundColor = '#f8f9fa'; // Light gray background
const textColor = '#343a40'; // Dark gray text

const theme = createTheme({
  palette: {
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: secondaryColor,
    },
    background: {
      default: backgroundColor,
    },
    text: {
      primary: textColor,
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif', // Ensure Roboto is the default font
  },
  components: {
    // You can customize component styles here, e.g.:
    // MuiButton: {
    //   styleOverrides: {
    //     root: {
    //       borderRadius: 8, // Example: rounded buttons
    //     },
    //   },
    // },
  },
});

export default theme;
