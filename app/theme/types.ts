import '@react-navigation/native';

declare module '@react-navigation/native' {
  export type ExtendedTheme = {
    dark: boolean;
    colors: {
      primary: string;
      secondary: string;
      background: string;
      surface: string;
      card: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
      success: string;
      inputBackground: string;
    };
    fonts: {
      regular: {
        fontFamily: string;
        fontWeight: string;
      };
      medium: {
        fontFamily: string;
        fontWeight: string;
      };
      light: {
        fontFamily: string;
        fontWeight: string;
      };
      thin: {
        fontFamily: string;
        fontWeight: string;
      };
    };
  };
} 