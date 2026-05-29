const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    invoke: (channel, data) => ipcRenderer.invoke(channel, data),

    // This "on" function is now corrected to properly handle the event data
    on: (channel, func) => {
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    
    // The old removeListener is no longer needed here because the "on" function returns its own cleanup
  }
});