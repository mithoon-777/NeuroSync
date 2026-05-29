import React, { useState } from 'react';

function LogViewer() {
  const [logs, setLogs] = useState('');

  const fetchLogs = async () => {
    if (window.electron?.ipcRenderer) {
      const content = await window.electron.ipcRenderer.invoke('get-logs');
      setLogs(content || 'No logs found.');
    }
  };

  const openLogsFolder = () => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('open-logs-folder');
    }
  };

  return (
    <div>
      <button onClick={fetchLogs}>📋 View System Logs</button>
      <button onClick={openLogsFolder}>📁 Open Logs Folder</button>
      {logs && (
        <pre
          style={{
            textAlign: 'left',
            margin: '20px auto',
            padding: '1rem',
            border: '1px solid #ccc',
            width: '80%',
            backgroundColor: '#f4f4f4',
            whiteSpace: 'pre-wrap',
          }}
        >
          {logs}
        </pre>
      )}
    </div>
  );
}

export default LogViewer;
