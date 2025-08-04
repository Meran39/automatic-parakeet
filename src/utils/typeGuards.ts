import { SavedSimulationState } from '../types';

export function isSavedSimulationState(obj: unknown): obj is SavedSimulationState {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const state = obj as Record<string, unknown>;

  if (!('agents' in state) || !Array.isArray(state.agents)) {
    return false;
  }

  if (!('currentStep' in state) || typeof state.currentStep !== 'number') {
    return false;
  }

  if (!('llmProvider' in state) || typeof state.llmProvider !== 'string') {
    return false;
  }

  return true;
}
