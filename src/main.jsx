import React, { useEffect, useState, createContext } from 'react';
import * as ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThirdwebProvider } from 'thirdweb/react';
import reportWebVitals from './reportWebVitals';
import './index.css';
import "./global.scss";
import Home from "./pages/staking";
import Swap from './pages/swap';
import Verifying from './pages/verify-nft';

import {AppProvider} from "./context/AppContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <ThirdwebProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/verify-nft" />} />
            <Route path="/staking" element={<Home />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/verify-nft" element={<Verifying />} />
          </Routes>
        </Router>
      </ThirdwebProvider>
    </AppProvider>
  </React.StrictMode>
);

reportWebVitals();
