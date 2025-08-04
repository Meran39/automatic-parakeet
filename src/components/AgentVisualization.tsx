import React from 'react';

import { useSimulationContext } from '../context/SimulationContext';
import AttackEffectComponent from './AttackEffect'; // AttackEffectComponent をインポート

const AgentVisualization: React.FC = () => {
  const {
    agents,
    locations,
    selectedAgent,
    setSelectedAgent,
    selectedLocationName,
    setSelectedLocationName,
    zombies,
    attackEffects = [], // attackEffects を取得し、デフォルト値を設定
  } = useSimulationContext();

  const MAP_WIDTH = 500;
  const MAP_HEIGHT = 400;

  return (
    <div className="relative w-full h-full bg-neutral-100 border border-neutral-200 rounded-lg overflow-hidden">
      <svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
        {/* Locations */}
        {locations.map((loc) => (
          <g key={loc.name} onClick={() => setSelectedLocationName(loc.name)}>
            <rect
              x={loc.x - loc.width / 2}
              y={loc.y - loc.height / 2}
              width={loc.width}
              height={loc.height}
              fill={
                selectedLocationName === loc.name
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(0, 0, 0, 0.05)'
              }
              stroke={
                selectedLocationName === loc.name
                  ? 'rgba(139, 92, 246, 1)'
                  : 'rgba(0, 0, 0, 0.1)'
              }
              strokeWidth="2"
              rx="5"
            />
            <text
              x={loc.x}
              y={loc.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-neutral-700 font-semibold text-xs pointer-events-none"
            >
              {loc.name}
            </text>
          </g>
        ))}

        {/* Agents */}
        {agents.map((agent) => (
          <g
            key={agent.id}
            transform={`translate(${agent.x}, ${agent.y})`}
            onClick={() => {
              console.log('AgentVisualization.tsx - Calling setSelectedAgent with:', agent);
              setSelectedAgent(agent);
              console.log('AgentVisualization.tsx - After setSelectedAgent call.');
            }}
            className="cursor-pointer transition-transform duration-500 ease-out"
          >
            <circle
              r="8"
              fill={
                selectedAgent?.id === agent.id
                  ? '#eab308' // amber-500
                  : '#3b82f6' // blue-500
              }
              stroke="white"
              strokeWidth="2"
            />
            <text
              y="-12"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-neutral-800 text-xs font-bold"
            >
              {agent.name}
            </text>
          </g>
        ))}

        {/* Zombies */}
        {zombies.map((zombie) => (
          <g
            key={zombie.id}
            transform={`translate(${zombie.x}, ${zombie.y})`}
            className="cursor-pointer"
          >
            <circle r="8" fill="#ef4444" />
            <text
              y="-12"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-current text-neutral-800 text-xs font-bold"
            >
              Z
            </text>
          </g>
        ))}

        {/* Attack Effects */}
        {attackEffects.map(effect => (
          <AttackEffectComponent key={effect.id} effect={effect} />
        ))}
      </svg>
    </div>
  );
};

export default AgentVisualization;