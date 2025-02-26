import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set dark mode class on document
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
