import React, { useState } from 'react';
import { Agent, AgentStatus } from '../types';
import { Link } from 'react-router-dom';

interface DashboardProps {
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ agents, setAgents }) => {
  const [isActionInProgress, setIsActionInProgress] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  
  const completedCount = agents.filter(a => a.status === AgentStatus.COMPLETED).length;
  const failedCount = agents.filter(a => a.status === AgentStatus.FAILED).length;
  const runningCount = agents.filter(a => a.status === AgentStatus.RUNNING).length;
  const pendingCount = agents.filter(a => a.status === AgentStatus.PENDING).length;
  const pausedCount = agents.filter(a => a.status === AgentStatus.PAUSED).length;
  const stoppedCount = agents.filter(a => a.status === AgentStatus.STOPPED).length;
  const idleCount = agents.filter(a => a.status === AgentStatus.IDLE).length;
  
  // Get recent agents
  const recentAgents = [...agents].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
  
  // Get running agents
  const runningAgents = agents.filter(a => 
    a.status === AgentStatus.RUNNING || a.status === AgentStatus.PENDING || a.status === AgentStatus.PAUSED
  );
  
  // Calculate success rate
  const successRate = agents.length > 0 
    ? Math.round((completedCount / agents.length) * 100) 
    : 0;
    
  // Handle agent actions (start, stop, pause, resume)
  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      // Mark this specific agent's action as in progress
      setIsActionInProgress(prev => ({ ...prev, [agentId]: true }));
      setActionError(null);

      // get apiUrl from local storage
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      // Direct API call to perform agent action
      const response = await fetch(`${apiUrl}agents/${agentId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'development-key'
        },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} agent. Server responded with ${response.status}`);
      }
      
      const newData = await response.json();
      
      if (newData.status !== 'success') {
        throw new Error(newData.message || `Failed to ${action} agent`);
      }
      // refresh the agents list
      await fetch(`${apiUrl}/agents`);
      const data = await response.json();
      setAgents(data);
    } catch (err) {
      console.error(`Error during ${action} action:`, err);
      setActionError(`An error occurred while trying to ${action} the agent.`);
    } finally {
      // Clear the in-progress state for this agent
      setIsActionInProgress(prev => ({ ...prev, [agentId]: false }));
    }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Welcome to Brainess Agents Lab</h1>
          <p className="text-slate-500">Overview of your Brainess Agents Labs and recent activity</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/create" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <i className="bi bi-plus-circle mr-2"></i>
            Create New Agent
          </Link>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <i className="bi bi-robot text-lg"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Agents</p>
              <h3 className="text-2xl font-bold text-slate-800">{agents.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <i className="bi bi-check-circle text-lg"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <h3 className="text-2xl font-bold text-slate-800">
                {completedCount}
                <span className="text-sm font-medium text-slate-500 ml-2">({successRate}%)</span>
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <i className="bi bi-play-circle text-lg"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500">Active</p>
              <h3 className="text-2xl font-bold text-slate-800">{runningCount + pendingCount + pausedCount}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
              <i className="bi bi-hourglass text-lg"></i>
            </div>
            <div>
              <p className="text-sm text-slate-500">Idle / Ready</p>
              <h3 className="text-2xl font-bold text-slate-800">{idleCount}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-3 md:mb-0">
            <h2 className="font-semibold text-slate-800 mr-4">Quick Actions</h2>
          </div>
          <div className="flex space-x-3">
            <Link 
              to="/create" 
              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <i className="bi bi-plus-circle mr-2"></i>
              New Agent
            </Link>
            <Link 
              to="/templates" 
              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <i className="bi bi-bookmark mr-2"></i>
              Templates
            </Link>
            <Link 
              to="/settings" 
              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <i className="bi bi-gear mr-2"></i>
              Settings
            </Link>
            <Link 
              to="/history" 
              className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <i className="bi bi-clock-history mr-2"></i>
              History
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Agents */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
            <div className="border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Recent Agents</h2>
              <Link to="/agents" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                View All <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            <div className="p-4">
              {recentAgents.length > 0 ? (
                <div className="space-y-3">
                  {recentAgents.map(agent => (
                    <div key={agent.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <i className="bi bi-robot text-blue-500 mr-2"></i>
                          <span className="font-medium text-slate-700">Agent {agent.id.substring(0, 8)}...</span>
                        </div>
                        {agent.status === AgentStatus.RUNNING && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center">
                            <span className="animate-pulse mr-1.5 h-2 w-2 bg-blue-500 rounded-full"></span>
                            Running
                          </span>
                        )}
                        {agent.status === AgentStatus.PENDING && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full flex items-center">
                            <span className="animate-pulse mr-1.5 h-2 w-2 bg-amber-500 rounded-full"></span>
                            Pending
                          </span>
                        )}
                        {agent.status === AgentStatus.COMPLETED && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center">
                            <i className="bi bi-check-circle-fill mr-1.5 text-green-600"></i>
                            Completed
                          </span>
                        )}
                        {agent.status === AgentStatus.FAILED && (
                          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full flex items-center">
                            <i className="bi bi-x-circle-fill mr-1.5 text-red-600"></i>
                            Failed
                          </span>
                        )}
                        {agent.status === AgentStatus.PAUSED && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center">
                            <i className="bi bi-pause-circle-fill mr-1.5 text-purple-600"></i>
                            Paused
                          </span>
                        )}
                        {agent.status === AgentStatus.STOPPED && (
                          <span className="px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-full flex items-center">
                            <i className="bi bi-stop-circle-fill mr-1.5 text-slate-600"></i>
                            Stopped
                          </span>
                        )}
                        {agent.status === AgentStatus.IDLE && (
                          <span className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full flex items-center">
                            <i className="bi bi-hourglass mr-1.5 text-teal-600"></i>
                            Idle
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm truncate">{agent.instruction}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-slate-500 flex items-center">
                          <i className="bi bi-clock mr-1"></i>
                          {agent.createdAt}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center">
                          <i className="bi bi-cpu mr-1"></i>
                          {agent.model}
                        </div>
                        <Link 
                          to={`/agents/${agent.id}`} 
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
                        >
                          View Details <i className="bi bi-chevron-right ml-1"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-robot text-slate-400 text-2xl"></i>
                  </div>
                  <h3 className="text-slate-700 font-medium mb-2">No agents created yet</h3>
                  <p className="text-slate-500 mb-4">Create your first agent to get started</p>
                  <Link 
                    to="/create" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <i className="bi bi-plus-circle mr-2"></i>
                    Create New Agent
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Running Agents Section */}
          {runningAgents.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Currently Active</h2>
              </div>
              <div className="p-4">
                {runningAgents.map(agent => (
                  <div key={agent.id} className="border border-slate-200 rounded-lg p-4 mb-3 last:mb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="bi bi-robot"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">Agent {agent.id.substring(0, 8)}...</h3>
                          <div className="text-xs text-slate-500 mt-0.5">{agent.createdAt}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 flex items-center text-xs rounded-full ${
                        agent.status === AgentStatus.RUNNING 
                          ? 'bg-blue-50 text-blue-700' 
                          : agent.status === AgentStatus.PENDING 
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-purple-50 text-purple-700'
                      }`}>
                        {agent.status === AgentStatus.RUNNING && (
                          <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                        )}
                        {agent.status === AgentStatus.PENDING && (
                          <span className="animate-pulse mr-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
                        )}
                        {agent.status === AgentStatus.PAUSED && (
                          <i className="bi bi-pause-circle-fill mr-1.5 text-purple-600"></i>
                        )}
                        {agent.status === AgentStatus.RUNNING 
                          ? 'Running' 
                          : agent.status === AgentStatus.PENDING 
                            ? 'Pending' 
                            : 'Paused'
                        }
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{agent.instruction}</p>
                    
                    <div className="mb-3">
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            agent.status === AgentStatus.RUNNING 
                              ? 'bg-blue-500' 
                              : agent.status === AgentStatus.PENDING 
                                ? 'bg-amber-500'
                                : 'bg-purple-500'
                          }`}
                          style={{ width: `${
                            agent.status === AgentStatus.PENDING 
                              ? 5 
                              : agent.status === AgentStatus.PAUSED 
                                ? 70
                                : 45
                          }%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex text-xs text-slate-500 items-center">
                        <div className="mr-3">
                          <i className="bi bi-cpu mr-1"></i>
                          {agent.model}
                        </div>
                        <div>
                          <i className="bi bi-layers mr-1"></i>
                          {agent.status === AgentStatus.PENDING 
                            ? '0' 
                            : agent.status === AgentStatus.PAUSED
                              ? '12'
                              : Math.floor(Math.random() * 10) + 1
                          }/{agent.maxSteps} steps
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {agent.status === AgentStatus.RUNNING && (
                          <>
                            <button 
                              className="text-xs bg-amber-500 text-white px-2 py-1 rounded hover:bg-amber-600 transition-colors"
                              onClick={() => handleAgentAction(agent.id, 'pause')}
                              disabled={isActionInProgress[agent.id]}
                            >
                              {isActionInProgress[agent.id] ? (
                                <span className="inline-flex items-center">
                                  <i className="bi bi-hourglass-split animate-spin mr-1"></i>
                                </span>
                              ) : (
                                <>
                                  <i className="bi bi-pause-fill mr-1"></i> Pause
                                </>
                              )}
                            </button>
                            <button 
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                              onClick={() => handleAgentAction(agent.id, 'stop')}
                              disabled={isActionInProgress[agent.id]}
                            >
                              {isActionInProgress[agent.id] ? (
                                <span className="inline-flex items-center">
                                  <i className="bi bi-hourglass-split animate-spin mr-1"></i>
                                </span>
                              ) : (
                                <>
                                  <i className="bi bi-stop-fill mr-1"></i> Stop
                                </>
                              )}
                            </button>
                          </>
                        )}
                        {agent.status === AgentStatus.PAUSED && (
                          <>
                            <button 
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                              onClick={() => handleAgentAction(agent.id, 'resume')}
                              disabled={isActionInProgress[agent.id]}
                            >
                              {isActionInProgress[agent.id] ? (
                                <span className="inline-flex items-center">
                                  <i className="bi bi-hourglass-split animate-spin mr-1"></i>
                                </span>
                              ) : (
                                <>
                                  <i className="bi bi-play-fill mr-1"></i> Resume
                                </>
                              )}
                            </button>
                            <button 
                              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                              onClick={() => handleAgentAction(agent.id, 'stop')}
                              disabled={isActionInProgress[agent.id]}
                            >
                              {isActionInProgress[agent.id] ? (
                                <span className="inline-flex items-center">
                                  <i className="bi bi-hourglass-split animate-spin mr-1"></i>
                                </span>
                              ) : (
                                <>
                                  <i className="bi bi-stop-fill mr-1"></i> Stop
                                </>
                              )}
                            </button>
                          </>
                        )}
                        {agent.status === AgentStatus.PENDING && (
                          <button 
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                            onClick={() => handleAgentAction(agent.id, 'stop')}
                            disabled={isActionInProgress[agent.id]}
                          >
                            {isActionInProgress[agent.id] ? (
                              <span className="inline-flex items-center">
                                <i className="bi bi-hourglass-split animate-spin mr-1"></i>
                              </span>
                            ) : (
                              <>
                                <i className="bi bi-x-circle-fill mr-1"></i> Cancel
                              </>
                            )}
                          </button>
                        )}
                        <Link 
                          to={`/agents/${agent.id}`}
                          className="text-xs text-blue-600 font-medium hover:text-blue-800"
                        >
                          View <i className="bi bi-arrow-right ml-1"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Idle Agents Section */}
          {idleCount > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm mt-6">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="font-semibold text-slate-800">Ready to Run</h2>
              </div>
              <div className="p-4">
                {agents.filter(a => a.status === AgentStatus.IDLE).map(agent => (
                  <div key={agent.id} className="border border-slate-200 rounded-lg p-4 mb-3 last:mb-0">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-teal-100 text-teal-600 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="bi bi-robot"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">Agent {agent.id.substring(0, 8)}...</h3>
                          <div className="text-xs text-slate-500 mt-0.5">{agent.createdAt}</div>
                        </div>
                      </div>
                      <span className="px-2 py-1 flex items-center text-xs rounded-full bg-teal-50 text-teal-700">
                        <i className="bi bi-hourglass mr-1.5 text-teal-600"></i>
                        Idle
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{agent.instruction}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex text-xs text-slate-500 items-center">
                        <div className="mr-3">
                          <i className="bi bi-cpu mr-1"></i>
                          {agent.model}
                        </div>
                        <div>
                          <i className="bi bi-layers mr-1"></i>
                          {agent.maxSteps} steps max
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                          onClick={() => handleAgentAction(agent.id, 'start')}
                          disabled={isActionInProgress[agent.id]}
                        >
                          {isActionInProgress[agent.id] ? (
                            <span className="inline-flex items-center">
                              <i className="bi bi-hourglass-split animate-spin mr-1"></i> Starting...
                            </span>
                          ) : (
                            <>
                              <i className="bi bi-play-fill mr-1"></i> Start
                            </>
                          )}
                        </button>
                        <Link 
                          to={`/agents/${agent.id}`}
                          className="text-xs text-blue-600 font-medium hover:text-blue-800"
                        >
                          View <i className="bi bi-arrow-right ml-1"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>  
      </div>
    </div>
  );
};

export default Dashboard; 