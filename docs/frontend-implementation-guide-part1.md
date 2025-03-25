# Frontend Implementation Guide for Agent Details Page - Part 1

## Overview of Backend Changes

Our backend has undergone significant enhancements to support a more feature-rich agent experience:

1. **URL Tracking**: Agent logs now include the URL being visited during each step
2. **Screenshot Capture**: Screenshots are now captured and stored for each significant step
3. **Statistics API**: A new `/api/v1/agents/:id/stats` endpoint provides comprehensive metrics
4. **Static Files**: The `/uploads` directory now serves static files, accessible via `/uploads/*` paths

## API Endpoints to Use

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agents/:id` | GET | Get agent details |
| `/api/v1/agents/:id/logs` | GET | Get agent logs (supports pagination) |
| `/api/v1/agents/:id/results` | GET | Get agent execution results |
| `/api/v1/agents/:id/artifacts` | GET | Get agent artifacts (screenshots, etc.) |
| `/api/v1/agents/:id/stats` | GET | Get agent statistics |

## Implementation Part 1: Agent Status Component

Update the agent status panel to include the new statistics data:

```jsx
import React, { useState, useEffect } from 'react';
import { StatusBadge, ProgressBar } from '../components/ui';

const AgentStatusPanel = ({ agent }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!agent?.id) return;
    
    setLoading(true);
    fetch(`/api/v1/agents/${agent.id}/stats`, {
      headers: { 'X-API-Key': 'development-key' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    })
    .then(data => {
      if (data.status === 'success') {
        setStats(data.data.stats);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    })
    .catch(err => {
      setError(err.message);
      console.error('Error fetching agent stats:', err);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [agent?.id]);
  
  if (loading) return <div className="loading-spinner">Loading statistics...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  
  return (
    <div className="agent-status-panel">
      <div className="status-section">
        <h3>Status</h3>
        <div className="status-indicator">
          <StatusBadge status={agent.status} />
          <ProgressBar 
            value={stats?.stepsCompleted || agent.currentStep || 0} 
            max={agent.maxSteps} 
            percentage={Math.min(100, Math.round(((stats?.stepsCompleted || agent.currentStep || 0) / agent.maxSteps) * 100))}
          />
        </div>
      </div>
      
      {stats && (
        <div className="agent-metrics">
          <h3>Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Duration</span>
              <span className="metric-value">{stats.formattedDuration}</span>
            </div>
            
            <div className="metric-card">
              <span className="metric-label">Pages Visited</span>
              <span className="metric-value">{stats.pagesVisited}</span>
            </div>
            
            <div className="metric-card">
              <span className="metric-label">Steps</span>
              <span className="metric-value">{stats.stepsCompleted}/{agent.maxSteps}</span>
            </div>
            
            <div className="metric-card">
              <span className="metric-label">Token Usage</span>
              <span className="metric-value">{stats.tokenUsage.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="agent-actions">
        <h3>Actions</h3>
        <div className="action-buttons">
          {agent.status === 'RUNNING' && (
            <button 
              className="btn btn-danger"
              onClick={() => handleStopAgent(agent.id)}
            >
              Stop Agent
            </button>
          )}
          
          {agent.status === 'COMPLETED' || agent.status === 'FAILED' || agent.status === 'STOPPED' ? (
            <button 
              className="btn btn-primary"
              onClick={() => handleRestartAgent(agent.id)}
            >
              Restart Agent
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AgentStatusPanel;
```

## CSS Styles for Agent Status Panel

Add these styles to your CSS file:

```css
.agent-status-panel {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.agent-metrics {
  margin-top: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: var(--card-bg-light);
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.agent-actions {
  margin-top: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}
```

You'll also need to implement the `handleStopAgent` and `handleRestartAgent` functions in your component or pass them as props. 