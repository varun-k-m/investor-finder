import { create } from 'zustand';

export type AgentStage = 'searching' | 'synthesis' | 'ranking' | 'complete' | 'failed';

interface AppStore {
  currentSearchId: string | null;
  agentStage: AgentStage | null;
  agentProgress: number;
  setCurrentSearchId: (id: string | null) => void;
  setAgentProgress: (stage: AgentStage, pct: number) => void;
  resetAgentProgress: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentSearchId: null,
  agentStage: null,
  agentProgress: 0,
  setCurrentSearchId: (id) => set({ currentSearchId: id }),
  setAgentProgress: (stage, pct) => set({ agentStage: stage, agentProgress: pct }),
  resetAgentProgress: () => set({ agentStage: null, agentProgress: 0 }),
}));
