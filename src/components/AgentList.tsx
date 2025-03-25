import React, { useState } from 'react';
import { Agent, AgentStatus } from '../types';

interface AgentListProps {
  agents: Agent[];
  onViewDetails: (agentId: string) => void;
}

const AgentList: React.FC<AgentListProps> = ({ agents, onViewDetails }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isActionInProgress, setIsActionInProgress] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Filter agents by status and search term
  const filteredAgents = agents
    .filter(agent => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return agent.status === AgentStatus.RUNNING || agent.status === AgentStatus.PENDING || agent.status === AgentStatus.PAUSED;
      if (filterStatus === 'idle') return agent.status === AgentStatus.IDLE;
      if (filterStatus === 'completed') return agent.status === AgentStatus.COMPLETED;
      if (filterStatus === 'failed') return agent.status === AgentStatus.FAILED || agent.status === AgentStatus.STOPPED;
      return true;
    })
    .filter(agent => 
      agent.instruction.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  // Handle agent actions (start, stop, pause, resume)
  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      // Mark this specific agent's action as in progress
      setIsActionInProgress(prev => ({ ...prev, [agentId]: true }));
      setActionError(null);
      
      // Direct API call to perform agent action
      // get apiUrl from local storage  
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(`${apiUrl}/agents/${agentId}/${action}`, {
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
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || `Failed to ${action} agent`);
      }
      
    } catch (err) {
      console.error(`Error during ${action} action:`, err);
      setActionError(`An error occurred while trying to ${action} the agent.`);
    } finally {
      // Clear the in-progress state for this agent
      setIsActionInProgress(prev => ({ ...prev, [agentId]: false }));
    }
  };
  
  const getStatusInfo = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING:
        return {
          className: "px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full flex items-center",
          icon: <span className="animate-pulse mr-1.5 h-2 w-2 bg-blue-500 rounded-full"></span>,
          text: "Running"
        };
      case AgentStatus.PENDING:
        return {
          className: "px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full flex items-center",
          icon: <span className="animate-pulse mr-1.5 h-2 w-2 bg-amber-500 rounded-full"></span>,
          text: "Pending"
        };
      case AgentStatus.COMPLETED:
        return {
          className: "px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-check-circle-fill mr-1.5 text-green-600"></i>,
          text: "Completed"
        };
      case AgentStatus.FAILED:
        return {
          className: "px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-x-circle-fill mr-1.5 text-red-600"></i>,
          text: "Failed"
        };
      case AgentStatus.PAUSED:
        return {
          className: "px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-pause-circle-fill mr-1.5 text-purple-600"></i>,
          text: "Paused"
        };
      case AgentStatus.STOPPED:
        return {
          className: "px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-stop-circle-fill mr-1.5 text-slate-600"></i>,
          text: "Stopped"
        };
      case AgentStatus.IDLE:
        return {
          className: "px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-hourglass mr-1.5 text-teal-600"></i>,
          text: "Idle"
        };
      default:
        return {
          className: "px-2 py-1 bg-slate-50 text-slate-700 text-xs rounded-full flex items-center",
          icon: <i className="bi bi-question-circle-fill mr-1.5 text-slate-600"></i>,
          text: status || "Unknown"
        };
    }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">My Agents</h1>
        <p className="text-slate-500">Manage and monitor your Brainess Agents Labs</p>
      </div>
      
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setFilterStatus('active')}
            >
              Active
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'idle' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setFilterStatus('idle')}
            >
              Idle
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </button>
            <button 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === 'failed' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              onClick={() => setFilterStatus('failed')}
            >
              Failed
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search agents..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <i className="bi bi-search"></i>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {filteredAgents.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {filteredAgents.map(agent => {
                const statusInfo = getStatusInfo(agent.status);
                
                return (
                  <div key={agent.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-2">
                          <i className="bi bi-robot text-blue-500 mr-2 text-lg"></i>
                          <h3 className="font-semibold text-slate-800 truncate mr-3">
                            Agent {agent.id.substring(0, 8)}...
                          </h3>
                          <div className={statusInfo.className}>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </div>
                        </div>
                        <p className="text-slate-600 mb-2 line-clamp-2">{agent.instruction}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                          <span className="flex items-center">
                            <i className="bi bi-clock mr-1"></i>
                            {agent.createdAt}
                          </span>
                          <span className="flex items-center">
                            <i className="bi bi-cpu mr-1"></i>
                            {agent.model}
                          </span>
                          <span className="flex items-center">
                            <i className="bi bi-layers mr-1"></i>
                            {agent.maxSteps} steps
                          </span>
                          <span className="flex items-center">
                            {agent.headless ? (
                              <i className="bi bi-eye-slash mr-1"></i>
                            ) : (
                              <i className="bi bi-eye mr-1"></i>
                            )}
                            {agent.headless ? 'Headless' : 'Visible'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 self-end md:self-auto">
                        <button 
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          onClick={() => onViewDetails(agent.id)}
                        >
                          <i className="bi bi-eye mr-1.5"></i> View Details
                        </button>
                        {agent.status === AgentStatus.RUNNING && (
                          <button 
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            onClick={() => handleAgentAction(agent.id, 'stop')}
                            disabled={isActionInProgress[agent.id]}
                          >
                            {isActionInProgress[agent.id] ? (
                              <span className="inline-flex items-center">
                                <i className="bi bi-hourglass-split animate-spin mr-1.5"></i> Processing...
                              </span>
                            ) : (
                              <>
                                <i className="bi bi-stop-circle mr-1.5"></i> Stop
                              </>
                            )}
                          </button>
                        )}
                        {agent.status === AgentStatus.PENDING && (
                          <button 
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                            onClick={() => handleAgentAction(agent.id, 'stop')}
                            disabled={isActionInProgress[agent.id]}
                          >
                            {isActionInProgress[agent.id] ? (
                              <span className="inline-flex items-center">
                                <i className="bi bi-hourglass-split animate-spin mr-1.5"></i> Processing...
                              </span>
                            ) : (
                              <>
                                <i className="bi bi-x-circle mr-1.5"></i> Cancel
                              </>
                            )}
                          </button>
                        )}
                        {agent.status === AgentStatus.PAUSED && (
                          <button 
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                            onClick={() => handleAgentAction(agent.id, 'resume')}
                            disabled={isActionInProgress[agent.id]}
                          >
                            {isActionInProgress[agent.id] ? (
                              <span className="inline-flex items-center">
                                <i className="bi bi-hourglass-split animate-spin mr-1.5"></i> Processing...
                              </span>
                            ) : (
                              <>
                                <i className="bi bi-play-circle mr-1.5"></i> Resume
                              </>
                            )}
                          </button>
                        )}
                        {agent.status === AgentStatus.IDLE && (
                          <button 
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                            onClick={() => handleAgentAction(agent.id, 'start')}
                            disabled={isActionInProgress[agent.id]}
                          >
                            {isActionInProgress[agent.id] ? (
                              <span className="inline-flex items-center">
                                <i className="bi bi-hourglass-split animate-spin mr-1.5"></i> Processing...
                              </span>
                            ) : (
                              <>
                                <i className="bi bi-play-circle mr-1.5"></i> Start
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="bg-slate-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <i className="bi bi-robot text-slate-400 text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">No agents found</h3>
              <p className="text-slate-500">
                {filterStatus !== 'all' 
                  ? `No ${filterStatus} agents found. Try changing the filter.` 
                  : searchTerm 
                    ? "No agents match your search. Try a different term." 
                    : "Create a new agent to get started."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentList; 