import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function FatigueChart({ chartData }) {
  const data = {
    // Create simple labels like "1", "2", "3", ... for the x-axis
    labels: chartData.map((_, index) => index + 1),
    datasets: [
      {
        label: 'Fatigue Score Trend',
        // Use the chartData prop for the y-axis values
        data: chartData,
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // The fatigue score is out of 100
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '📊 Real-Time Fatigue Trend',
      },
    },
  };

  return (
    <div style={{ marginTop: "2rem", background: "#fff", padding: "1rem", borderRadius: "10px" }}>
      <Line options={options} data={data} />
    </div>
  );
}

export default FatigueChart;