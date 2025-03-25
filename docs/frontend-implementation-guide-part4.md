# Frontend Implementation Guide for Agent Details Page - Part 4

## Agent Results and Artifacts Display

Update the results display to include artifacts, screenshots, and session recordings (GIFs):

```jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const AgentResults = ({ agentId }) => {
  const [results, setResults] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!agentId) return;
    
    setLoading(true);
    
    // Fetch both results and artifacts in parallel
    const fetchResultsPromise = fetch(`/api/v1/agents/${agentId}/results`, {
      headers: { 'X-API-Key': 'development-key' }
    })
    .then(res => {
      if (!res.ok) {
        // It's okay if we don't have results yet
        if (res.status === 404) return { status: 'success', data: { results: null } };
        throw new Error('Failed to fetch results');
      }
      return res.json();
    });
    
    const fetchArtifactsPromise = fetch(`/api/v1/agents/${agentId}/artifacts`, {
      headers: { 'X-API-Key': 'development-key' }
    })
    .then(res => {
      if (!res.ok) {
        // It's okay if we don't have artifacts yet
        if (res.status === 404) return { status: 'success', data: { artifacts: [] } };
        throw new Error('Failed to fetch artifacts');
      }
      return res.json();
    });
    
    // Process both responses
    Promise.all([fetchResultsPromise, fetchArtifactsPromise])
      .then(([resultsData, artifactsData]) => {
        if (resultsData.status === 'success') {
          setResults(resultsData.data.results);
        }
        
        if (artifactsData.status === 'success') {
          setArtifacts(artifactsData.data.artifacts || []);
        }
      })
      .catch(err => {
        setError(err.message);
        console.error('Error fetching agent results or artifacts:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [agentId]);
  
  // Group artifacts by type for easier display
  const groupedArtifacts = React.useMemo(() => {
    const groups = {
      screenshots: [],
      gif: null,
      other: []
    };
    
    artifacts.forEach(artifact => {
      if (artifact.type === 'screenshot') {
        groups.screenshots.push(artifact);
      } else if (artifact.type === 'gif' || artifact.contentType?.includes('gif')) {
        groups.gif = artifact;
      } else {
        groups.other.push(artifact);
      }
    });
    
    return groups;
  }, [artifacts]);
  
  if (loading) return <div className="loading-spinner">Loading results...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  
  // Show empty state if no results or artifacts
  if (!results && artifacts.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Results Yet</h3>
        <p>The agent hasn't completed its execution or hasn't produced any results yet.</p>
      </div>
    );
  }
  
  return (
    <div className="agent-results">
      {/* Results Summary */}
      {results && (
        <div className="result-section">
          <h3>Results</h3>
          <div className="result-card">
            {results.summary && (
              <div className="result-summary">
                <h4>Summary</h4>
                <p>{results.summary}</p>
              </div>
            )}
            
            {results.outputText && (
              <div className="result-output">
                <h4>Detailed Output</h4>
                {results.outputHtml ? (
                  <div 
                    className="html-output" 
                    dangerouslySetInnerHTML={{ __html: results.outputHtml }} 
                  />
                ) : (
                  <pre className="text-output">{results.outputText}</pre>
                )}
              </div>
            )}
            
            {results.createdAt && (
              <div className="result-meta">
                <span>Result created {format(new Date(results.createdAt), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Session Recording */}
      {groupedArtifacts.gif && (
        <div className="recording-section">
          <h3>Session Recording</h3>
          <div className="recording-card">
            <div className="gif-container">
              <img 
                src={groupedArtifacts.gif.url} 
                alt="Session recording" 
                className="session-gif" 
              />
            </div>
            <div className="recording-info">
              <span>Recorded on {format(new Date(groupedArtifacts.gif.createdAt), 'MMM d, yyyy h:mm a')}</span>
              <a 
                href={groupedArtifacts.gif.url} 
                download={groupedArtifacts.gif.filename}
                className="download-link"
              >
                Download Recording
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Screenshots Gallery */}
      {groupedArtifacts.screenshots.length > 0 && (
        <div className="screenshots-section">
          <h3>Screenshots ({groupedArtifacts.screenshots.length})</h3>
          <div className="screenshots-grid">
            {groupedArtifacts.screenshots.map(screenshot => (
              <div key={screenshot.id} className="screenshot-item">
                <a 
                  href={screenshot.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="screenshot-link"
                >
                  <img 
                    src={screenshot.url} 
                    alt={screenshot.filename} 
                    loading="lazy"
                  />
                </a>
                <div className="screenshot-info">
                  <span className="screenshot-filename">{screenshot.filename}</span>
                  <a 
                    href={screenshot.url} 
                    download={screenshot.filename}
                    className="download-link"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Other Artifacts */}
      {groupedArtifacts.other.length > 0 && (
        <div className="artifacts-section">
          <h3>Other Artifacts ({groupedArtifacts.other.length})</h3>
          <div className="artifacts-list">
            {groupedArtifacts.other.map(artifact => (
              <div key={artifact.id} className="artifact-item">
                <div className="artifact-icon">
                  {getArtifactIcon(artifact.contentType)}
                </div>
                <div className="artifact-details">
                  <h4 className="artifact-filename">{artifact.filename}</h4>
                  <span className="artifact-type">{artifact.contentType}</span>
                  <span className="artifact-size">{formatFileSize(artifact.size)}</span>
                </div>
                <div className="artifact-actions">
                  <a 
                    href={artifact.url} 
                    download={artifact.filename}
                    className="download-link"
                  >
                    Download
                  </a>
                  <a 
                    href={artifact.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-link"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get icon for artifact type
function getArtifactIcon(contentType) {
  if (!contentType) return '📄'; // Default
  
  if (contentType.includes('image')) return '🖼️';
  if (contentType.includes('video')) return '🎬';
  if (contentType.includes('audio')) return '🔊';
  if (contentType.includes('pdf')) return '📕';
  if (contentType.includes('json')) return '📊';
  if (contentType.includes('text')) return '📝';
  if (contentType.includes('html')) return '🌐';
  
  return '📄'; // Default
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default AgentResults;
```

## CSS Styles for Agent Results

Add these styles to your CSS file:

```css
.agent-results {
  margin-top: 2rem;
}

.result-section,
.recording-section,
.screenshots-section,
.artifacts-section {
  margin-bottom: 2.5rem;
}

.result-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.result-summary {
  margin-bottom: 1.5rem;
}

.result-summary h4 {
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.result-output {
  margin-top: 1.5rem;
}

.result-output h4 {
  margin-bottom: 0.75rem;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.html-output {
  background: var(--bg-light);
  border-radius: 6px;
  padding: 1rem;
  overflow: auto;
}

.text-output {
  background: var(--code-bg);
  border-radius: 6px;
  padding: 1rem;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
  overflow: auto;
  max-height: 500px;
}

.result-meta {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: right;
}

.recording-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.gif-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.session-gif {
  max-width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.recording-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.download-link {
  color: var(--primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-size: 0.9rem;
}

.download-link:hover {
  text-decoration: underline;
}

.screenshots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.screenshot-item {
  background: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.screenshot-link {
  display: block;
  height: 180px;
  overflow: hidden;
}

.screenshot-link img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.screenshot-link:hover img {
  transform: scale(1.05);
}

.screenshot-info {
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.screenshot-filename {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.artifacts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.artifact-item {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.artifact-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.artifact-details {
  flex: 1;
}

.artifact-filename {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.artifact-type,
.artifact-size {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.artifact-actions {
  display: flex;
  gap: 1rem;
}

.view-link {
  color: var(--info-color);
  text-decoration: none;
}

.view-link:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.empty-state h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.empty-state p {
  color: var(--text-secondary);
  max-width: 500px;
  margin: 0 auto;
} 