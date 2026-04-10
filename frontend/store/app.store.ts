import { create } from 'zustand';

export type AgentStage = 'parsing' | 'searching' | 'synthesis' | 'complete';

interface AppStore {
  currentSearchId: string | null;
  agentStage: AgentStage | null;
  agentProgress: number;
  setCurrentSearchId: (id: string | null) => void;
  setAgentProgress: (stage: AgentStage, pct: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentSearchId: null,
  agentStage: null,
  agentProgress: 0,
  setCurrentSearchId: (id) => set({ currentSearchId: id }),
  setAgentProgress: (stage, pct) => set({ agentStage: stage, agentProgress: pct }),
}));
