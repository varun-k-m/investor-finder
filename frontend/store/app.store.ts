import { create } from 'zustand';

export type AgentStage = 'searching' | 'synthesis' | 'ranking' | 'complete' | 'failed';

interface AppStore {
  currentSearchId: string | null;
  agentStage: AgentStage | null;
  agentProgress: number;
  agentMessage: string | null;
  agentLog: string[];
  setCurrentSearchId: (id: string | null) => void;
  setAgentProgress: (stage: AgentStage, pct: number, message?: string | null) => void;
  resetAgentProgress: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentSearchId: null,
  agentStage: null,
  agentProgress: 0,
  agentMessage: null,
  agentLog: [],
  setCurrentSearchId: (id) => set({ currentSearchId: id }),
  setAgentProgress: (stage, pct, message) => {
    const prev = get().agentMessage;
    const log = get().agentLog;
    // Append old message to log when a new one arrives
    const newLog =
      message && prev && prev !== message ? [prev, ...log].slice(0, 3) : log;
    set({ agentStage: stage, agentProgress: pct, agentMessage: message ?? null, agentLog: newLog });
  },
  resetAgentProgress: () =>
    set({ agentStage: null, agentProgress: 0, agentMessage: null, agentLog: [] }),
}));
