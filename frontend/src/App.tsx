import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ReceiptDrawer } from './components/common/ReceiptDrawer';
import { CommandPalette } from './components/common/CommandPalette';

// Pages
import { MissionControl } from './pages/MissionControl';
import { LiveCockpit } from './pages/LiveCockpit';
import { KbStudio } from './pages/KbStudio';
import { RetrievalLab } from './pages/RetrievalLab';
import { VoiceAgent } from './pages/VoiceAgent';
import { MarketPacks } from './pages/MarketPacks';
import { AsrBench } from './pages/AsrBench';
import { CallLibrary } from './pages/CallLibrary';
import { CallBlackBox } from './pages/CallBlackBox';
import { Evaluation } from './pages/Evaluation';
import { Architecture } from './pages/Architecture';
import { DemoStory } from './pages/DemoStory';
import { GapsCompliance } from './pages/GapsCompliance';

const AppLayout: React.FC = () => {
  const { apiMode } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F14] text-[#E6EDF5] font-sans antialiased">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <Sidebar />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#0B0F14]">
          {/* Mock data notice indicator */}
          {apiMode === 'mock' && (
            <div className="bg-[#18212D] border-b border-[#243041] px-4 py-1 text-[11px] font-mono text-[#FFB547] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547] animate-pulse" />
                <span>
                  MOCK DATA ACTIVE · Running self-contained fixtures with real-time streaming simulations. Switch to "LIVE BACKEND" in top bar when FastAPI service is running.
                </span>
              </div>
              <span className="hidden md:inline text-[#57677D]">
                VITE_API_MODE=mock · Zero External API Secrets Required
              </span>
            </div>
          )}

          <Routes>
            <Route path="/" element={<MissionControl />} />
            <Route path="/live" element={<LiveCockpit />} />
            <Route path="/kb" element={<KbStudio />} />
            <Route path="/retrieval" element={<RetrievalLab />} />
            <Route path="/agent" element={<VoiceAgent />} />
            <Route path="/markets" element={<MarketPacks />} />
            <Route path="/asr" element={<AsrBench />} />
            <Route path="/calls" element={<CallLibrary />} />
            <Route path="/trace/:traceId" element={<CallBlackBox />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/demo" element={<DemoStory />} />
            <Route path="/gaps" element={<GapsCompliance />} />
          </Routes>
        </main>
      </div>

      {/* Shared Global Overlays */}
      <ReceiptDrawer />
      <CommandPalette />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
