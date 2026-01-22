import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { injectSpeedInsights } from "@vercel/speed-insights";

if (typeof window !== 'undefined') {
  injectSpeedInsights();
}

createRoot(document.getElementById("root")!).render(<App />);
