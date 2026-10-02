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

import { Architecture } from './pages/Architecture';
import { DemoStory } from './pages/DemoStory';
import { GapsCompliance } from './pages/GapsCompliance';

const AppLayout: React.FC = () => {
  const { apiMode } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-[#F1F5F9] font-sans antialiased">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Rail */}
        <Sidebar />

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#090D16]">

          <Routes>
            <Route path="/" element={<MissionControl />} />
            <Route path="/live" element={<LiveCockpit />} />
            <Route path="/kb" element={<KbStudio />} />
            <Route path="/retrieval" element={<RetrievalLab />} />
            <Route path="/agent" element={<VoiceAgent />} />
            <Route path="/voice" element={<VoiceAgent />} />
            <Route path="/voice-agent" element={<VoiceAgent />} />
            <Route path="/voice-studio" element={<VoiceAgent />} />
            <Route path="/markets" element={<MarketPacks />} />
            <Route path="/asr" element={<AsrBench />} />
            <Route path="/calls" element={<CallLibrary />} />
            <Route path="/trace/:traceId" element={<CallBlackBox />} />

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
