import React, { useState } from 'react';
import { Agent, AgentStatus, BrowserSize } from '../types';
import { PresetPrompt } from '../types';

interface CreateAgentFormProps {
  presetPrompts: Record<string, PresetPrompt>;
  onCreateAgent: (agent: Agent) => void;
}

const CreateAgentForm: React.FC<CreateAgentFormProps> = ({ presetPrompts, onCreateAgent }) => {
  const [instruction, setInstruction] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [maxSteps, setMaxSteps] = useState(30);
  const [headless, setHeadless] = useState(false);
  const [useVision, setUseVision] = useState(true);
  const [generateGif, setGenerateGif] = useState(true);
  const [browserSize, setBrowserSize] = useState<BrowserSize>("mobile");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = presetPrompts[presetId];
    setSelectedPreset(presetId);
    setInstruction(preset.instruction);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (instruction.trim().length < 10) return;

    const newAgent: Agent = {
      id: crypto.randomUUID(),
      instruction,
      status: AgentStatus.PENDING,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      model,
      maxSteps,
      headless,
      useVision,
      generateGif,
      browserSize
    };

    onCreateAgent(newAgent);
    resetForm();
  };

  const resetForm = () => {
    setInstruction("");
    setModel("gpt-4o");
    setMaxSteps(30);
    setHeadless(false);
    setUseVision(true);
    setGenerateGif(true);
    setBrowserSize("mobile");
    setSelectedPreset(null);
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Create New Agent</h1>
        <p className="text-slate-500">Configure your Brainess Agents Lab to automate browsing tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-800">Agent Configuration</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="instruction" className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
                  <textarea 
                    className="w-full px-4 py-3 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    id="instruction" 
                    name="instruction" 
                    rows={5} 
                    placeholder="Enter detailed instructions for the browser agent..." 
                    required
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  ></textarea>
                  {instruction.trim().length > 0 && instruction.trim().length < 10 && (
                    <div className="text-red-500 text-sm mt-1">
                      Instructions must be at least 10 characters long.
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-2">Model</label>
                    <div className="relative">
                      <select 
                        className="w-full pl-4 pr-10 py-3 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white" 
                        id="model" 
                        name="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                      >
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <i className="bi bi-chevron-down text-xs"></i>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="max_steps" className="block text-sm font-medium text-slate-700 mb-2">Max Steps</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 text-slate-700 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      id="max_steps" 
                      name="max_steps" 
                      min="5" 
                      max="100" 
                      value={maxSteps}
                      onChange={(e) => setMaxSteps(parseInt(e.target.value))}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Browser Size</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div 
                      className={`flex flex-col items-center border border-slate-300 rounded-lg p-3 cursor-pointer ${browserSize === 'mobile' ? 'bg-blue-50 border-blue-500' : 'hover:bg-slate-50'}`}
                      onClick={() => setBrowserSize('mobile')}
                    >
                      <div className="flex items-center mb-2">
                        <input 
                          type="radio" 
                          name="browserSize" 
                          id="size-mobile" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          checked={browserSize === 'mobile'} 
                          onChange={() => setBrowserSize('mobile')}
                        />
                        <label htmlFor="size-mobile" className="ml-2 text-sm font-medium text-slate-700">Mobile</label>
                      </div>
                      <div className="bg-slate-100 rounded-md p-1 flex items-center justify-center w-16 h-24">
                        <i className="bi bi-phone text-slate-500 text-lg"></i>
                      </div>
                      <span className="text-xs text-slate-500 mt-2">390x844</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center border border-slate-300 rounded-lg p-3 cursor-pointer ${browserSize === 'tablet' ? 'bg-blue-50 border-blue-500' : 'hover:bg-slate-50'}`}
                      onClick={() => setBrowserSize('tablet')}
                    >
                      <div className="flex items-center mb-2">
                        <input 
                          type="radio" 
                          name="browserSize" 
                          id="size-tablet" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          checked={browserSize === 'tablet'} 
                          onChange={() => setBrowserSize('tablet')}
                        />
                        <label htmlFor="size-tablet" className="ml-2 text-sm font-medium text-slate-700">Tablet</label>
                      </div>
                      <div className="bg-slate-100 rounded-md p-1 flex items-center justify-center w-20 h-20">
                        <i className="bi bi-tablet text-slate-500 text-lg"></i>
                      </div>
                      <span className="text-xs text-slate-500 mt-2">810x1080</span>
                    </div>
                    
                    <div 
                      className={`flex flex-col items-center border border-slate-300 rounded-lg p-3 cursor-pointer ${browserSize === 'pc' ? 'bg-blue-50 border-blue-500' : 'hover:bg-slate-50'}`}
                      onClick={() => setBrowserSize('pc')}
                    >
                      <div className="flex items-center mb-2">
                        <input 
                          type="radio" 
                          name="browserSize" 
                          id="size-pc" 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                          checked={browserSize === 'pc'} 
                          onChange={() => setBrowserSize('pc')}
                        />
                        <label htmlFor="size-pc" className="ml-2 text-sm font-medium text-slate-700">Desktop</label>
                      </div>
                      <div className="bg-slate-100 rounded-md p-1 flex items-center justify-center w-24 h-16">
                        <i className="bi bi-display text-slate-500 text-lg"></i>
                      </div>
                      <span className="text-xs text-slate-500 mt-2">1920x1080</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <button 
                    type="button" 
                    className="flex items-center text-slate-700 hover:text-blue-600 font-medium transition-colors"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  >
                    <i className={`bi bi-chevron-${isAdvancedOpen ? 'down' : 'right'} mr-2`}></i>
                    Advanced Options
                  </button>
                  
                  {isAdvancedOpen && (
                    <div className="space-y-4 mt-4 border-t border-slate-200 pt-4">
                      <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" 
                          type="checkbox" 
                          id="headless" 
                          name="headless"
                          checked={headless}
                          onChange={(e) => setHeadless(e.target.checked)}
                        />
                        <div className="ml-3">
                          <label className="font-medium text-sm text-slate-700" htmlFor="headless">Headless Mode</label>
                          <p className="text-slate-500 text-xs mt-1">Run browser in the background without UI</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" 
                          type="checkbox" 
                          id="use_vision" 
                          name="use_vision" 
                          checked={useVision}
                          onChange={(e) => setUseVision(e.target.checked)}
                        />
                        <div className="ml-3">
                          <label className="font-medium text-sm text-slate-700" htmlFor="use_vision">Use Vision</label>
                          <p className="text-slate-500 text-xs mt-1">Enable vision capabilities for screenshot analysis</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input 
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" 
                          type="checkbox" 
                          id="generate_gif" 
                          name="generate_gif" 
                          checked={generateGif}
                          onChange={(e) => setGenerateGif(e.target.checked)}
                        />
                        <div className="ml-3">
                          <label className="font-medium text-sm text-slate-700" htmlFor="generate_gif">Generate GIF</label>
                          <p className="text-slate-500 text-xs mt-1">Create animated GIF of the browser session</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    onClick={resetForm}
                  >
                    Reset
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                    disabled={instruction.trim().length < 10}
                  >
                    <i className="bi bi-play-fill mr-2"></i> Create Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Presets</h2>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                {Object.keys(presetPrompts).length}
              </span>
            </div>
            <div className="p-4">
              <p className="text-slate-600 mb-4 text-sm">Select a preset prompt to quickly create an agent:</p>
              
              <div className="space-y-3">
                {Object.values(presetPrompts).map(preset => (
                  <div 
                    key={preset.id}
                    className={`p-3 rounded-lg border shadow-sm cursor-pointer transition-all ${selectedPreset === preset.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500 hover:bg-blue-50/30 border-slate-200'}`}
                    onClick={() => handlePresetSelect(preset.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium flex items-center">
                        <i className={`bi bi-${preset.icon} ${preset.iconColor} mr-2`}></i> {preset.title}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">{preset.tag}</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">{preset.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgentForm; 