const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // License management
  validateLicense: (licenseKey) => ipcRenderer.invoke('validate-license', licenseKey),
  getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
  
  // Database operations
  dbQuery: (query, params) => ipcRenderer.invoke('db-query', query, params),
  dbRun: (query, params) => ipcRenderer.invoke('db-run', query, params),
  
  // File dialogs
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // Event listeners
  onShowLicensePrompt: (callback) => ipcRenderer.on('show-license-prompt', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
