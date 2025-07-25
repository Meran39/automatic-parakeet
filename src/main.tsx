import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');

// HMR（ホットモジュールリプレイスメント）による複数回実行を防ぐため、
// ルートがすでに存在しない場合のみ作成する
if (container && !(container as any)._reactRootContainer) {
  const root = ReactDOM.createRoot(container);
  (container as any)._reactRootContainer = root;
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else if (container && (container as any)._reactRootContainer) {
    // すでにルートが存在する場合は、既存のルートで再レンダリングする
    (container as any)._reactRootContainer.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}