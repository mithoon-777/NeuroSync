import React from 'react';

function Dashboard({ data, tasks }) {
  const { typingSpeed, errorCount, mouseDistance, fatigueScore } = data;

  // --- MODIFIED: More intelligent suggestion logic ---
  const getSuggestion = () => {
    // Find available tasks first
    const lowFocusTask = tasks.find(t => t.type === 'Low Focus');
    const highFocusTask = tasks.find(t => t.type === 'High Focus');

    // Case 1: Critical Fatigue (> 80)
    if (fatigueScore > 80) {
      let message = "High fatigue detected! It's important to save your work and take a rest now. 😴";
      // Offer a low-focus task as an alternative if one exists
      if (lowFocusTask) {
        message += ` If you must continue, consider a low-focus task like: "${lowFocusTask.text}"`;
      }
      return message;
    }

    // Case 2: High Fatigue (> 60)
    if (fatigueScore > 60) {
      if (lowFocusTask) {
        return `You seem tired. Now might be a good time to work on a low-focus task like: "${lowFocusTask.text}"`;
      }
      return "You seem tired. Consider taking a walk or doing some breathing exercises. 🌿";
    }

    // Case 3: Low Fatigue / Focused (< 30)
    if (fatigueScore < 30) {
       if (highFocusTask) {
         return `You're in the zone! This is a great time to tackle a high-focus task like: "${highFocusTask.text}"`;
       }
       return "You're doing great! Keep it up. 🧠";
    }

    // Default case for moderate fatigue
    return "Keep up the steady work. 👍";
  };

  return (
    <div style={{ background: "#f9f9f9", padding: "1rem", borderRadius: "12px", marginTop: "1rem" }}>
      <h2 style={{ color: fatigueScore >= 80 ? 'red' : 'green' }}>
        Fatigue Score: {fatigueScore} / 100
      </h2>
      <p><strong>Typing Speed:</strong> {typingSpeed} CPM</p>
      <p><strong>Typing Errors (in last 10s):</strong> {errorCount}</p>
      <p><strong>Mouse Distance (in last 10s):</strong> {mouseDistance} px</p>
      <hr />
      <p style={{ fontWeight: 'bold' }}>
        {getSuggestion()}
      </p>
    </div>
  );
}

export default Dashboard;