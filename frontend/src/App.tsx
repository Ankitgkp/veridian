import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Auth from "./pages/Auth";
import HomePage from "./pages/Home";
import ConversationPage from "./pages/Conversation";
import Sidebar from "./components/Sidebar";

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <main className="relative flex flex-col flex-1 overflow-hidden">
        {isLandingPage && (
          <div className="absolute top-5 right-5 z-50 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <a
              href="https://1forge.in"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center p-[1px] rounded-lg bg-border overflow-hidden cursor-pointer group"
            >
              <span
                className="absolute w-[150px] h-[150px] top-1/2 left-1/2 animate-border-beam pointer-events-none"
                style={{
                  background: "conic-gradient(from 0deg, transparent 75%, rgba(255,255,255,0.75) 95%, transparent 100%)",
                }}
              />
              {/* Inner text content */}
              <span className="relative px-3 py-1.5 rounded-[7px] bg-card text-[12px] text-foreground/80 hover:text-foreground group-hover:bg-[#252727] font-medium transition-colors duration-200 flex items-center justify-center w-full h-full animate-button-color">
                Website Builder
              </span>
            </a>
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/conversation/:conversationId"
            element={<ConversationPage />}
          />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

