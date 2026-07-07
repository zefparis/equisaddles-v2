import { createRoot } from "react-dom/client";
import AdminApp from "./admin-app.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<AdminApp />);