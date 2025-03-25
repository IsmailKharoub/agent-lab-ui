import { Agent, AgentStatus, PresetPrompt, Credential } from '../types';

// Default API configuration
const DEFAULT_API_URL = 'http://localhost:3030/api/v1';
const DEVELOPMENT_API_KEY = 'development-key';

// API Service class for handling all backend communication
class ApiService {
  private apiUrl: string;
  private apiKey: string | null;
  
  constructor() {
    // Initialize with values from localStorage or defaults
    this.apiUrl = localStorage.getItem('apiUrl') || DEFAULT_API_URL;
    this.apiKey = localStorage.getItem('openaiApiKey') || DEVELOPMENT_API_KEY;
  }
  
  // Update API configuration
  setConfig(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('openaiApiKey', apiKey);
  }
  
  // Get the API URL
  getApiUrl(): string {
    return this.apiUrl;
  }
  
  // Check if the API is properly configured
  isConfigured(): boolean {
    // API is configured if there's any API key (including the development key)
    return !!this.apiKey;
  }
  
  // Helper method for API requests
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Set up default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    // Add API key if available
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }
    
    // Make the request
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers,
      });
      
      let data: any;
      try {
        // Try to parse as JSON
        data = await response.json();
      } catch (parseError) {
        // If parsing fails, get the text and wrap it in a compatible object structure
        const text = await response.text();
        data = {
          status: response.ok ? 'success' : 'error',
          data: { rawText: text },
          message: text
        };
      }
      
      // Handle error responses
      if (!response.ok) {
        throw new Error(data.message || 'An error occurred while making the request');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      // Handle the root endpoint specially since it returns plain text
      const response = await fetch(`${this.apiUrl}/`, {
        method: 'GET',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {}
      });
      
      // Check if response is ok, don't try to parse it as JSON
      if (response.ok) {
        const text = await response.text();
        console.log('API connection test successful, response:', text);
        return true;
      } else {
        console.error('API connection test failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
  
  // ===== AGENT ENDPOINTS =====
  
  // Get all agents
  async getAgents(params?: {
    limit?: number;
    offset?: number;
    status?: AgentStatus;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ agents: Agent[]; total: number; limit: number; offset: number }> {
    // Build query string from params
    const queryParams = params
      ? Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';
    
    const query = queryParams ? `?${queryParams}` : '';
    
    try {
      const response = await this.request<{
        status: string;
        data?: { 
          agents?: Agent[]; 
          items?: Agent[];  // Some APIs use "items" instead of "agents"
          total?: number; 
          limit?: number; 
          offset?: number;
        };
      }>(`/agents${query}`);
      
      console.log('Agents API response:', response);
      
      // Handle different response structures
      if (!response.data) {
        console.warn('API returned no data for agents', response);
        return {
          agents: [],
          total: 0,
          limit: params?.limit || 10,
          offset: params?.offset || 0
        };
      }
      
      // Check if agents are under "agents" or "items" property
      const agentsList = response.data.agents || response.data.items || [];
      
      return {
        agents: agentsList,
        total: response.data.total || agentsList.length,
        limit: response.data.limit || params?.limit || 10,
        offset: response.data.offset || params?.offset || 0
      };
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Return empty array instead of throwing
      return {
        agents: [],
        total: 0,
        limit: params?.limit || 10,
        offset: params?.offset || 0
      };
    }
  }
  
  // Get agent by ID
  async getAgentById(id: string): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}`);
    return response.data.agent;
  }
  
  // Create a new agent
  async createAgent(agent: {
    instruction: string;
    model: string;
    maxSteps: number;
    headless: boolean;
    useVision: boolean;
    generateGif: boolean;
    browserSize: string;
  }): Promise<Agent> {
    // Map the frontend property names to what the API expects
    const apiAgent = {
      instruction: agent.instruction,
      modelName: agent.model, // Use 'modelName' instead of 'model' as required by API
      maxSteps: agent.maxSteps,
      headless: agent.headless,
      useVision: agent.useVision,
      generateGif: agent.generateGif,
      browserSize: agent.browserSize
    };
    
    const response = await this.request<{ status: string; data: { agent: Agent } }>('/agents', {
      method: 'POST',
      body: JSON.stringify(apiAgent),
    });
    
    return response.data.agent;
  }
  
  // Update an agent
  async updateAgent(
    id: string,
    updates: Partial<{
      instruction: string;
      model: string;
      maxSteps: number;
      headless: boolean;
      useVision: boolean;
      generateGif: boolean;
      browserSize: string;
      status: AgentStatus;
    }>
  ): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    
    return response.data.agent;
  }
  
  // Delete an agent
  async deleteAgent(id: string): Promise<void> {
    await this.request<{ status: string; message: string }>(`/agents/${id}`, {
      method: 'DELETE',
    });
  }
  
  // Start agent
  async startAgent(id: string): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}/start`, {
      method: 'POST',
    });
    
    return response.data.agent;
  }
  
  // Stop agent
  async stopAgent(id: string): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}/stop`, {
      method: 'POST',
    });
    
    return response.data.agent;
  }
  
  // Pause agent
  async pauseAgent(id: string): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}/pause`, {
      method: 'POST',
    });
    
    return response.data.agent;
  }
  
  // Resume agent
  async resumeAgent(id: string): Promise<Agent> {
    const response = await this.request<{ status: string; data: { agent: Agent } }>(`/agents/${id}/resume`, {
      method: 'POST',
    });
    
    return response.data.agent;
  }
  
  // Get agent logs
  async getAgentLogs(
    id: string,
    params?: {
      limit?: number;
      offset?: number;
      level?: string;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<{ logs: any[]; total: number; limit: number; offset: number }> {
    // Build query string from params
    const queryParams = params
      ? Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&')
      : '';
    
    const query = queryParams ? `?${queryParams}` : '';
    
    const response = await this.request<{
      status: string;
      data: { logs: any[]; total: number; limit: number; offset: number };
    }>(`/agents/${id}/logs${query}`);
    
    return response.data;
  }
  
  // Get agent results
  async getAgentResults(id: string): Promise<any> {
    const response = await this.request<{ status: string; data: { results: any } }>(`/agents/${id}/results`);
    return response.data.results;
  }
  
  // Get agent artifacts
  async getAgentArtifacts(id: string, type?: string): Promise<any[]> {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    
    const response = await this.request<{ status: string; data: { artifacts: any[] } }>(
      `/agents/${id}/artifacts${query}`
    );
    
    return response.data.artifacts;
  }
  
  // ===== PRESET PROMPTS ENDPOINTS =====
  
  // Get all preset prompts
  async getPresetPrompts(): Promise<PresetPrompt[]> {
    const response = await this.request<{ status: string; data: { presetPrompts: PresetPrompt[] } }>(
      '/preset-prompts'
    );
    
    return response.data.presetPrompts;
  }
  
  // ===== CREDENTIALS ENDPOINTS =====
  
  // Verify credentials
  async verifyCredentials(credentials: {
    service: string;
    username: string;
    password: string;
  }): Promise<boolean> {
    const response = await this.request<{ status: string; data: { valid: boolean } }>(
      '/credentials/verify',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    
    return response.data.valid;
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService; 