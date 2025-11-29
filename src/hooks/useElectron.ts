import { useState, useEffect } from 'react';

interface ElectronAPI {
  isElectron: boolean;
  checkOnline: () => Promise<boolean>;
  platform: string;
  getVersion: () => string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string>('web');

  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      setIsElectron(true);
      setPlatform(window.electronAPI.platform);
    }
  }, []);

  const checkOnline = async (): Promise<boolean> => {
    if (window.electronAPI?.checkOnline) {
      return await window.electronAPI.checkOnline();
    }
    return navigator.onLine;
  };

  const getVersion = (): string => {
    if (window.electronAPI?.getVersion) {
      return window.electronAPI.getVersion();
    }
    return '1.0.0';
  };

  return {
    isElectron,
    platform,
    checkOnline,
    getVersion,
  };
};
