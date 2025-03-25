import React, { useState } from 'react';
import { Agent, AgentStatus } from '../types';

// Extend the Agent type for history entries
interface HistoryEntry extends Agent {
  executionTime: string;
  tokenUsage: number;
  pagesVisited: number;
}

// Generate mock history data
const generateMockHistory = (): HistoryEntry[] => {
  // Base agents
  const baseAgents: Agent[] = [
    {
      id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
      instruction: "Go to GitHub and search for React repositories with more than 10,000 stars. List the top 5 with their descriptions and star counts.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-25 09:32:15",
      model: "gpt-4o",
      maxSteps: 30,
      headless: false,
      useVision: true,
      generateGif: true
    },
    {
      id: "7c84fb90-12c4-11e1-840d-7b25c5ee775b",
      instruction: "Search for 'best restaurants in San Francisco' and compile a list of the top 10 based on reviews and ratings. For each restaurant, note the cuisine, price range, and a brief description.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-25 09:20:10",
      model: "gpt-4o",
      maxSteps: 30,
      headless: true,
      useVision: true,
      generateGif: false
    },
    {
      id: "8c84fb90-12c4-11e1-840d-7b25c5ee775c",
      instruction: "Visit Wikipedia and search for the 'Solar System'. Extract key information about each planet including size, position from the sun, and unique characteristics.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-25 08:45:30",
      model: "gpt-3.5-turbo",
      maxSteps: 25,
      headless: false,
      useVision: true,
      generateGif: true
    },
    {
      id: "9c84fb90-12c4-11e1-840d-7b25c5ee775d",
      instruction: "Go to Coursera.org and find the top-rated courses on machine learning. Create a list of 5 courses with their instructors, universities, and brief descriptions.",
      status: AgentStatus.FAILED,
      createdAt: "2024-03-24 15:20:45",
      model: "gpt-4-turbo",
      maxSteps: 20,
      headless: false,
      useVision: false,
      generateGif: true
    },
    {
      id: "ac84fb90-12c4-11e1-840d-7b25c5ee775e",
      instruction: "Search for information about climate change on credible science websites. Compile key findings and statistics from at least 3 different sources.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-24 10:15:30",
      model: "gpt-4o",
      maxSteps: 35,
      headless: true,
      useVision: true,
      generateGif: true
    },
    {
      id: "bc84fb90-12c4-11e1-840d-7b25c5ee775f",
      instruction: "Visit Tesla.com and collect information about their current vehicle models. Compare specifications, pricing, and features.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-23 14:20:10",
      model: "gpt-4o",
      maxSteps: 25,
      headless: false,
      useVision: true,
      generateGif: true
    },
    {
      id: "cc84fb90-12c4-11e1-840d-7b25c5ee775g",
      instruction: "Research the top 5 AI research labs. Find information about their key projects, research areas, and recent publications.",
      status: AgentStatus.FAILED,
      createdAt: "2024-03-22 11:30:25",
      model: "gpt-3.5-turbo",
      maxSteps: 30,
      headless: true,
      useVision: false,
      generateGif: false
    },
    {
      id: "dc84fb90-12c4-11e1-840d-7b25c5ee776h",
      instruction: "Analyze the homepages of major tech companies (Apple, Google, Microsoft). Compare their design, messaging, and user experience.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-21 16:45:20",
      model: "gpt-4o",
      maxSteps: 40,
      headless: false,
      useVision: true,
      generateGif: true
    },
    {
      id: "ec84fb90-12c4-11e1-840d-7b25c5ee776i",
      instruction: "Visit Stack Overflow and find the top questions about JavaScript promises. Summarize the most common issues and their solutions.",
      status: AgentStatus.COMPLETED,
      createdAt: "2024-03-20 09:10:15",
      model: "gpt-4-turbo",
      maxSteps: 30,
      headless: true,
      useVision: true,
      generateGif: false
    },
    {
      id: "fc84fb90-12c4-11e1-840d-7b25c5ee776j",
      instruction: "Search for coding bootcamps in the United States. Compare their curricula, pricing, duration, and job placement rates.",
      status: AgentStatus.FAILED,
      createdAt: "2024-03-18 13:25:40",
      model: "gpt-3.5-turbo",
      maxSteps: 35,
      headless: false,
      useVision: false,
      generateGif: true
    }
  ];
  
  // Extend base agents to history entries
  return baseAgents.map(agent => {
    const executionTimeMin = Math.floor(Math.random() * 5) + 1;
    const executionTimeSec = Math.floor(Math.random() * 50) + 10;
    
    return {
      ...agent,
      executionTime: `${executionTimeMin}m ${executionTimeSec}s`,
      tokenUsage: Math.floor(Math.random() * 8000) + 2000,
      pagesVisited: Math.floor(Math.random() * 10) + 1
    };
  });
};

const History: React.FC = () => {
  const [historyEntries] = useState<HistoryEntry[]>(generateMockHistory());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'model' | 'executionTime' | 'tokenUsage'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter and sort history entries
  const filteredAndSortedEntries = historyEntries
    .filter(entry => {
      const matchesSearch = entry.instruction.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'model') {
        return sortDirection === 'asc'
          ? a.model.localeCompare(b.model)
          : b.model.localeCompare(a.model);
      } else if (sortBy === 'executionTime') {
        const getTimeInSeconds = (time: string) => {
          const [min, sec] = time.split('m ');
          return parseInt(min) * 60 + parseInt(sec);
        };
        return sortDirection === 'asc'
          ? getTimeInSeconds(a.executionTime) - getTimeInSeconds(b.executionTime)
          : getTimeInSeconds(b.executionTime) - getTimeInSeconds(a.executionTime);
      } else if (sortBy === 'tokenUsage') {
        return sortDirection === 'asc'
          ? a.tokenUsage - b.tokenUsage
          : b.tokenUsage - a.tokenUsage;
      }
      return 0;
    });
  
  // Toggle sort direction when clicking the same column
  const handleSortChange = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc'); // Default to descending when changing columns
    }
  };
  
  // Get status badge styles
  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.RUNNING:
        return {
          background: 'bg-blue-100',
          text: 'text-blue-700',
          label: 'Running',
          icon: <span className="animate-pulse mr-2 h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
        };
      case AgentStatus.PENDING:
        return {
          background: 'bg-amber-100',
          text: 'text-amber-700',
          label: 'Pending',
          icon: <span className="animate-pulse mr-2 h-2.5 w-2.5 bg-amber-500 rounded-full"></span>
        };
      case AgentStatus.COMPLETED:
        return {
          background: 'bg-green-100',
          text: 'text-green-700',
          label: 'Completed',
          icon: <i className="bi bi-check-circle-fill mr-2 text-green-600"></i>
        };
      case AgentStatus.FAILED:
        return {
          background: 'bg-red-100',
          text: 'text-red-700',
          label: 'Failed',
          icon: <i className="bi bi-x-circle-fill mr-2 text-red-600"></i>
        };
    }
  };
  
  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return <i className="bi bi-arrow-down-up text-slate-400 ml-1"></i>;
    return sortDirection === 'asc' 
      ? <i className="bi bi-arrow-up text-blue-600 ml-1"></i>
      : <i className="bi bi-arrow-down text-blue-600 ml-1"></i>;
  };
  
  return (
    <div className="p-6 max-w-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Execution History</h1>
        <p className="text-slate-500">View and analyze your past agent executions</p>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setStatusFilter(AgentStatus.COMPLETED)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === AgentStatus.COMPLETED ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <i className="bi bi-check-circle-fill mr-1"></i> Completed
          </button>
          <button 
            onClick={() => setStatusFilter(AgentStatus.FAILED)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === AgentStatus.FAILED ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <i className="bi bi-x-circle-fill mr-1"></i> Failed
          </button>
          <button 
            onClick={() => setStatusFilter(AgentStatus.RUNNING)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === AgentStatus.RUNNING ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <i className="bi bi-play-circle-fill mr-1"></i> Running
          </button>
          <button 
            onClick={() => setStatusFilter(AgentStatus.PENDING)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === AgentStatus.PENDING ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <i className="bi bi-hourglass-split mr-1"></i> Pending
          </button>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search history..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="bi bi-search absolute right-3 top-2.5 text-slate-400"></i>
        </div>
      </div>
      
      {/* History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSortChange('date')}
                  >
                    Date {getSortIcon('date')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSortChange('model')}
                  >
                    Model {getSortIcon('model')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSortChange('executionTime')}
                  >
                    Time {getSortIcon('executionTime')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <button 
                    className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleSortChange('tokenUsage')}
                  >
                    Tokens {getSortIcon('tokenUsage')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedEntries.map(entry => {
                const statusBadge = getStatusBadge(entry.status);
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {entry.createdAt}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800">
                      <div className="flex items-start">
                        <div className="h-9 w-9 rounded bg-blue-100 text-blue-700 flex items-center justify-center mr-3 flex-shrink-0">
                          <i className="bi bi-robot"></i>
                        </div>
                        <div>
                          <div className="font-medium">Agent {entry.id.substring(0, 8)}...</div>
                          <div className="text-slate-500 text-xs line-clamp-1 mt-0.5 max-w-xs">
                            {entry.instruction}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.background} ${statusBadge.text}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <i className="bi bi-cpu mr-2 text-blue-500"></i>
                        {entry.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <i className="bi bi-clock mr-2 text-slate-400"></i>
                        {entry.executionTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center">
                        <i className="bi bi-lightning-charge mr-2 text-amber-500"></i>
                        {entry.tokenUsage.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 px-2 py-1">
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                        <button className="text-blue-600 hover:text-blue-900 px-2 py-1">
                          <i className="bi bi-eye"></i>
                        </button>
                        <button className="text-red-600 hover:text-red-900 px-2 py-1">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedEntries.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <i className="bi bi-calendar-x text-2xl text-slate-400"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">No history entries found</h3>
            <p className="text-slate-500">Try changing your search or filter criteria</p>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">Total Agents</div>
          <div className="text-2xl font-bold text-slate-800">{historyEntries.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-slate-800">
            {`${Math.round((historyEntries.filter(e => e.status === AgentStatus.COMPLETED).length / historyEntries.length) * 100)}%`}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">Total Token Usage</div>
          <div className="text-2xl font-bold text-slate-800">
            {historyEntries.reduce((sum, entry) => sum + entry.tokenUsage, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="text-slate-500 text-sm mb-1">Avg. Execution Time</div>
          <div className="text-2xl font-bold text-slate-800">2m 45s</div>
        </div>
      </div>
    </div>
  );
};

export default History; 