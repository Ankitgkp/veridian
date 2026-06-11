import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
