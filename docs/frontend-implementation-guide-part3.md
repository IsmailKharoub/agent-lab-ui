# Frontend Implementation Guide for Agent Details Page - Part 3

## Browser Session Timeline View

Add a new tab/component to visualize the agent's browsing session chronologically. This view will organize logs by URL to show the agent's journey:

```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';

const BrowserSessionTimeline = ({ agentId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!agentId) return;
    
    // Fetch all logs for this agent (with a larger limit since we need comprehensive data)
    setLoading(true);
    fetch(`/api/v1/agents/${agentId}/logs?limit=1000`, {
      headers: { 'X-API-Key': 'development-key' }
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    })
    .then(data => {
      if (data.status === 'success') {
        setLogs(data.data.items);
      } else {
        throw new Error(data.message || 'Failed to fetch logs');
      }
    })
    .catch(err => {
      setError(err.message);
      console.error('Error fetching agent logs:', err);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [agentId]);
  
  // Group logs by URL for timeline visualization
  const timelineEntries = useMemo(() => {
    // Skip processing if no logs
    if (!logs.length) return [];
    
    // Create a map of URLs and their associated logs
    const urlMap = new Map();
    
    // Process logs in chronological order
    logs
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach(log => {
        if (!log.url) return; // Skip logs without URLs
        
        // Create an entry for this URL if it doesn't exist
        if (!urlMap.has(log.url)) {
          urlMap.set(log.url, {
            url: log.url,
            firstVisit: log.timestamp,
            logs: [],
            actions: [],
            screenshot: null
          });
        }
        
        const entry = urlMap.get(log.url);
        entry.logs.push(log);
        
        // Extract actions from log details
        if (log.details?.action) {
          entry.actions.push({
            action: log.details.action,
            timestamp: log.timestamp,
            stepNumber: log.stepNumber
          });
        }
        
        // Keep the most recent screenshot for this URL
        if (log.screenshot && (!entry.screenshot || new Date(log.timestamp) > new Date(entry.screenshot.timestamp))) {
          entry.screenshot = {
            data: log.screenshot,
            timestamp: log.timestamp
          };
        }
      });
    
    // Convert to array and sort by timestamp
    return Array.from(urlMap.values())
      .sort((a, b) => new Date(a.firstVisit) - new Date(b.firstVisit));
  }, [logs]);
  
  if (loading) return <div className="loading-spinner">Loading browsing timeline...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (timelineEntries.length === 0) {
    return (
      <div className="empty-state">
        <p>No browsing data available for this agent.</p>
        <p>This might be because the agent hasn't visited any URLs yet, or the URLs weren't properly captured in the logs.</p>
      </div>
    );
  }
  
  return (
    <div className="browser-session-timeline">
      <h3>Browsing Timeline</h3>
      <p className="timeline-description">
        This timeline shows the URLs visited by the agent during its execution, along with actions performed on each page.
      </p>
      
      <div className="timeline">
        {timelineEntries.map((entry, index) => (
          <div key={index} className="timeline-entry">
            <div className="timeline-connector">
              <div className="timeline-dot"></div>
              {index < timelineEntries.length - 1 && <div className="timeline-line"></div>}
            </div>
            
            <div className="timeline-content">
              <div className="timeline-header">
                <div className="timeline-time">
                  {format(new Date(entry.firstVisit), 'h:mm:ss a')}
                </div>
                <h4 className="timeline-url">
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">
                    {entry.url}
                  </a>
                </h4>
              </div>
              
              {entry.screenshot && (
                <div className="timeline-screenshot">
                  <img 
                    src={entry.screenshot.data.startsWith('data:') 
                      ? entry.screenshot.data 
                      : `/uploads/artifacts/${agentId}/${entry.screenshot.data}`} 
                    alt={`Screenshot of ${entry.url}`}
                    loading="lazy"
                  />
                </div>
              )}
              
              {entry.actions.length > 0 && (
                <div className="timeline-actions">
                  <h5>Actions on this page:</h5>
                  <ul>
                    {entry.actions.map((action, i) => (
                      <li key={i} className="timeline-action">
                        <span className="action-step">Step {action.stepNumber}</span>
                        <span className="action-text">{action.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowserSessionTimeline;
```

## CSS Styles for Browser Session Timeline

Add these styles to your CSS file:

```css
.browser-session-timeline {
  margin-top: 2rem;
}

.timeline-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline-entry {
  display: flex;
  margin-bottom: 2.5rem;
  position: relative;
}

.timeline-connector {
  position: absolute;
  left: -2rem;
  top: 0;
  bottom: 0;
  width: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary);
  z-index: 2;
}

.timeline-line {
  width: 2px;
  flex-grow: 1;
  background-color: var(--border-color);
  margin-top: 4px;
}

.timeline-content {
  flex: 1;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.timeline-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.timeline-time {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.timeline-url {
  margin: 0;
  font-size: 1.1rem;
  word-break: break-all;
}

.timeline-url a {
  color: var(--link-color);
  text-decoration: none;
}

.timeline-url a:hover {
  text-decoration: underline;
}

.timeline-screenshot {
  margin: 1rem 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.timeline-screenshot img {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: contain;
}

.timeline-actions {
  margin-top: 1rem;
}

.timeline-actions h5 {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}

.timeline-actions ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.timeline-action {
  display: flex;
  align-items: flex-start;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color-light);
}

.timeline-action:last-child {
  border-bottom: none;
}

.action-step {
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.75rem;
  white-space: nowrap;
}

.action-text {
  flex: 1;
  line-height: 1.4;
}
</rewritten_file> 