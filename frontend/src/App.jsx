import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Inbox from './pages/Inbox';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/inbox" element={<Inbox />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
