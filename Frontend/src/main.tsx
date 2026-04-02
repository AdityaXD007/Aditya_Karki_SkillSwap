import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "@/App.tsx";
import "./styles/index.css";
import { ThemeProvider } from "@/components/theme-provider";

const GOOGLE_CLIENT_ID = "688883625031-qp0agalccq2j98iih90tlg34dlcpju3e.apps.googleusercontent.com";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <ThemeProvider defaultTheme="light" storageKey="skillswap-theme">
      <App />
    </ThemeProvider>
  </GoogleOAuthProvider>
);
