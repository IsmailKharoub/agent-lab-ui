import { useState, useEffect } from 'react'
import { Agent, PresetPrompt } from './types'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import Toolbar from './components/Toolbar'
import Dashboard from './components/Dashboard'
import AgentList from './components/AgentList'
import CreateAgentForm from './components/CreateAgentForm'
import AgentDetails from './components/AgentDetails'
import Templates from './components/Templates'
import History from './components/History'
import Settings from './components/Settings'
import apiService from './services/api'

// WebSocket connection for real-time updates
let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 2000;
let reconnectTimeout: number | null = null;
let isIntentionalClose = false;
let heartbeatInterval: number | null = null;

// Preset prompts data
const PRESET_PROMPTS: Record<string, PresetPrompt> = {
  linkedin: {
    id: "linkedin",
    title: "LinkedIn Research",
    icon: "linkedin",
    iconColor: "text-blue-500",
    tag: "Profile",
    description: "Research a specific person on LinkedIn",
    instruction: "Go to LinkedIn.com and search for 'John Smith' who works at Google. Find his profile, extract his work experience, education, and skills. Summarize his career path."
  },
  product: {
    id: "product",
    title: "Product Research",
    icon: "box-seam",
    iconColor: "text-orange-500",
    tag: "Website",
    description: "Research product features and compare with competitors",
    instruction: "Visit apple.com and research the latest MacBook Pro. Then go to dell.com and find a comparable XPS laptop. Compare their specifications, pricing, and features. Create a summary of the pros and cons of each."
  },
  news: {
    id: "news",
    title: "News Summary",
    icon: "newspaper",
    iconColor: "text-green-500",
    tag: "Current",
    description: "Find and summarize recent news articles",
    instruction: "Visit cnn.com and bbc.com. Find 3 top news stories that appear on both sites. For each story, summarize the key points and note any differences in how they are covered."
  },
  wikipedia: {
    id: "wikipedia",
    title: "Wikipedia Extract",
    icon: "wikipedia",
    iconColor: "text-slate-700",
    tag: "Info",
    description: "Extract key information from Wikipedia",
    instruction: "Go to Wikipedia and search for 'Artificial Intelligence'. Read the introduction and the 'History' section. Extract key milestones in AI development and create a timeline of major events."
  },
  social: {
    id: "social",
    title: "Social Media Analysis",
    icon: "share",
    iconColor: "text-purple-500",
    tag: "Profiles",
    description: "Analyze social media presence and engagement",
    instruction: "Visit Twitter and search for the official accounts of Microsoft, Google, and Apple. For each company, analyze their recent posts, engagement rates, and key themes they are discussing. Create a comparison of their social media strategies."
  }
};

function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize API connection and load data
  useEffect(() => {
    const initializeApi = async () => {
      try {
        setIsLoading(true);
        
        // Test API connection
        const isConnected = await apiService.testConnection();
        setIsApiConnected(isConnected);
        
        if (isConnected) {
          try {
            // Fetch agents from API
            const agentsData = await apiService.getAgents();
            setAgents(agentsData.agents);
            
            // Check if we're using development API key
            const isDevelopmentKey = localStorage.getItem('openaiApiKey') === 'development-key' || 
                                    (!localStorage.getItem('openaiApiKey') && apiService.isConfigured());
            
            if (isDevelopmentKey) {
              // Show development mode notice instead of error
              setError('⚙️ Development Mode: Using development API key. Connect to a real backend or set your OpenAI API key in Settings.');
            } else {
              setError(null);
            }
          } catch (agentError) {
            console.error('Failed to fetch agents:', agentError);
            setError('Connected to API server, but failed to fetch agents. The backend may not be fully set up.');
          }
        } else {
          setError('Failed to connect to the API server. Please check your settings and make sure the backend is running.');
        }
      } catch (err) {
        console.error('Failed to initialize API:', err);
        
        // Provide more helpful error message based on the type of error
        if (err instanceof SyntaxError && err.message.includes('JSON')) {
          setError('The API server is responding, but with invalid data format. The backend may not be fully set up.');
        } else if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Cannot reach the API server. Please make sure the backend is running and accessible.');
        } else {
          setError(`Failed to connect to the API server: ${err instanceof Error ? err.message : String(err)}`);
        }
        
        setIsApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApi();
    
    // Setup WebSocket connection for real-time updates
    const setupWebSocket = () => {
      // Clear any existing reconnect timeout and heartbeat interval
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      try {
        // Remove /api/v1 from the URL before adding /api/ws
        const baseUrl = apiService.getApiUrl().replace(/\/api\/v1$/, '');
        const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/ws';
        console.log('[App] Setting up WebSocket connection to:', wsUrl);
        
        // Reset intentional close flag when making a new connection
        isIntentionalClose = false;
        
        // Close existing socket if it exists
        if (socket) {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            isIntentionalClose = true;
            socket.close(1000, 'Closing previous connection');
          }
          socket = null;
        }
        
        socket = new WebSocket(wsUrl);
        
        const connectionTimeout = setTimeout(() => {
          if (socket && socket.readyState === WebSocket.CONNECTING) {
            console.log('[App] WebSocket connection timeout');
            isIntentionalClose = true;
            socket.close(1000, 'Connection timeout');
            socket = null;
            reconnectWithBackoff();
          }
        }, 5000);
        
        socket.onopen = () => {
          console.log('[App] WebSocket connection established');
          clearTimeout(connectionTimeout);
          setIsWebSocketConnected(true);
          setInfoMessage('Real-time updates are active');
          reconnectAttempts = 0;
          
          // Set up heartbeat
          heartbeatInterval = window.setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(JSON.stringify({ event: 'ping' }));
              } catch (error) {
                console.error('[App] Error sending ping:', error);
                if (heartbeatInterval) {
                  clearInterval(heartbeatInterval);
                  heartbeatInterval = null;
                }
                if (socket.readyState === WebSocket.OPEN) {
                  socket.close();
                }
                reconnectWithBackoff();
              }
            }
          }, 15000);
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[App] Received WebSocket message:', data);
            
            if (data.event === 'pong') {
              console.log('[App] Received pong - connection alive');
              reconnectAttempts = 0;
              return;
            }
            
            // Dispatch custom events for the AgentDetails component
            if (data.event === 'agent-status-update' || 
                data.event === 'agent-log-update' || 
                data.event === 'agent-result-update' || 
                data.event === 'agent-navigation-update' || 
                data.event === 'agent-screenshot-update') {
              console.log(`[App] Dispatching ${data.event} event:`, data);
              window.dispatchEvent(new CustomEvent(data.event, { detail: data }));
              
              // Update agent status in the list if it's a status update
              if (data.event === 'agent-status-update') {
                setAgents(prevAgents => 
                  prevAgents.map(agent => 
                    agent.id === data.agentId 
                      ? { ...agent, status: data.status, currentStep: data.currentStep } 
                      : agent
                  )
                );
              }
            }
          } catch (error) {
            console.error('[App] Error parsing WebSocket message:', error);
          }
        };
        
        socket.onerror = (error) => {
          console.error('[App] WebSocket error:', error);
          clearTimeout(connectionTimeout);
          setIsWebSocketConnected(false);
          reconnectWithBackoff();
        };
        
        socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log(`[App] WebSocket connection closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}, intentional=${isIntentionalClose}`);
          setIsWebSocketConnected(false);
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          
          if (!isIntentionalClose && event.code !== 1000 && event.code !== 1001) {
            reconnectWithBackoff();
          }
        };
      } catch (error) {
        console.error('[App] Error setting up WebSocket:', error);
        reconnectWithBackoff();
      }
    };
    
    // Helper function for reconnection with backoff
    const reconnectWithBackoff = () => {
      // Increment attempts if not at max
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        // Use exponential backoff with a max of 30 seconds, but start with a faster reconnect
        const backoffDelay = RECONNECT_DELAY * Math.min(Math.pow(1.5, reconnectAttempts - 1), 15);
        console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffDelay/1000} seconds...`);
        
        // Clear any existing timeout to prevent multiple reconnection attempts
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        reconnectTimeout = window.setTimeout(setupWebSocket, backoffDelay);
        
        // Show reconnecting message
        setInfoMessage(`Reconnecting to real-time updates (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      } else {
        console.log('Maximum WebSocket reconnection attempts reached, retrying with a longer delay');
        // Even after max attempts, try again after a much longer delay (60 seconds)
        // This keeps trying to reconnect indefinitely but with a much longer interval
        reconnectTimeout = window.setTimeout(() => {
          reconnectAttempts = 0; // Reset counter for a fresh start
          setupWebSocket();
        }, 60000);
        
        setInfoMessage('Connection lost. Still trying to reconnect...');
      }
    };
    
    if (apiService.isConfigured()) {
      setupWebSocket();
    }
    
    // Handle page visibility changes to manage the WebSocket connection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page is now visible, check connection status
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          console.log('Page became visible, reestablishing WebSocket connection');
          setupWebSocket();
        } else {
          // Connection exists, send a ping to verify it's still working
          try {
            socket.send(JSON.stringify({ event: 'ping' }));
          } catch (error) {
            console.error('Error sending visibility check ping:', error);
            // Force reconnection if ping fails
            setupWebSocket();
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also reconnect on network status changes
    window.addEventListener('online', () => {
      console.log('Network is online, reconnecting WebSocket');
      setupWebSocket();
    });
    
    // Cleanup WebSocket on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', setupWebSocket);
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      if (socket) {
        // Set flags and ensure proper closing
        isIntentionalClose = true;
        try {
          // Only try to close if it's open or connecting
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close(1000, 'page-navigation');
          }
        } catch (error) {
          console.error('Error closing socket:', error);
        }
        socket = null;
      }
      
      // Reset reconnection attempts
      reconnectAttempts = 0;
    };
  }, []);

  // Subscribe to agent updates via WebSocket
  const subscribeToAgentUpdates = (agentId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        console.log(`[App] Subscribing to agent updates for ${agentId}`);
        socket.send(JSON.stringify({
          event: 'subscribe-to-agent',
          data: agentId
        }));
      } catch (error) {
        console.error('Error subscribing to agent updates:', error);
      }
    }
  };

  // Unsubscribe from agent updates
  const unsubscribeFromAgentUpdates = (agentId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        console.log(`[App] Unsubscribing from agent updates for ${agentId}`);
        socket.send(JSON.stringify({
          event: 'unsubscribe-from-agent',
          data: agentId
        }));
      } catch (error) {
        console.error('Error unsubscribing from agent updates:', error);
      }
    }
  };

  // Handle new agent creation
  const handleCreateAgent = async (newAgent: Omit<Agent, 'id' | 'status' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      
      // Create new agent via API
      const createdAgent = await apiService.createAgent({
        instruction: newAgent.instruction,
        model: newAgent.model,
        maxSteps: newAgent.maxSteps,
        headless: newAgent.headless,
        useVision: newAgent.useVision,
        generateGif: newAgent.generateGif,
        browserSize: newAgent.browserSize
      });
      
      // Add to local state, ensuring there are no duplicates
      setAgents(prevAgents => {
        // Check if an agent with this ID already exists
        const exists = prevAgents.some(agent => agent.id === createdAgent.id);
        if (exists) {
          // Replace the existing agent with the new one
          return prevAgents.map(agent => 
            agent.id === createdAgent.id ? createdAgent : agent
          );
        } else {
          // Add the new agent to the beginning of the list
          return [createdAgent, ...prevAgents];
        }
      });
      
      // Navigate to the agent list view
      navigate('/agents');
      
      // Subscribe to updates for this agent
      subscribeToAgentUpdates(createdAgent.id);
      
      return createdAgent;
    } catch (err) {
      console.error('Failed to create agent:', err);
      setError('Failed to create agent. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing agent details
  const handleViewAgentDetails = (agentId: string) => {
    // Subscribe to updates for this agent
    subscribeToAgentUpdates(agentId);
    navigate(`/agents/${agentId}`);
  };

  // Handle agent action (start, stop, pause, resume)
  const handleAgentAction = async (agentId: string, action: 'start' | 'stop' | 'pause' | 'resume') => {
    try {
      setIsLoading(true);
      
      let updatedAgent: Agent;
      
      // Perform the requested action
      switch (action) {
        case 'start':
          updatedAgent = await apiService.startAgent(agentId);
          break;
        case 'stop':
          updatedAgent = await apiService.stopAgent(agentId);
          break;
        case 'pause':
          updatedAgent = await apiService.pauseAgent(agentId);
          break;
        case 'resume':
          updatedAgent = await apiService.resumeAgent(agentId);
          break;
      }
      
      // Update the agent in the local state
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === agentId ? updatedAgent : agent
        )
      );
      
      return updatedAgent;
    } catch (err) {
      console.error(`Failed to ${action} agent:`, err);
      setError(`Failed to ${action} agent. Please try again.`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting an agent
  const handleDeleteAgent = async (agentId: string) => {
    try {
      setIsLoading(true);
      
      // Delete the agent via API
      await apiService.deleteAgent(agentId);
      
      // Remove from local state
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
      
      // Unsubscribe from updates
      unsubscribeFromAgentUpdates(agentId);
      
      return true;
    } catch (err) {
      console.error('Failed to delete agent:', err);
      setError('Failed to delete agent. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Toolbar */}
      <Toolbar isApiConnected={isApiConnected} isWebSocketConnected={isWebSocketConnected} />
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 text-sm border-b border-red-200">
          <div className="max-w-5xl mx-auto flex items-center">
            <i className="bi bi-exclamation-triangle-fill mr-2"></i>
            {error}
            <button 
              className="ml-auto text-red-500 hover:text-red-700"
              onClick={() => setError(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Info Message */}
      {infoMessage && (
        <div className="bg-green-50 text-green-700 p-3 text-sm border-b border-green-200">
          <div className="max-w-5xl mx-auto flex items-center">
            <i className="bi bi-info-circle-fill mr-2"></i>
            {infoMessage}
            <button 
              className="ml-auto text-green-500 hover:text-green-700"
              onClick={() => setInfoMessage(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 h-1">
          <div className="h-full bg-blue-300 animate-pulse"></div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard agents={agents} setAgents={setAgents} />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/agents" element={<AgentList agents={agents} onViewDetails={handleViewAgentDetails} />} />
          <Route path="/agents/:agentId" element={<AgentDetailsWrapper 
            agents={agents} 
            onAgentAction={handleAgentAction}
            onDeleteAgent={handleDeleteAgent}
          />} />
          <Route path="/create" element={<CreateAgentForm presetPrompts={PRESET_PROMPTS} onCreateAgent={handleCreateAgent} />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      
      {/* Footer - Simplified for desktop app feel */}
      <div className="bg-slate-800 text-slate-400 py-1.5 px-4 text-xs flex justify-between items-center">
        <div>
          <span className="font-medium">Ismail Kharoub</span> • 2025 confidential
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/ismail-kharoub" target="_blank" className="text-slate-400 hover:text-blue-400 transition-colors">
            <i className="bi bi-github"></i>
          </a>
          <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
            <i className="bi bi-shield-lock"></i>
          </a>
          <span><span className="text-amber-400 font-medium">α</span> Version 1.0.0</span>
        </div>
      </div>
    </div>
  )
}

// Wrapper component to handle agent details with URL params
function AgentDetailsWrapper({ 
  agents, 
  onAgentAction,
  onDeleteAgent
}: { 
  agents: Agent[];
  onAgentAction: (agentId: string, action: 'start' | 'stop' | 'pause' | 'resume') => Promise<Agent | null>;
  onDeleteAgent: (agentId: string) => Promise<boolean>;
}) {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);
  
  // Use useEffect to avoid state updates during render
  useEffect(() => {
    if (agentId && agents.length > 0 && !agents.some(agent => agent.id === agentId)) {
      console.warn(`Agent with ID ${agentId} not found in agents array`);
      setNotFound(true);
    } else {
      setNotFound(false);
    }
  }, [agentId, agents]);
  
  // Handle the case when agent is not found
  if (notFound) {
    return <Navigate to="/agents" replace />;
  }
  
  // Find the agent in the agents array
  const selectedAgent = agentId 
    ? agents.find(agent => agent.id === agentId) 
    : null;
  
  // If agent is not found, show a loading state or navigate back
  if (!selectedAgent) {
    // If agents array is empty, we might still be loading
    if (agents.length === 0) {
      return <div className="p-6">Loading agent details...</div>;
    }
    // Otherwise, navigate back to the agents list
    return <Navigate to="/agents" replace />;
  }
  
  // Return AgentDetails with a unique key based on both the agent ID and current status
  return (
    <AgentDetails 
      key={`${selectedAgent.id}-${selectedAgent.status}`}
      agent={selectedAgent} 
      onBack={() => navigate('/agents')}
      onAgentAction={onAgentAction}
      onDeleteAgent={onDeleteAgent}
    />
  );
}

export default App
