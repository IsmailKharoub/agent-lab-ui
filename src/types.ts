// Define agent status enum
export enum AgentStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED",
  IDLE = "IDLE"
}

// Define browser size options
export type BrowserSize = "mobile" | "tablet" | "pc";

// Define agent interface
export interface Agent {
  id: string;
  instruction: string;
  status: AgentStatus;
  createdAt: string;
  model: string;
  maxSteps: number;
  headless: boolean;
  useVision: boolean;
  generateGif: boolean;
  browserSize: BrowserSize;
}

// Define preset prompt interface
export interface PresetPrompt {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  tag: string;
  description: string;
  instruction: string;
}

// Define credential interface
export interface Credential {
  id: string;
  service: string;
  username: string;
  password: string;
  isActive: boolean;
}

// Define window interface to include electron
declare global {
  interface Window {
    electron?: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
} 