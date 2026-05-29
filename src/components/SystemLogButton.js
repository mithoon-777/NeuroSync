import React, { useState } from 'react';

const SystemLogButton = () => {
  const [logs, setLogs] = useState('');

  const handleViewLogs = async () => {
    if (window.electron?.getLogs) {
      const logContent = await window.electron.getLogs();
      setLogs(logContent);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button onClick={handleViewLogs}>📄 View System Logs</button>
      {logs && (
        <pre
          style={{
            marginTop: '1rem',
            background: '#f4f4f4',
            padding: '1rem',
            borderRadius: '6px',
            maxHeight: '300px',
            overflowY: 'auto',
            textAlign: 'left'
          }}
        >
          {logs}
        </pre>
      )}
    </div>
  );
};

export default SystemLogButton;
