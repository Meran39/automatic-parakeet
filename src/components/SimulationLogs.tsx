// ===============================
// src/components/SimulationLogs.tsx
// ===============================
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { SimulationLog } from '../types';

interface SimulationLogsProps {
  logs: SimulationLog[];
  onClearLogs: () => void;
}

const SimulationLogs: React.FC<SimulationLogsProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = React.useState<SimulationLog['type'] | 'all'>('all');

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });
  const getLogColor = (type: SimulationLog['type']): string => {
    const colors = {
      system: 'text-primary-300 font-bold bg-primary-900 bg-opacity-20',
      action: 'text-accent-400',
      error: 'text-secondary-400 font-bold bg-secondary-900 bg-opacity-20',
      info: 'text-primary-400',
      debug: 'text-neutral-500' // debugログの色を追加
    };
    return colors[type] || 'text-neutral-400';
  };

  const getLogIcon = (type: SimulationLog['type']): string => {
    const icons = {
      system: '🔧',
      action: '🎬',
      error: '❌',
      info: '💡',
      debug: '🐛' // debugログのアイコンを追加
    };
    return icons[type] || '📝';
  };

  return (
    <div className="bg-neutral-50 rounded-xl shadow-custom-medium p-8 border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-neutral-800">
          <MessageCircle className="text-primary-600" />
          シミュレーションログ
        </h2>
        <button
          onClick={onClearLogs}
          className="text-sm px-3 py-1 bg-neutral-600 hover:bg-neutral-700 text-white rounded transition-all duration-300 ease-in-out shadow-sm"
        >
          クリア
        </button>
      </div>
      
      <div className="mb-4 flex gap-2">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as SimulationLog['type'] | 'all')}
          className="px-2 py-1 border rounded-md text-sm bg-neutral-100 text-neutral-700 border-neutral-300 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">全てのログ</option>
          <option value="system">システム</option>
          <option value="action">行動</option>
          <option value="error">エラー</option>
          <option value="info">情報</option>
          <option value="debug">デバッグ</option> {/* debugオプションを追加 */}
        </select>
      </div>

      <div className="bg-neutral-900 text-neutral-100 rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm shadow-inner">
        {logs.length === 0 ? (
          <div className="text-neutral-500 italic">
            シミュレーションを開始してください...
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`flex items-start gap-2 p-1 rounded ${getLogColor(log.type)}`}>
                <span className="text-xs">{getLogIcon(log.type)}</span>
                <div className="flex-1">
                  <span className="text-xs text-neutral-400 font-light">[{log.timestamp}]</span>
                  {log.agentId && (
                    <span className="text-xs text-secondary-300 ml-2">[Agent-{log.agentId}]</span>
                  )}
                  <div className="mt-1">{log.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationLogs;