import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "material-icons/iconfont/filled.css";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/global.css";
import App from "./App.tsx";
import { ThemeProvider } from "./features/theme/ThemeProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
