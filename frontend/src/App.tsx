import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import "./index.css";
import Auth from "./pages/Auth";
import HomePage from "./pages/Home";
import ConversationPage from "./pages/Conversation";
import Sidebar from "./components/Sidebar";

function Layout() {
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar refresh={sidebarRefresh} />
      <main className="flex flex-col flex-1 overflow-hidden">
        <Routes>
          <Route
            path="/"
            element={<HomePage />}
          />
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
