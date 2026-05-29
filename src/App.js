import React, { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Dashboard from './components/Dashboard';
import FatigueChart from './components/FatigueChart';
import TaskManager from './components/TaskManager';
import AnalyticsPage from './components/AnalyticsPage';

function App() {
  const [fatigueData, setFatigueData] = useState({ typingSpeed: 0, errorCount: 0, mouseDistance: 0, fatigueScore: 0 });
  const [chartData, setChartData] = useState([]);
  const [trackingStarted, setTrackingStarted] = useState(false);
  const [sessionLogs, setSessionLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('tasks')) || []);
  const [newTask, setNewTask] = useState({ text: '', type: 'Low Focus' });
  const [startTime, setStartTime] = useState(() => JSON.parse(localStorage.getItem('startTime')) || { hour: '09', minute: '00', period: 'AM' });
  const [endTime, setEndTime] = useState(() => JSON.parse(localStorage.getItem('endTime')) || { hour: '05', minute: '00', period: 'PM' });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleUpdate = (data) => {
      setFatigueData(data);
      setChartData(prevChartData => {
        const newHistory = [...prevChartData, data.fatigueScore];
        if (newHistory.length > 20) {
          return newHistory.slice(newHistory.length - 20);
        }
        return newHistory;
      });
      const entry = {
        timestamp: new Date().toLocaleString(),
        fatigue: data.fatigueScore,
        message: `Score: ${data.fatigueScore}, Speed: ${data.typingSpeed} CPM, Errors: ${data.errorCount}`
      };
      setSessionLogs(prevLogs => [...prevLogs, entry]);
    };
    const handleResume = () => setFatigueData(prevData => ({ ...prevData, fatigueScore: 0 }));
    const cleanupUpdateListener = window.electron?.ipcRenderer?.on('update-data', handleUpdate);
    const cleanupResumeListener = window.electron?.ipcRenderer?.on('activity-resumed', handleResume);
    return () => {
      if (cleanupUpdateListener) cleanupUpdateListener();
      if (cleanupResumeListener) cleanupResumeListener();
    };
  }, []);

  const handleAddTask = () => {
    if (newTask.text.trim() === '') {
      toast.error("Task text cannot be empty.");
      return;
    }
    setTasks([...tasks, newTask]);
    setNewTask({ text: '', type: 'Low Focus' });
  };
  const handleDeleteTask = (indexToDelete) => {
    setTasks(tasks.filter((_, index) => index !== indexToDelete));
  };
  const startFatigueTracking = () => {
    if (!startTime.hour || !startTime.minute || !endTime.hour || !endTime.minute) {
      toast.error("⛔ Please fill in all time fields.");
      return;
    }
    localStorage.setItem('startTime', JSON.stringify(startTime));
    localStorage.setItem('endTime', JSON.stringify(endTime));
    setTrackingStarted(true);
    setIsPaused(false);
    toast.success("✅ Tracking started!");
    window.electron?.ipcRenderer?.send('set-time-range', { startTime, endTime });
  };
  const handleStop = () => {
    setTrackingStarted(false);
    setIsPaused(false);
    toast.info('⏹️ Tracking stopped.');
    window.electron?.ipcRenderer?.send('stop-tracking');
  };
  const handleReset = () => {
    handleStop();
    setStartTime({ hour: '09', minute: '00', period: 'AM' });
    setEndTime({ hour: '05', minute: '00', period: 'PM' });
    setFatigueData({ typingSpeed: 0, errorCount: 0, mouseDistance: 0, fatigueScore: 0 });
    setChartData([]);
    setSessionLogs([]);
    localStorage.removeItem('startTime');
    localStorage.removeItem('endTime');
    toast.info('Timer has been reset.');
  };
  const togglePause = () => {
    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    if (newPausedState) {
      window.electron?.ipcRenderer?.send('pause-tracking');
      toast.warn("⏸️ Tracking paused.");
    } else {
      window.electron?.ipcRenderer?.send('resume-tracking');
      toast.success("▶️ Tracking resumed.");
    }
  };
  const saveLogsToCSVAndJSON = (logsArray) => {
    if (!logsArray.length) {
      toast.warn("⚠️ No session logs available to export.");
      return;
    }
    try {
      let csvContent = "Timestamp,FatigueLevel,Message\n";
      logsArray.forEach(row => { csvContent += `"${row.timestamp}","${row.fatigue}","${row.message}"\n`; });
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const csvLink = document.createElement('a');
      csvLink.href = URL.createObjectURL(csvBlob);
      csvLink.download = 'session_logs.csv';
      csvLink.click();
      const jsonString = JSON.stringify(logsArray, null, 2);
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      const jsonLink = document.createElement('a');
      jsonLink.href = URL.createObjectURL(jsonLink);
      jsonLink.download = 'session_logs.json';
      jsonLink.click();
      toast.success('📁 Session logs exported successfully!');
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("❌ Export failed. See console for details.");
    }
  };

  return (
    <div className="App">
      <h1>🧠 NeuroSync - Mental Fatigue Monitor</h1>
      <nav style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button onClick={() => setCurrentPage('dashboard')} disabled={currentPage === 'dashboard'}>Dashboard & Tasks</button>
        <button onClick={() => setCurrentPage('analytics')} disabled={currentPage === 'analytics'}>Analytics</button>
      </nav>

      {currentPage === 'dashboard' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', margin: '1rem 0', flexWrap: 'wrap' }}>
            <span>Start Time:</span>
            <input type="number" value={startTime.hour} onChange={(e) => setStartTime({...startTime, hour: e.target.value})} min="1" max="12" placeholder="HH" style={{width: '60px', textAlign: 'center'}} disabled={trackingStarted} />
            <span>:</span>
            <input type="number" value={startTime.minute} onChange={(e) => setStartTime({...startTime, minute: e.target.value})} min="0" max="59" placeholder="MM" style={{width: '60px', textAlign: 'center'}} disabled={trackingStarted} />
            <select value={startTime.period} onChange={(e) => setStartTime({...startTime, period: e.target.value})} disabled={trackingStarted} style={{padding: '3px', height: '31px'}}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
            
            <span style={{marginLeft: '20px'}}>End Time:</span>
            <input type="number" value={endTime.hour} onChange={(e) => setEndTime({...endTime, hour: e.target.value})} min="1" max="12" placeholder="HH" style={{width: '60px', textAlign: 'center'}} disabled={trackingStarted} />
            <span>:</span>
            <input type="number" value={endTime.minute} onChange={(e) => setEndTime({...endTime, minute: e.target.value})} min="0" max="59" placeholder="MM" style={{width: '60px', textAlign: 'center'}} disabled={trackingStarted} />
            <select value={endTime.period} onChange={(e) => setEndTime({...endTime, period: e.target.value})} disabled={trackingStarted} style={{padding: '3px', height: '31px'}}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            {!trackingStarted ? (
              <button onClick={startFatigueTracking}>Start Tracking</button>
            ) : (
              <>
                <button onClick={togglePause} style={{ backgroundColor: isPaused ? '#4caf50' : '#ff9800', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', marginRight: '10px' }}>
                  {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
                <button onClick={handleStop} style={{ backgroundColor: '#f44336', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '5px', marginRight: '10px' }}>
                  ⏹️ Stop
                </button>
              </>
            )}
            <button onClick={handleReset} style={{ border: 'none', padding: '6px 10px', borderRadius: '5px' }}>
              Reset All
            </button>
          </div>
          <Dashboard data={fatigueData} tasks={tasks} />
          <FatigueChart chartData={chartData} />
          <TaskManager tasks={tasks} newTask={newTask} setNewTask={setNewTask} handleAddTask={handleAddTask} handleDeleteTask={handleDeleteTask} />
        </>
      )}

      {currentPage === 'analytics' && <AnalyticsPage />}

      <div style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem' }}>
        <button onClick={() => saveLogsToCSVAndJSON(sessionLogs)}>📤 Export Session Logs</button>
        <button onClick={async () => {
          const logText = await window.electron?.ipcRenderer?.invoke('get-logs');
          if (logText) {
            toast.info("📄 Logs loaded in console");
            console.log("📄 System Logs:\n", logText);
          } else {
            toast.warn("⚠️ No system logs found.");
          }
        }}>🧾 View System Logs</button>
        <button onClick={() => window.electron?.ipcRenderer?.invoke('open-logs-folder')}>📁 Open Logs Folder</button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;