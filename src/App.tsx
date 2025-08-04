import React from 'react';
import { SimulationProvider } from './context/SimulationContext';
import SimulationContent from './components/SimulationContent';
import { NamedLocation } from './types';

const LOCATIONS: NamedLocation[] = [
  { name: '自宅', x: 100, y: 100, type: 'home', width: 50, height: 50, resources: {
    '水': { chance: 0.8, maxQuantity: 5 },
    'パン': { chance: 0.5, maxQuantity: 3 },
  } },
  { name: '公園', x: 300, y: 200, type: 'park', width: 80, height: 80, resources: {
    '水': { chance: 0.3, maxQuantity: 2 },
  } },
  { name: '図書館', x: 150, y: 300, type: 'library', width: 60, height: 60, resources: {
    'エナジードリンク': { chance: 0.1, maxQuantity: 1 },
  } },
  { name: 'スーパー', x: 400, y: 100, type: 'supermarket', width: 70, height: 70, resources: {
    'おにぎり': { chance: 0.7, maxQuantity: 4 },
    'フルーツジュース': { chance: 0.6, maxQuantity: 3 },
    'ピストル': { chance: 0.05, maxQuantity: 1 },
  } },
  { name: '拠点', x: 250, y: 350, type: 'base', width: 100, height: 100, resources: {},
    health: 500
  },
  { name: '病院', x: 450, y: 300, type: 'hospital', width: 80, height: 60, resources: {
    'ライフル': { chance: 0.02, maxQuantity: 1 },
    '刀': { chance: 0.05, maxQuantity: 1 },
  } },
];

const App: React.FC = () => {
  return (
    <SimulationProvider initialLocations={LOCATIONS}>
      <SimulationContent />
    </SimulationProvider>
  );
};

export default App;
