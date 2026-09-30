import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";


// Handle dynamic import failures (MIME type / ChunkLoadError)
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
    window.location.reload();
  }
}, true);

createRoot(document.getElementById("root")).render(<App />);
