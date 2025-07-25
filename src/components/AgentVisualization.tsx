import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Agent } from '../models/Agent';
import { NamedLocation, Zombie } from '../types';

interface AgentVisualizationProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  locations: NamedLocation[];
  selectedLocationName: string | null;
  onLocationSelect: (name: string | null) => void;
  zombies: Zombie[]; // ゾンビの追加
}

const AgentVisualization: React.FC<AgentVisualizationProps> = ({
  agents,
  selectedAgent,
  onAgentSelect,
  locations,
  selectedLocationName,
  onLocationSelect,
  zombies,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 既存のg要素があればそれを使用し、なければ新しく作成
    let g: d3.Selection<SVGGElement, unknown, null, undefined> = svg.select('g.main-group');
    if (g.empty()) {
      g = svg.append('g').attr('class', 'main-group');
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8]) // ズームの範囲
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 描画前に既存の要素をクリア
    g.selectAll('*').remove();

    // Define scales (assuming a fixed map size for now, e.g., 500x400)
    const xScale = d3.scaleLinear().domain([0, 500]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, 400]).range([0, height]);

    // Draw locations
    g.selectAll<d3.BaseType, NamedLocation>('.location')
      .data(locations)
      .join('rect') // Use .join() for efficient updates
      .attr('class', 'location')
      .attr('x', d => xScale(d.x - d.width / 2)) // Adjust for size
      .attr('y', d => yScale(d.y - d.height / 2)) // Adjust for size
      .attr('width', d => xScale(d.width)) // Use actual width
      .attr('height', d => yScale(d.height)) // Use actual height
      .attr('fill', d => {
        switch (d.type) {
          case 'home': return '#aaffaa';
          case 'supermarket': return '#ffaaaa';
          case 'general_store': return '#aaffff';
          case 'park': return '#aaffaa';
          case 'work': return '#ffaaff';
          case 'library': return '#ffffaa';
          case 'cafe': return '#ffccaa';
          case 'base': return '#cccccc';
          default: return '#dddddd';
        }
      })
      .attr('opacity', 0.5)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .on('click', (_event, d: NamedLocation) => onLocationSelect(d.name === selectedLocationName ? null : d.name));

    // Add location names
    g.selectAll('.location-text')
      .data(locations)
      .join('text') // Use .join() for efficient updates
      .attr('class', 'location-text')
      .attr('x', d => xScale(d.x)) // Center text
      .attr('y', d => yScale(d.y - d.height / 2 - 10)) // Position above the rect
      .attr('text-anchor', 'middle')
      .attr('fill', '#333')
      .attr('font-size', '12px')
      .text(d => d.name);

    // Draw agents (grouped with their text)
    const agentGroup = g.selectAll<d3.BaseType, Agent>('.agent-group')
      .data(agents, d => d.id) // Key by agent ID for proper updates
      .join(
        enter => {
          const g = enter.append('g').attr('class', 'agent-group');
          g.append('circle').attr('class', 'agent');
          g.append('text').attr('class', 'agent-name-text');
          g.append('text').attr('class', 'agent-status-text');
          g.append('text').attr('class', 'agent-action-text'); // 行動テキスト
          g.append('text').attr('class', 'agent-weapon-text'); // 武器テキスト
          return g;
        },
        update => update,
        exit => exit.remove()
      )
      .attr('transform', d => {
        const location = locations.find(loc => loc.name === d.currentLocationName);
        if (location) {
          // エージェントを場所の中心に配置
          const agentX = xScale(location.x + (d.id % 2 === 0 ? 10 : -10)); // 偶数IDは右、奇数IDは左にずらす
          const agentY = yScale(location.y + (d.id % 3 === 0 ? 10 : -10)); // IDに応じて上下にずらす
          return `translate(${agentX}, ${agentY})`;
        } else {
          return `translate(${xScale(d.x)}, ${yScale(d.y)})`;
        }
      })
      .on('click', (_event, d) => onAgentSelect(d));

    agentGroup.select('.agent')
      .attr('r', 8) // Agent size
      .attr('fill', d => d.id === selectedAgent?.id ? 'yellow' : 'orange')
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    agentGroup.select('.agent-name-text')
      .attr('y', -20) // Position above the circle
      .attr('text-anchor', 'middle')
      .attr('fill', 'black')
      .attr('font-size', '12px')
      .text(d => d.name);

    agentGroup.select('.agent-status-text')
      .attr('y', 20) // Position below the circle
      .attr('text-anchor', 'middle')
      .attr('fill', 'grey')
      .attr('font-size', '10px')
      .text(d => `エ:${d.state.energy} 幸:${d.state.happiness} 空:${d.state.hunger}`); // 幸福度、空腹度を追加

    agentGroup.select('.agent-action-text')
      .attr('y', -35) // 行動テキストの位置
      .attr('text-anchor', 'middle')
      .attr('fill', 'blue')
      .attr('font-size', '10px')
      .text(d => d.state.currentAction ? `行動: ${d.state.currentAction}` : '');

    agentGroup.select('.agent-weapon-text')
      .attr('y', -45) // 武器テキストの位置
      .attr('text-anchor', 'middle')
      .attr('fill', 'brown')
      .attr('font-size', '9px')
      .text(d => d.weapon ? `武器: ${d.weapon.name}` : '');

    // Draw zombies
    console.log("AgentVisualization: Drawing zombies", zombies); // Debug log
    g.selectAll<d3.BaseType, Zombie>('.zombie')
      .data(zombies, d => d.id)
      .join(
        enter => enter.append('circle')
          .attr('class', 'zombie')
          .attr('r', 20) // Zombie size (temporarily increased)
          .attr('fill', 'red') // Zombie color (temporarily changed)
          .attr('stroke', 'black')
          .attr('stroke-width', 2),
        update => update,
        exit => exit.remove()
      )
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y));

    // Cleanup function
    return () => {
      svg.select('g.main-group').remove();
    };

  }, [agents, selectedAgent, onAgentSelect, locations, selectedLocationName, onLocationSelect, zombies]);

  return (
    <div className="bg-neutral-100 rounded-xl shadow-inner h-full border border-neutral-200 flex items-center justify-center">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default AgentVisualization;
