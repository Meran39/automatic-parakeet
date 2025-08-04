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

  if (!('zombies' in state) || !Array.isArray(state.zombies) || !state.zombies.every(z => typeof z === 'object' && z !== null && 'id' in z && typeof z.id === 'number' && 'x' in z && typeof z.x === 'number' && 'y' in z && typeof z.y === 'number' && 'health' in z && typeof z.health === 'number' && 'targetAgentId' in z && (typeof z.targetAgentId === 'number' || z.targetAgentId === null))) {
    return false;
  }
}
