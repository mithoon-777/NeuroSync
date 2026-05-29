# NeuroSync – AI-Based Mental Fatigue Detection and Task Optimization System

## Overview

NeuroSync is an AI-powered desktop application designed to monitor user activity patterns and identify potential signs of mental fatigue. The system analyzes keyboard and mouse interactions, work duration, inactivity periods, and productivity indicators to provide real-time fatigue alerts and task management support.

The goal of NeuroSync is to help users maintain productivity, reduce burnout, and improve work efficiency through intelligent behavioral monitoring.

---

## Features

### Real-Time Fatigue Detection

* Continuous monitoring of user activity
* Detection of reduced productivity patterns
* Fatigue scoring mechanism

### Productivity Monitoring

* Work session tracking
* Activity and inactivity analysis
* Overtime monitoring

### Smart Alerts

* Toast notifications for fatigue warnings
* Periodic reminder system
* Configurable monitoring schedules

### Analytics Dashboard

* Productivity visualization
* Fatigue trend analysis
* Historical performance review

### Log Management

* JSON log storage
* CSV export support
* System log viewer

### Desktop Integration

* Electron-based desktop application
* Background monitoring support
* System tray integration

---

## Technology Stack

### Frontend

* React.js
* JavaScript
* CSS

### Desktop Framework

* Electron.js

### Monitoring & Tracking

* Keyboard Activity Tracking
* Mouse Activity Tracking
* Productivity Analysis

### Data Storage

* JSON
* CSV

### Notification System

* React Toastify

---

## System Architecture

User Activity
↓
Keyboard & Mouse Tracking
↓
Fatigue Detection Engine
↓
Productivity Analysis
↓
Alert Generation
↓
Dashboard & Logs

---

## Project Structure

NeuroSync/

├── public/

│ ├── electron.js

│ ├── preload.js

│ └── tray-icon.png

│

├── src/

│ ├── components/

│ │ ├── AnalyticsPage.js

│ │ ├── Dashboard.js

│ │ ├── FatigueChart.js

│ │ ├── LogViewer.js

│ │ ├── SystemLogButton.js

│ │ └── TaskManager.js

│ │

│ ├── App.js

│ ├── App.css

│ ├── index.js

│ └── index.css

│

├── package.json

├── package-lock.json

├── README.md

└── LICENSE

---

## Installation

Clone the repository:

git clone https://github.com/mithoon-777/NeuroSync.git

Navigate to the project:

cd NeuroSync

Install dependencies:

npm install

Run the application:

npm start

---

## Future Enhancements

* Machine Learning based fatigue prediction
* Webcam-assisted fatigue detection
* Voice interaction support
* Personalized productivity recommendations
* Cloud synchronization

---

## Author

Mithoon Raj

GitHub:
https://github.com/mithoon-777

LinkedIn:
https://linkedin.com/in/mithoon-raj-s-a4839a2b6

---

## License

This project is licensed under the MIT License.
