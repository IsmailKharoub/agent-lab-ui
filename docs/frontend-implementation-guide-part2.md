# Frontend Implementation Guide for Agent Details Page - Part 2

## Agent Logs Component with URL and Screenshot Support

The logs section should be updated to display URLs and screenshots when available. Here's how to implement it:

```jsx
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

const AgentLogsList = ({ agentId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  
  // Function to fetch logs with pagination
  const fetchLogs = async (pageNum = 0) => {
    if (pageNum === 0) setLoading(true);
    
    try {
      const response = await fetch(
        `/api/v1/agents/${agentId}/logs?limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`,
        { headers: { 'X-API-Key': 'development-key' } }
      );
      
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Failed to fetch logs');
      
      // For page 0, replace logs, otherwise append
      const newLogs = pageNum === 0 ? data.data.items : [...logs, ...data.data.items];
      setLogs(newLogs);
      
      // Check if we have more logs to load
      setHasMore(newLogs.length < data.data.total);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching agent logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load of logs
  useEffect(() => {
    if (agentId) {
      setPage(0);
      fetchLogs(0);
    }
  }, [agentId]);
  
  // Load more logs when requested
  const loadMoreLogs = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage);
  };
  
  if (loading && page === 0) return <div className="loading-spinner">Loading logs...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (logs.length === 0) return <div className="empty-state">No logs available for this agent.</div>;
  
  return (
    <div className="agent-logs-container">
      <h3>Agent Activity Log</h3>
      
      <div className="logs-list">
        {logs.map((log) => (
          <AgentLogEntry key={log.id} log={log} />
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more">
          <button 
            className="btn btn-outline-primary"
            onClick={loadMoreLogs}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Logs'}
          </button>
        </div>
      )}
    </div>
  );
};

// Individual log entry component with URL and screenshot support
const AgentLogEntry = ({ log }) => {
  const [showScreenshot, setShowScreenshot] = useState(false);
  
  // Format the timestamp for display
  const formattedTime = log.timestamp 
    ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })
    : 'Unknown time';
  
  // Determine log type class (info, error, etc.)
  const logClass = `log-entry log-${log.level || 'info'}`;
  
  // Check if screenshot is available and format path
  const hasScreenshot = !!log.screenshot;
  const screenshotUrl = log.screenshot?.startsWith('data:')
    ? log.screenshot // It's a data URL
    : `/uploads/artifacts/${log.agentId}/${log.screenshot}`; // It's a file path
  
  return (
    <div className={logClass}>
      <div className="log-header">
        <span className="log-time">{formattedTime}</span>
        {log.stepNumber > 0 && (
          <span className="log-step">Step {log.stepNumber}</span>
        )}
        <span className="log-level">{log.level?.toUpperCase()}</span>
      </div>
      
      <div className="log-message">{log.message}</div>
      
      {/* Display URL if available */}
      {log.url && (
        <div className="log-url">
          <span className="url-label">URL:</span>
          <a 
            href={log.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="url-link"
          >
            {log.url}
          </a>
        </div>
      )}
      
      {/* Display screenshot toggle if available */}
      {hasScreenshot && (
        <div className="log-screenshot-container">
          <button 
            className="screenshot-toggle"
            onClick={() => setShowScreenshot(!showScreenshot)}
          >
            {showScreenshot ? 'Hide Screenshot' : 'Show Screenshot'}
          </button>
          
          {showScreenshot && (
            <div className="log-screenshot">
              <img 
                src={screenshotUrl} 
                alt="Screenshot from step" 
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Display additional details if available */}
      {log.details && Object.keys(log.details).length > 0 && (
        <div className="log-details">
          <details>
            <summary>Additional Details</summary>
            <pre>{JSON.stringify(log.details, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default AgentLogsList;
```

## CSS Styles for Agent Logs

Add these styles to your CSS file:

```css
.agent-logs-container {
  margin-top: 2rem;
}

.logs-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 1rem;
  margin-bottom: 1rem;
}

.log-entry {
  background: var(--card-bg);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--info-color);
}

.log-entry.log-error {
  border-left-color: var(--error-color);
}

.log-entry.log-warning {
  border-left-color: var(--warning-color);
}

.log-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.log-time {
  color: var(--text-secondary);
  margin-right: 1rem;
}

.log-step {
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-right: 1rem;
  font-weight: 500;
}

.log-level {
  background: var(--info-light);
  color: var(--info-color);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
}

.log-level.ERROR {
  background: var(--error-light);
  color: var(--error-color);
}

.log-level.WARNING {
  background: var(--warning-light);
  color: var(--warning-color);
}

.log-message {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.log-url {
  margin: 0.75rem 0;
  padding: 0.5rem;
  background: var(--code-bg);
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.url-label {
  color: var(--text-secondary);
  margin-right: 0.5rem;
  font-weight: 500;
}

.url-link {
  color: var(--link-color);
}

.log-screenshot-container {
  margin: 0.75rem 0;
}

.screenshot-toggle {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text-primary);
}

.screenshot-toggle:hover {
  background: var(--bg-hover);
}

.log-screenshot {
  margin-top: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  max-width: 100%;
}

.log-screenshot img {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
}

.log-details {
  margin-top: 0.75rem;
}

.log-details summary {
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.log-details pre {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: var(--code-bg);
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  overflow-x: auto;
  max-height: 200px;
}

.load-more {
  text-align: center;
  margin: 1rem 0;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</code_block_to_apply_changes_from> 