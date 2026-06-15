import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
    <App />
);

(import.meta.hot.data.root ??= createRoot(elem)).render(app);
