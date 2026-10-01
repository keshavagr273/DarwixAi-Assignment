import React, { createContext, useContext, useState, useEffect } from 'react';
import type { MarketCode, GroundingReceipt } from '../types';

interface AppContextType {
  market: MarketCode;
  setMarket: (market: MarketCode) => void;
  kbVersion: string;
  setKbVersion: (v: string) => void;
  apiMode: 'mock' | 'live';
  setApiMode: (mode: 'mock' | 'live') => void;
  selectedReceipt: GroundingReceipt | null;
  openReceipt: (receipt: GroundingReceipt) => void;
  closeReceipt: () => void;
  isCmdOpen: boolean;
  setIsCmdOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [market, setMarket] = useState<MarketCode>('in_en');
  const [kbVersion, setKbVersion] = useState<string>('v1.3');
  const [apiMode, setApiMode] = useState<'mock' | 'live'>('mock');
  const [selectedReceipt, setSelectedReceipt] = useState<GroundingReceipt | null>(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openReceipt = (receipt: GroundingReceipt) => {
    setSelectedReceipt(receipt);
  };

  const closeReceipt = () => {
    setSelectedReceipt(null);
  };

  return (
    <AppContext.Provider
      value={{
        market,
        setMarket,
        kbVersion,
        setKbVersion,
        apiMode,
        setApiMode,
        selectedReceipt,
        openReceipt,
        closeReceipt,
        isCmdOpen,
        setIsCmdOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
