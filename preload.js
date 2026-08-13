const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopWidget', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (patch) => ipcRenderer.invoke('update-settings', patch),
  setExpanded: (expanded) => ipcRenderer.send('set-expanded', expanded),
  windowAction: (action) => ipcRenderer.send('window-action', action),
  onSettingsChanged: (callback) => {
    const listener = (_event, nextSettings) => callback(nextSettings);
    ipcRenderer.on('settings-changed', listener);
    return () => ipcRenderer.removeListener('settings-changed', listener);
  },
});
