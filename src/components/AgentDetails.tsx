import React, { useState, useEffect } from "react";
import { Agent, AgentStatus } from "../types";
import { format, formatDistanceToNow } from "date-fns";

interface AgentDetailsProps {
  agent: Agent & {
    name?: string;
    tag?: string;
    notes?: string;
  };
  onBack: () => void;
  onAgentAction: (
    agentId: string,
    action: "start" | "stop" | "pause" | "resume"
  ) => Promise<Agent | null>;
  onDeleteAgent: (agentId: string) => Promise<boolean>;
}

// Types for agent data
interface AgentLogs {
  id: string;
  agentId: string;
  timestamp: string;
  level: "info" | "action" | "warning" | "error";
  message: string;
  stepNumber?: number;
  url?: string;
  screenshot?: string;
  details?: Record<string, any>;
}

interface AgentStats {
  duration: string;
  formattedDuration: string;
  pagesVisited: number;
  stepsCompleted: number;
  tokenUsage: number;
}

interface AgentResults {
  summary: string;
  outputText: string;
  outputHtml?: string;
  createdAt: string;
}

interface AgentArtifact {
  id: string;
  agentId: string;
  type: string;
  filename: string;
  url: string;
  contentType: string;
  size: number;
  createdAt: string;
}

// Timeline action type to fix TypeScript errors
interface TimelineAction {
  action: string;
  timestamp: string;
  stepNumber?: number;
}

const AgentDetails: React.FC<AgentDetailsProps> = ({
  agent,
  onBack,
  onAgentAction,
  onDeleteAgent,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Settings form state
  const [agentName, setAgentName] = useState<string>("");
  const [agentTag, setAgentTag] = useState<string>("");
  const [agentNotes, setAgentNotes] = useState<string>("");

  // State for dynamic agent data
  const [agentLogs, setAgentLogs] = useState<AgentLogs[]>([]);
  const [agentResults, setAgentResults] = useState<AgentResults | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [agentArtifacts, setAgentArtifacts] = useState<AgentArtifact[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const PAGE_SIZE = 20;

  // Empty states instead of mock data
  const hasLogs =
    agent.status !== AgentStatus.PENDING && agent.status !== AgentStatus.IDLE;
  const hasResults =
    agent.status === AgentStatus.COMPLETED ||
    agent.status === AgentStatus.FAILED;

  // Get status info for display
  const getStatusInfo = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING:
        return {
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: (
            <span className="animate-pulse mr-2 h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
          ),
          text: "Running",
          progress: 65,
        };
      case AgentStatus.PENDING:
        return {
          className: "bg-amber-50 text-amber-700 border-amber-200",
          icon: (
            <span className="animate-pulse mr-2 h-2.5 w-2.5 bg-amber-500 rounded-full"></span>
          ),
          text: "Pending",
          progress: 0,
        };
      case AgentStatus.COMPLETED:
        return {
          className: "bg-green-50 text-green-700 border-green-200",
          icon: <i className="bi bi-check-circle-fill mr-2 text-green-600"></i>,
          text: "Completed",
          progress: 100,
        };
      case AgentStatus.FAILED:
        return {
          className: "bg-red-50 text-red-700 border-red-200",
          icon: <i className="bi bi-x-circle-fill mr-2 text-red-600"></i>,
          text: "Failed",
          progress: 100,
        };
      case AgentStatus.PAUSED:
        return {
          className: "bg-purple-50 text-purple-700 border-purple-200",
          icon: (
            <i className="bi bi-pause-circle-fill mr-2 text-purple-600"></i>
          ),
          text: "Paused",
          progress: 70,
        };
      case AgentStatus.STOPPED:
        return {
          className: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <i className="bi bi-stop-circle-fill mr-2 text-slate-600"></i>,
          text: "Stopped",
          progress: 100,
        };
      case AgentStatus.IDLE:
        return {
          className: "bg-teal-50 text-teal-700 border-teal-200",
          icon: <i className="bi bi-hourglass mr-2 text-teal-600"></i>,
          text: "Idle",
          progress: 0,
        };
      default:
        return {
          className: "bg-slate-50 text-slate-700 border-slate-200",
          icon: (
            <i className="bi bi-question-circle-fill mr-2 text-slate-600"></i>
          ),
          text: status || "Unknown",
          progress: 0,
        };
    }
  };

  const statusInfo = getStatusInfo(agent.status);

  // Fetch agent logs with pagination
  const fetchLogs = async (pageNum = 0) => {
    if (pageNum === 0) setIsLoadingLogs(true);

    try {
      // Fetch logs from API
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${
          agent.id
        }/logs?limit=${PAGE_SIZE}&offset=${pageNum * PAGE_SIZE}`,
        { headers: { "X-API-Key": "development-key" } }
      );

      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch logs");
      }

      // For page 0, replace logs, otherwise append
      const newLogs =
        pageNum === 0 ? data.data.items : [...agentLogs, ...data.data.items];
      setAgentLogs(newLogs);

      // Check if we have more logs to load
      setHasMoreLogs(newLogs.length < data.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
      console.error("Error fetching agent logs:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch agent statistics
  const fetchStats = async () => {
    setIsLoadingStats(true);

    try {
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${agent.id}/stats`,
        {
          headers: { "X-API-Key": "development-key" },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch stats");
      }

      setAgentStats(data.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
      console.error("Error fetching agent stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch agent results
  const fetchResults = async () => {
    setIsLoadingResults(true);

    try {
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${agent.id}/results`,
        {
          headers: { "X-API-Key": "development-key" },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setAgentResults(null);
          return;
        }
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch results");
      }

      setAgentResults(data.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      console.error("Error fetching agent results:", err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  // Fetch agent artifacts
  const fetchArtifacts = async () => {
    setIsLoadingArtifacts(true);

    try {
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${agent.id}/artifacts`,
        {
          headers: { "X-API-Key": "development-key" },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setAgentArtifacts([]);
          return;
        }
        throw new Error("Failed to fetch artifacts");
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to fetch artifacts");
      }

      setAgentArtifacts(data.data.artifacts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch artifacts"
      );
      console.error("Error fetching agent artifacts:", err);
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Fetch all agent data
  const fetchAllAgentData = () => {
    fetchLogs(0);
    fetchStats();
    fetchResults();
    fetchArtifacts();
  };

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!agent?.id) return;

    console.log(`[AgentDetails] Setting up event logging for agent ${agent.id}`);

    // Create event listener for agent updates
    const handleAgentUpdate = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.agentId !== agent.id) return; // Only handle events for this agent
      
      console.log('[AgentDetails] Received agent update:', {
        agentId: data.agentId,
        status: data.status,
        currentStep: data.currentStep,
        timestamp: new Date().toISOString()
      });
      
      // Update local state if needed
      if (data.status) {
        // Trigger a refresh of agent data when status changes
        fetchAllAgentData();
      }
    };

    // Create event listener for agent logs
    const handleAgentLog = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.agentId !== agent.id) return; // Only handle events for this agent
      
      console.log('[AgentDetails] Received agent log:', {
        agentId: data.agentId,
        level: data.log.level,
        message: data.log.message,
        stepNumber: data.log.stepNumber,
        timestamp: new Date().toISOString()
      });
      
      // Update logs state
      setAgentLogs(prevLogs => {
        const newLog = data.log;
        // Check if log already exists to prevent duplicates
        if (prevLogs.some(log => log.id === newLog.id)) {
          return prevLogs;
        }
        return [newLog, ...prevLogs];
      });
    };

    // Create event listener for agent results
    const handleAgentResult = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.agentId !== agent.id) return; // Only handle events for this agent
      
      console.log('[AgentDetails] Received agent result:', {
        agentId: data.agentId,
        type: data.type,
        timestamp: new Date().toISOString()
      });
      
      // Update results state
      if (data.result) {
        setAgentResults(data.result);
      }
    };

    // Create event listener for agent navigation
    const handleAgentNavigation = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.agentId !== agent.id) return; // Only handle events for this agent
      
      console.log('[AgentDetails] Received agent navigation:', {
        agentId: data.agentId,
        url: data.url,
        stepNumber: data.stepNumber,
        timestamp: new Date().toISOString()
      });
      
      // Update navigation state if needed
      // This could update a timeline or navigation history component
    };

    // Create event listener for agent screenshots
    const handleAgentScreenshot = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data.agentId !== agent.id) return; // Only handle events for this agent
      
      console.log('[AgentDetails] Received agent screenshot:', {
        agentId: data.agentId,
        url: data.url,
        stepNumber: data.stepNumber,
        timestamp: new Date().toISOString()
      });
      
      // Update screenshots state if needed
      // This could update the screenshots gallery or timeline
    };

    // Add event listeners
    window.addEventListener('agent-status-update', handleAgentUpdate);
    window.addEventListener('agent-log-update', handleAgentLog);
    window.addEventListener('agent-result-update', handleAgentResult);
    window.addEventListener('agent-navigation-update', handleAgentNavigation);
    window.addEventListener('agent-screenshot-update', handleAgentScreenshot);

    // Cleanup function to remove event listeners
    return () => {
      console.log(`[AgentDetails] Cleaning up event listeners for agent ${agent.id}`);
      window.removeEventListener('agent-status-update', handleAgentUpdate);
      window.removeEventListener('agent-log-update', handleAgentLog);
      window.removeEventListener('agent-result-update', handleAgentResult);
      window.removeEventListener('agent-navigation-update', handleAgentNavigation);
      window.removeEventListener('agent-screenshot-update', handleAgentScreenshot);
    };
  }, [agent?.id]); // Only re-run if agent.id changes

  // Load more logs when requested
  const loadMoreLogs = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage);
  };

  // Refresh data when tab changes
  useEffect(() => {
    if (agent?.id) {
      fetchAllAgentData();
    }
  }, [activeTab]);

  // Handle agent actions (start, stop, pause, resume)
  const handleAgentAction = async (
    action: "start" | "stop" | "pause" | "resume"
  ) => {
    try {
      setIsActionInProgress(true);
      setActionError(null);

      // Direct API call to perform agent action
      // get apiUrl from local storage
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${agent.id}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "development-key",
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to ${action} agent. Server responded with ${response.status}`
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || `Failed to ${action} agent`);
      }

      // Refresh data after action
      fetchAllAgentData();

      // Also call the prop callback if needed for parent component updates
      const result = await onAgentAction(agent.id, action);

      if (!result) {
        setActionError(`Failed to ${action} agent. Please try again.`);
      }
    } catch (err) {
      console.error(`Error during ${action} action:`, err);
      setActionError(`An error occurred while trying to ${action} the agent.`);
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Handle agent deletion
  const handleDeleteAgent = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this agent? This action cannot be undone."
      )
    ) {
      try {
        setIsActionInProgress(true);
        setActionError(null);

        // Direct API call to delete agent
        const apiUrl = localStorage.getItem("apiUrl");
        if (!apiUrl) {
          throw new Error("API URL not found");
        }
        const response = await fetch(
          `${apiUrl}/agents/${agent.id}`,
          {
            method: "DELETE",
            headers: {
              "X-API-Key": "development-key",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete agent. Server responded with ${response.status}`
          );
        }

        const data = await response.json();

        if (data.status !== "success") {
          throw new Error(data.message || "Failed to delete agent");
        }

        // Call the prop callback to inform parent component
        const success = await onDeleteAgent(agent.id);

        if (success) {
          onBack(); // Navigate back after successful deletion
        } else {
          setActionError("Failed to delete agent. Please try again.");
        }
      } catch (err) {
        console.error("Error deleting agent:", err);
        setActionError("An error occurred while trying to delete the agent.");
      } finally {
        setIsActionInProgress(false);
      }
    }
  };

  // Handle saving agent settings
  const handleSaveSettings = async () => {
    try {
      setIsActionInProgress(true);
      setActionError(null);

      // Direct API call to update agent settings
      const apiUrl = localStorage.getItem("apiUrl");
      if (!apiUrl) {
        throw new Error("API URL not found");
      }
      const response = await fetch(
        `${apiUrl}/agents/${agent.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": "development-key",
          },
          body: JSON.stringify({
            name: agentName,
            tag: agentTag,
            notes: agentNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update agent settings. Server responded with ${response.status}`
        );
      }

      const data = await response.json();

      if (data.status !== "success") {
        throw new Error(data.message || "Failed to update agent settings");
      }

      // Show success message
      setActionError("Settings saved successfully!");
      setTimeout(() => setActionError(null), 3000);
    } catch (err) {
      console.error("Error saving agent settings:", err);
      setActionError("An error occurred while trying to save settings.");
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Load agent data when component mounts
  useEffect(() => {
    if (agent?.id) {
      // Set initial values for settings form
      setAgentName(agent.name || "");
      setAgentTag(agent.tag || "");
      setAgentNotes(agent.notes || "");

      fetchAllAgentData();
    }
  }, [agent?.id]);

  return (
    <div className="p-6 overflow-auto h-full">
      {/* Header with back button */}
      <div className="mb-6 flex items-center">
        <button
          className="mr-4 p-2 hover:bg-slate-200 rounded-lg transition-colors"
          onClick={onBack}
          disabled={isActionInProgress}
        >
          <i className="bi bi-arrow-left text-slate-600"></i>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Agent Details
          </h1>
          <p className="text-slate-500">
            Viewing details for agent {agent.id.substring(0, 8)}...
          </p>
        </div>
        <button
          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
          onClick={handleDeleteAgent}
          disabled={isActionInProgress}
          title="Delete Agent"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>

      {/* Action Error Message */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 flex items-center">
          <i className="bi bi-exclamation-triangle-fill mr-2"></i>
          {actionError}
          <button
            className="ml-auto text-red-600 hover:text-red-800"
            onClick={() => setActionError(null)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Agent Overview Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                <i className="bi bi-robot text-2xl"></i>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">
                  Agent {agent.id.substring(0, 8)}...
                </h2>
                <div className="text-sm text-slate-500">{agent.createdAt}</div>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg border flex items-center text-sm font-medium ${statusInfo?.className}`}
            >
              {statusInfo?.icon}
              {statusInfo?.text}
            </div>
          </div>

          {/* Progress bar for running or pending agents */}
          {(agent.status === AgentStatus.RUNNING ||
            agent.status === AgentStatus.PENDING) && (
            <div className="w-full bg-slate-200 h-2 rounded-full mb-4">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${statusInfo?.progress}%` }}
              ></div>
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-slate-700 mb-2">Instructions</h3>
            <p className="text-slate-600">{agent.instruction}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Model</div>
              <div className="font-medium text-slate-700 flex items-center">
                <i className="bi bi-cpu mr-2 text-blue-500"></i>
                {agent.model}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Max Steps</div>
              <div className="font-medium text-slate-700 flex items-center">
                <i className="bi bi-layers mr-2 text-blue-500"></i>
                {agent.maxSteps}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Browser Mode</div>
              <div className="font-medium text-slate-700 flex items-center">
                {agent.headless ? (
                  <>
                    <i className="bi bi-eye-slash mr-2 text-blue-500"></i>
                    Headless
                  </>
                ) : (
                  <>
                    <i className="bi bi-eye mr-2 text-blue-500"></i>
                    Visible
                  </>
                )}
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-500 mb-1">Features</div>
              <div className="font-medium text-slate-700">
                {agent.useVision && (
                  <span className="inline-flex items-center mr-2">
                    <i className="bi bi-camera mr-1 text-blue-500"></i> Vision
                  </span>
                )}
                {agent.generateGif && (
                  <span className="inline-flex items-center">
                    <i className="bi bi-filetype-gif mr-1 text-blue-500"></i>{" "}
                    GIF
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 mt-4">
            {/* Different actions based on current agent status */}
            {agent.status === AgentStatus.RUNNING && (
              <>
                <button
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center"
                  onClick={() => handleAgentAction("pause")}
                  disabled={isActionInProgress}
                >
                  {isActionInProgress ? (
                    <span className="inline-flex items-center">
                      <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                      Processing...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-pause-circle mr-2"></i> Pause Agent
                    </>
                  )}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  onClick={() => handleAgentAction("stop")}
                  disabled={isActionInProgress}
                >
                  {isActionInProgress ? (
                    <span className="inline-flex items-center">
                      <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                      Processing...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-stop-circle mr-2"></i> Stop Agent
                    </>
                  )}
                </button>
              </>
            )}

            {agent.status === AgentStatus.PENDING && (
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                onClick={() => handleAgentAction("stop")}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <span className="inline-flex items-center">
                    <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-stop-circle mr-2"></i> Cancel Agent
                  </>
                )}
              </button>
            )}

            {agent.status === AgentStatus.COMPLETED && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isActionInProgress}
              >
                <i className="bi bi-download mr-2"></i> Download Results
              </button>
            )}

            {agent.status === AgentStatus.PAUSED && (
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                onClick={() => handleAgentAction("resume")}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <span className="inline-flex items-center">
                    <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-play-circle mr-2"></i> Resume Agent
                  </>
                )}
              </button>
            )}

            {(agent.status === AgentStatus.COMPLETED ||
              agent.status === AgentStatus.FAILED ||
              agent.status === AgentStatus.STOPPED) && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                onClick={() => handleAgentAction("start")}
                disabled={isActionInProgress}
              >
                {isActionInProgress ? (
                  <span className="inline-flex items-center">
                    <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                    Processing...
                  </span>
                ) : (
                  <>
                    <i className="bi bi-arrow-repeat mr-2"></i> Run Again
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "overview"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <i className="bi bi-grid mr-2"></i> Overview
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "results"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("results")}
            >
              <i className="bi bi-card-text mr-2"></i> Results
              {activeTab === "results" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "timeline"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("timeline")}
            >
              <i className="bi bi-clock-history mr-2"></i> Timeline
              {activeTab === "timeline" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "logs"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("logs")}
            >
              <i className="bi bi-terminal mr-2"></i> Logs
              {activeTab === "logs" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === "settings"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("settings")}
            >
              <i className="bi bi-gear mr-2"></i> Settings
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-800 mb-3">
                    Session Preview
                  </h3>
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    {agent.generateGif ? (
                      agent.status === AgentStatus.COMPLETED ? (
                        // Look for a GIF in the artifacts
                        agentArtifacts.find((a) => a.type === "gif") ? (
                          <img
                            src={
                              agentArtifacts.find((a) => a.type === "gif")?.url
                            }
                            alt="Session Preview"
                            className="rounded-lg w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src="https://placeholder.pics/svg/640x360/DEDEDE/555555/Browser%20Session%20GIF"
                            alt="Session Preview"
                            className="rounded-lg"
                          />
                        )
                      ) : (
                        <div className="text-center p-4">
                          <i className="bi bi-hourglass-split text-slate-400 text-4xl mb-2"></i>
                          <p className="text-slate-500">
                            {agent.status === AgentStatus.RUNNING
                              ? "GIF will be generated when the agent completes"
                              : "GIF not available - agent has not completed yet"}
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center p-4">
                        <i className="bi bi-camera-video-off text-slate-400 text-4xl mb-2"></i>
                        <p className="text-slate-500">
                          GIF generation was not enabled for this agent
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-800 mb-3">
                    Execution Summary
                  </h3>
                  {agent.status === AgentStatus.IDLE ||
                  agent.status === AgentStatus.PENDING ? (
                    <div className="bg-slate-50 rounded-lg p-6 text-center">
                      <i className="bi bi-hourglass text-slate-400 text-4xl mb-3"></i>
                      <h4 className="font-medium text-slate-700 mb-1">
                        Execution Not Started
                      </h4>
                      <p className="text-slate-500 text-sm">
                        The agent has not begun execution yet. Statistics will
                        appear here once the agent starts running.
                      </p>
                    </div>
                  ) : isLoadingStats ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Started</span>
                        <span className="font-medium">{agent.createdAt}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Duration</span>
                        <span className="font-medium">
                          {agent.status === AgentStatus.RUNNING
                            ? "Running..."
                            : agentStats?.formattedDuration || "Unknown"}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Steps Completed</span>
                        <span className="font-medium">
                          {`${agentStats?.stepsCompleted || 0}`} /{" "}
                          {agent.maxSteps}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Pages Visited</span>
                        <span className="font-medium">
                          {agent.status === AgentStatus.RUNNING
                            ? "Counting..."
                            : agentStats?.pagesVisited || 0}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">Token Usage</span>
                        <span className="font-medium">
                          {agent.status === AgentStatus.RUNNING
                            ? "Calculating..."
                            : agentStats?.tokenUsage.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-800">Agent Results</h3>
                {agentResults && (
                  <button
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <i className="bi bi-clipboard"></i>
                  </button>
                )}
              </div>

              {isLoadingResults ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : agentResults ? (
                <div>
                  {/* Results Summary */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Summary
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-slate-700">{agentResults.summary}</p>
                    </div>
                  </div>

                  {/* Detailed Output */}
                  {agentResults.outputText && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Detailed Output
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg overflow-auto max-h-96">
                        {agentResults.outputHtml ? (
                          <div
                            className="text-slate-700"
                            dangerouslySetInnerHTML={{
                              __html: agentResults.outputHtml,
                            }}
                          />
                        ) : (
                          <pre className="text-slate-700 whitespace-pre-wrap font-mono text-sm">
                            {agentResults.outputText}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Creation Time */}
                  {agentResults.createdAt && (
                    <div className="text-sm text-slate-500 mt-2">
                      Results generated{" "}
                      {formatDistanceToNow(new Date(agentResults.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <i className="bi bi-file-earmark-text text-slate-400 text-4xl mb-3"></i>
                  <h4 className="font-medium text-slate-700 mb-1">
                    No Results Available
                  </h4>
                  <p className="text-slate-500 text-sm">
                    {agent.status === AgentStatus.RUNNING
                      ? "The agent is currently running. Results will be available when execution completes."
                      : "The agent has not completed execution yet. Start the agent to generate results."}
                  </p>
                </div>
              )}

              {/* Artifacts Section */}
              {agentArtifacts.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-medium text-slate-800 mb-4">
                    Artifacts & Screenshots
                  </h3>

                  {/* Screenshots Grid */}
                  {agentArtifacts.filter((a) => a.type === "screenshot")
                    .length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Screenshots (
                        {
                          agentArtifacts.filter((a) => a.type === "screenshot")
                            .length
                        }
                        )
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {agentArtifacts
                          .filter((a) => a.type === "screenshot")
                          .map((screenshot) => (
                            <div
                              key={screenshot.id}
                              className="bg-slate-50 rounded-lg overflow-hidden"
                            >
                              <a
                                href={screenshot.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={screenshot.url}
                                  alt={screenshot.filename}
                                  className="w-full h-48 object-cover"
                                  loading="lazy"
                                />
                              </a>
                              <div className="p-2 flex justify-between items-center">
                                <span className="text-xs text-slate-500 truncate">
                                  {format(
                                    new Date(screenshot.createdAt),
                                    "MMM d, h:mm a"
                                  )}
                                </span>
                                <a
                                  href={screenshot.url}
                                  download={screenshot.filename}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <i className="bi bi-download"></i>
                                </a>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Other Files */}
                  {agentArtifacts.filter(
                    (a) => a.type !== "screenshot" && a.type !== "gif"
                  ).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Other Files
                      </h4>
                      <div className="space-y-2">
                        {agentArtifacts
                          .filter(
                            (a) => a.type !== "screenshot" && a.type !== "gif"
                          )
                          .map((artifact) => (
                            <div
                              key={artifact.id}
                              className="bg-slate-50 p-3 rounded-lg flex items-center"
                            >
                              <div className="mr-3 text-slate-500">
                                <i className="bi bi-file-earmark text-2xl"></i>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-800">
                                  {artifact.filename}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {artifact.contentType} •{" "}
                                  {formatFileSize(artifact.size)}
                                </div>
                              </div>
                              <a
                                href={artifact.url}
                                download={artifact.filename}
                                className="text-blue-600 hover:text-blue-800 p-2"
                              >
                                <i className="bi bi-download"></i>
                              </a>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="browser-session-timeline">
              <h3 className="font-medium text-slate-800 mb-2">
                Browsing Timeline
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                This timeline shows the URLs visited by the agent during its
                execution, along with actions performed on each page.
              </p>

              {isLoadingLogs ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : agentLogs.filter((log) => log.url).length > 0 ? (
                <div className="timeline">
                  {/* Group logs by URL */}
                  {Object.entries(
                    agentLogs
                      .filter((log) => log.url)
                      .reduce((acc, log) => {
                        // Create a key for each URL
                        if (!acc[log.url!]) {
                          acc[log.url!] = {
                            url: log.url,
                            firstVisit: log.timestamp,
                            logs: [],
                            actions: [],
                            screenshot: null,
                          };
                        }

                        const entry = acc[log.url!];
                        entry.logs.push(log);

                        // Extract actions from log details
                        if (log.details?.action) {
                          entry.actions.push({
                            action: log.details.action,
                            timestamp: log.timestamp,
                            stepNumber: log.stepNumber,
                          });
                        }

                        // Keep the most recent screenshot for this URL
                        if (
                          log.screenshot &&
                          (!entry.screenshot ||
                            new Date(log.timestamp) >
                              new Date(entry.screenshot.timestamp))
                        ) {
                          entry.screenshot = {
                            data: log.screenshot,
                            timestamp: log.timestamp,
                          };
                        }

                        return acc;
                      }, {} as Record<string, any>)
                  )
                    .sort(
                      (a, b) =>
                        new Date(a[1].firstVisit).getTime() -
                        new Date(b[1].firstVisit).getTime()
                    )
                    .map(([url, entry], index) => (
                      <div key={url} className="relative pl-8 pb-8">
                        {/* Timeline connector */}
                        <div className="absolute left-0 top-2 bottom-0 flex flex-col items-center">
                          <div className="w-4 h-4 rounded-full bg-blue-500 z-10"></div>
                          {index <
                            Object.keys(
                              agentLogs
                                .filter((log) => log.url)
                                .reduce((acc, log) => {
                                  acc[log.url!] = true;
                                  return acc;
                                }, {} as Record<string, boolean>)
                            ).length -
                              1 && (
                            <div className="w-0.5 flex-grow bg-slate-200 -mt-2"></div>
                          )}
                        </div>

                        {/* Timeline content */}
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                          <div className="p-4 border-b border-slate-100">
                            <div className="text-xs text-slate-500 mb-1">
                              {format(new Date(entry.firstVisit), "h:mm:ss a")}
                            </div>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {url}
                            </a>
                          </div>

                          {/* Screenshot */}
                          {entry.screenshot && (
                            <div className="border-b border-slate-100">
                              <img
                                src={
                                  entry.screenshot.data.startsWith("data:")
                                    ? entry.screenshot.data
                                    : `http://localhost:3030/uploads/artifacts/${agent.id}/${entry.screenshot.data}`
                                }
                                alt={`Screenshot of ${url}`}
                                className="w-full"
                                loading="lazy"
                              />
                            </div>
                          )}

                          {/* Actions list */}
                          {entry.actions.length > 0 && (
                            <div className="p-4">
                              <h5 className="font-medium text-slate-700 text-sm mb-2">
                                Actions:
                              </h5>
                              <ul className="space-y-1">
                                {entry.actions.map(
                                  (action: TimelineAction, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start text-sm"
                                    >
                                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-2">
                                        Step {action.stepNumber}
                                      </span>
                                      <span className="text-slate-700">
                                        {action.action}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <i className="bi bi-signpost-2 text-slate-400 text-4xl mb-3"></i>
                  <h4 className="font-medium text-slate-700 mb-1">
                    No Browsing Data
                  </h4>
                  <p className="text-slate-500 text-sm">
                    {agent.status === AgentStatus.RUNNING
                      ? "The agent hasn't visited any URLs yet. Check back soon."
                      : "The agent didn't visit any URLs during its execution."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-slate-800">Execution Logs</h3>
                {agentLogs.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <select className="text-sm border border-slate-300 rounded-lg px-3 py-1.5">
                      <option value="all">All Logs</option>
                      <option value="info">Info</option>
                      <option value="action">Actions</option>
                      <option value="warning">Warnings</option>
                      <option value="error">Errors</option>
                    </select>
                    <button
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      title="Download logs"
                    >
                      <i className="bi bi-download"></i>
                    </button>
                  </div>
                )}
              </div>

              {isLoadingLogs && agentLogs.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : agentLogs.length > 0 ? (
                <div>
                  <div className="space-y-4 mb-4">
                    {agentLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`bg-white rounded-lg border shadow-sm overflow-hidden border-l-4 ${
                          log.level === "error"
                            ? "border-l-red-500"
                            : log.level === "warning"
                            ? "border-l-amber-500"
                            : log.level === "action"
                            ? "border-l-purple-500"
                            : "border-l-blue-500"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center mb-2">
                            <span className="text-xs text-slate-500 mr-2">
                              {format(
                                new Date(log.timestamp),
                                "MMM d, h:mm:ss a"
                              )}
                            </span>
                            {log.stepNumber && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded mr-2">
                                Step {log.stepNumber}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                log.level === "error"
                                  ? "bg-red-100 text-red-700"
                                  : log.level === "warning"
                                  ? "bg-amber-100 text-amber-700"
                                  : log.level === "action"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {log.level.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-slate-700 mb-2">
                            {log.message}
                          </div>

                          {/* URL display */}
                          {log.url && (
                            <div className="mb-2 bg-slate-50 p-2 rounded text-sm flex items-center">
                              <i className="bi bi-link-45deg text-slate-500 mr-1"></i>
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate"
                              >
                                {log.url}
                              </a>
                            </div>
                          )}

                          {/* Screenshot display */}
                          {log.screenshot && (
                            <div className="mt-2">
                              <details className="group">
                                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                  <i className="bi bi-image mr-1"></i>
                                  <span>View Screenshot</span>
                                  <i className="bi bi-chevron-down ml-1 group-open:rotate-180 transition-transform"></i>
                                </summary>
                                <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                                  <img
                                    src={
                                      log.screenshot.startsWith("data:")
                                        ? log.screenshot
                                        : `http://localhost:3030/uploads/artifacts/${agent.id}/${log.screenshot}`
                                    }
                                    alt="Screenshot"
                                    className="w-full"
                                    loading="lazy"
                                  />
                                </div>
                              </details>
                            </div>
                          )}

                          {/* Additional details */}
                          {log.details &&
                            Object.keys(log.details).length > 0 && (
                              <div className="mt-2">
                                <details className="group">
                                  <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800 flex items-center">
                                    <i className="bi bi-info-circle mr-1"></i>
                                    <span>Additional Details</span>
                                    <i className="bi bi-chevron-down ml-1 group-open:rotate-180 transition-transform"></i>
                                  </summary>
                                  <div className="mt-2 bg-slate-50 p-2 rounded">
                                    <pre className="text-xs text-slate-700 overflow-auto">
                                      {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load more button */}
                  {hasMoreLogs && (
                    <div className="flex justify-center mt-4">
                      <button
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
                        onClick={loadMoreLogs}
                        disabled={isLoadingLogs}
                      >
                        {isLoadingLogs ? (
                          <span className="flex items-center">
                            <i className="bi bi-arrow-repeat animate-spin mr-2"></i>{" "}
                            Loading...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <i className="bi bi-plus-circle mr-2"></i> Load More
                            Logs
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg p-6 text-center">
                  <i className="bi bi-journal text-slate-400 text-4xl mb-3"></i>
                  <h4 className="font-medium text-slate-700 mb-1">
                    No Logs Available
                  </h4>
                  <p className="text-slate-500 text-sm">
                    The agent has not started execution yet. Logs will appear
                    here once the agent begins running.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div>
              <h3 className="font-medium text-slate-800 mb-4">
                Agent Settings
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a custom name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tag
                  </label>
                  <select
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={agentTag}
                    onChange={(e) => setAgentTag(e.target.value)}
                  >
                    <option value="">No Tag</option>
                    <option value="research">Research</option>
                    <option value="websearch">Web Search</option>
                    <option value="datascraping">Data Scraping</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full px-4 py-2 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add notes about this agent run"
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <h4 className="font-medium text-slate-800">Delete Agent</h4>
                    <p className="text-slate-500 text-sm">
                      Permanently delete this agent and all its data
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    onClick={handleDeleteAgent}
                    disabled={isActionInProgress}
                  >
                    {isActionInProgress ? "Deleting..." : "Delete"}
                  </button>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    onClick={handleSaveSettings}
                    disabled={isActionInProgress}
                  >
                    {isActionInProgress ? (
                      <span className="inline-flex items-center">
                        <i className="bi bi-hourglass-split animate-spin mr-2"></i>{" "}
                        Saving...
                      </span>
                    ) : (
                      <>
                        <i className="bi bi-check-circle mr-2"></i> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default AgentDetails;
