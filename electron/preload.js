const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Check if running in Electron
  isElectron: true,
  
  // Check network status from main process
  checkOnline: () => ipcRenderer.invoke('check-online'),
  
  // Platform info
  platform: process.platform,
  
  // App version
  getVersion: () => process.env.npm_package_version || '1.0.0',
});
