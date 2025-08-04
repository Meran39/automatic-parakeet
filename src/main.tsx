import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { SimulationProvider } from './context/SimulationContext';
import { NamedLocation } from './types';

const LOCATIONS: NamedLocation[] = [
  { name: '自宅', x: 100, y: 100, type: 'home', width: 50, height: 50, resources: { 'パン': { chance: 0.5, maxQuantity: 3 } } },
  { name: '公園', x: 300, y: 200, type: 'park', width: 80, height: 80, resources: {} },
  { name: '図書館', x: 150, y: 300, type: 'library', width: 60, height: 60, resources: {} },
  { name: 'スーパー', x: 400, y: 100, type: 'supermarket', width: 70, height: 70, resources: { 'パン': { chance: 0.8, maxQuantity: 5 }, '水': { chance: 0.9, maxQuantity: 10 } } },
  { name: '拠点', x: 250, y: 350, type: 'base', width: 100, height: 100, resources: { 'パン': { chance: 1.0, maxQuantity: 10 }, '水': { chance: 1.0, maxQuantity: 20 }, 'ナイフ': { chance: 0.3, maxQuantity: 1 } }, health: 500 },
];

let root = null; // root変数を宣言

const renderApp = () => {
  const container = document.getElementById('root');
  if (container) {
    if (!root) { // rootがまだ作成されていない場合のみ作成
      root = ReactDOM.createRoot(container);
    }
    root.render(
      <React.StrictMode>
        <SimulationProvider initialLocations={LOCATIONS}>
          <App />
        </SimulationProvider>
      </React.StrictMode>
    );
  }
};

renderApp(); // 初回レンダリング

// HMR（ホットモジュールリプレイスメント）による再レンダリング
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    renderApp();
  });
}