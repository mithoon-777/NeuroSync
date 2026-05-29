import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
// --- ADDED Chart.js imports for registration ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// --- ADDED registration call for Bar charts ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const parseCustomTimestamp = (timestamp) => {
  if (!timestamp) return null;
  const parts = timestamp.split(' ');
  const dateParts = parts[0].split('/');
  const timeParts = parts[1].split(':');
  const period = parts[2];

  let hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = parseInt(timeParts[2], 10);
  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1;
  const year = parseInt(dateParts[2], 10);

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }
  if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  return new Date(year, month, day, hour, minute, second);
};


function AnalyticsPage() {
  const [hourlyData, setHourlyData] = useState({});
  const [dailyData, setDailyData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessLogs = async () => {
      if (window.electron?.ipcRenderer) {
        const logs = await window.electron.ipcRenderer.invoke('get-all-logs');
        if (!logs || logs.length === 0) {
            setLoading(false);
            return;
        }

        const hourlyScores = Array(24).fill(0).map(() => ({ total: 0, count: 0 }));
        logs.forEach(log => {
          const dateObject = parseCustomTimestamp(log.timestamp);
          if (dateObject && !isNaN(dateObject)) {
            const hour = dateObject.getHours();
            if(hourlyScores[hour]){
                hourlyScores[hour].total += log.fatigueScore;
                hourlyScores[hour].count++;
            }
          }
        });
        const hourlyAverages = hourlyScores.map(h => h.count > 0 ? h.total / h.count : 0);
        setHourlyData({
          labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          datasets: [{ label: 'Average Fatigue Score by Hour', data: hourlyAverages, backgroundColor: 'rgba(54, 162, 235, 0.6)' }]
        });

        const dailyScores = Array(7).fill(0).map(() => ({ total: 0, count: 0 }));
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        logs.forEach(log => {
          const dateObject = parseCustomTimestamp(log.timestamp);
          if (dateObject && !isNaN(dateObject)) {
            const day = dateObject.getDay();
            if(dailyScores[day]){
                dailyScores[day].total += log.fatigueScore;
                dailyScores[day].count++;
            }
          }
        });
        const dailyAverages = dailyScores.map(d => d.count > 0 ? d.total / d.count : 0);
        setDailyData({
          labels: daysOfWeek,
          datasets: [{ label: 'Average Fatigue Score by Day', data: dailyAverages, backgroundColor: 'rgba(255, 99, 132, 0.6)' }]
        });

        setLoading(false);
      }
    };
    fetchAndProcessLogs();
  }, []);

  if (loading) {
    return <h2>Loading Analytics...</h2>;
  }

  if (!dailyData.datasets || !hourlyData.datasets) {
      return <h2>No log data available to create analytics.</h2>
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📊 Long-Term Analytics</h2>
      <div style={{ marginTop: "2rem", background: "#fff", padding: "1rem", borderRadius: "10px" }}>
        <Bar data={dailyData} options={{ responsive: true, plugins: { title: { display: true, text: 'Average Fatigue by Day of the Week' } } }} />
      </div>
      <div style={{ marginTop: "2rem", background: "#fff", padding: "1rem", borderRadius: "10px" }}>
        <Bar data={hourlyData} options={{ responsive: true, plugins: { title: { display: true, text: 'Average Fatigue by Hour of the Day' } } }} />
      </div>
    </div>
  );
}

export default AnalyticsPage;