
import React from 'react';
import { FixedSizeList } from 'react-window';
import { SimulationLog } from '../types';

import { useSimulationContext } from '../context/SimulationContext';

const SimulationLogs: React.FC = () => {
  const { logs, clearLogs } = useSimulationContext();
  const getLogColor = (type: SimulationLog['type']) => {
    switch (type) {
      case 'system':
        return 'text-primary-500';
      case 'action':
        return 'text-accent-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-neutral-600';
      default:
        return 'text-neutral-800';
    }
  };

  

  return (
    <div className="bg-neutral-50 shadow-custom-medium rounded-lg p-4 space-y-2 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-primary-600">シミュレーションログ</h3>
        <button onClick={clearLogs} className="text-sm text-neutral-500 hover:text-neutral-800">
          クリア
        </button>
      </div>
      <div className="flex-grow bg-neutral-50 rounded-md p-2">
        <FixedSizeList
          height={200} // ログ表示エリアの高さに合わせて調整
          itemCount={logs.length}
          itemData={logs}
          itemSize={20} // 各ログ行の高さに合わせて調整
          width="100%"
        >
          {({ index, style, data }) => {
            const log = data[index];
            return (
              <div style={style} className={`text-sm ${getLogColor(log.type)}`}>
                <span className="font-mono text-xs">[{log.timestamp}]</span>
                <span className="font-semibold"> [{log.type.toUpperCase()}]</span>
                {log.agentId && <span className="font-semibold"> (Agent {log.agentId})</span>}
                : {log.message}
              </div>
            );
          }}
        </FixedSizeList>
      </div>
    </div>
  );
};

export default React.memo(SimulationLogs);
