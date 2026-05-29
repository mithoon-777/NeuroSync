// src/components/TaskManager.js

import React from 'react';

function TaskManager({ tasks, newTask, setNewTask, handleAddTask, handleDeleteTask }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>📝 My Tasks</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
        <input
          type="text"
          value={newTask.text}
          onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
          placeholder="Enter a new task..."
          style={{ flexGrow: 1, padding: '8px' }}
        />
        <select
          value={newTask.type}
          onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
          style={{ padding: '8px' }}
        >
          <option value="Low Focus">Low Focus</option>
          <option value="High Focus">High Focus</option>
        </select>
        <button onClick={handleAddTask}>Add Task</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map((task, index) => (
          <li key={index} style={{ background: '#f4f4f4', marginBottom: '5px', padding: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <span style={{ fontWeight: 'bold', color: task.type === 'High Focus' ? '#d9534f' : '#5cb85c' }}>
                [{task.type}]
              </span> {task.text}
            </span>
            <button onClick={() => handleDeleteTask(index)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>
              ✖
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskManager;