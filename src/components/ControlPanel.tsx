
import React, { useState } from 'react';
import { Play, Pause, FastForward, RotateCcw, UserPlus, Brain } from 'lucide-react';
import { Job, Weapon, WeaponType } from '../types';
import { WEAPONS } from '../config/gameData';

import { useSimulationContext } from '../context/SimulationContext';

const allWeapons: (Weapon & { name: WeaponType })[] = Object.values(WEAPONS) as (Weapon & { name: WeaponType })[];

const ControlPanel: React.FC = () => {
  const {
    isRunning,
    currentStep,
    toggleRunning,
    runSimulationStep,
    resetSimulation,
    llmService,
    llmProvider,
    setLlmProvider,
    addAgent,
    locations,
    saveSimulation,
    loadSimulation,
    simulationSpeed,
    setSimulationSpeed,
  } = useSimulationContext();

  const isProcessing = false; // 仮の値
  const totalTokensUsed = llmService?.totalTokensUsed || 0;
  const totalCost = llmService?.totalCost || 0;

  const availableLocations = locations; // コンテキストから取得した locations を使用

  const [name, setName] = useState('新しいエージェント');
  const [personality, setPersonality] = useState('友好的');
  const [initialLocationName, setInitialLocationName] = useState(availableLocations[0]?.name || '');
  const [jobName, setJobName] = useState('');
  const [jobSalary, setJobSalary] = useState(100);
  const [initialMoney, setInitialMoney] = useState(500);
  const [initialHappiness, setInitialHappiness] = useState(50);
  const [initialHunger, setInitialHunger] = useState(50);
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponType>(allWeapons[0].name);

  const handleAddAgent = () => {
    const job: Job | null = jobName ? { name: jobName, salary: jobSalary } : null;
    const weapon: Weapon | null = WEAPONS[selectedWeapon] || null;
    addAgent(name, personality, initialLocationName, job, initialMoney, initialHappiness, initialHunger, weapon);
  };

  return (
    <div className="bg-neutral-50 shadow-custom-medium rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary-600">シミュレーション制御</h3>
        <div className="flex items-center space-x-2">
          <button onClick={toggleRunning} disabled={isProcessing} className={`p-2 rounded-full ${isRunning ? 'bg-secondary-400 hover:bg-secondary-500' : 'bg-primary-500 hover:bg-primary-600'} text-white`}>
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button onClick={runSimulationStep} disabled={isRunning || isProcessing} className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white disabled:bg-neutral-300">
            <FastForward size={16} />
          </button>
          <button onClick={resetSimulation} disabled={isProcessing} className="p-2 rounded-full bg-neutral-400 hover:bg-neutral-500 text-white disabled:bg-neutral-300">
            <RotateCcw size={16} />
          </button>
          <button onClick={saveSimulation} className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white">
            保存
          </button>
          <button onClick={loadSimulation} className="p-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white">
            読込
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-600">ステップ: {currentStep}</p>
      <div className="flex items-center space-x-2">
        <label htmlFor="speed-slider" className="text-sm font-medium text-neutral-700">速度:</label>
        <input
          id="speed-slider"
          type="range"
          min="100"
          max="2000"
          step="100"
          value={simulationSpeed}
          onChange={(e) => setSimulationSpeed(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
        <span className="text-sm text-neutral-600">{simulationSpeed}ms</span>
      </div>
      <div className="flex items-center space-x-2">
        <Brain size={16} className="text-neutral-500" />
        <select value={llmProvider} onChange={(e) => setLlmProvider(e.target.value as "huggingface" | "openai" | "anthropic" | "ollama")} className="p-2 border border-neutral-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500">
          <option value="ollama">Ollama</option>
          <option value="huggingface">HuggingFace</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
      <div className="text-sm text-neutral-600">
        <p>総トークン数: {totalTokensUsed}</p>
        <p>総コスト: ${totalCost.toFixed(6)}</p>
      </div>

      <div className="pt-4 border-t border-neutral-200">
        <h4 className="text-md font-semibold text-primary-600 mb-2">新しいエージェントを追加</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <input type="text" placeholder="名前" value={name} onChange={(e) => setName(e.target.value)} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          <input type="text" placeholder="個性" value={personality} onChange={(e) => setPersonality(e.target.value)} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          <select value={initialLocationName} onChange={(e) => setInitialLocationName(e.target.value)} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
            {availableLocations.map(loc => <option key={loc.name} value={loc.name}>{loc.name}</option>)}
          </select>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <label className="text-neutral-700">初期所持金</label>
            <input type="number" placeholder="所持金" value={initialMoney} onChange={(e) => setInitialMoney(Number(e.target.value))} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <label className="text-neutral-700">初期幸福度</label>
            <input type="number" placeholder="幸福度" value={initialHappiness} onChange={(e) => setInitialHappiness(Number(e.target.value))} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <label className="text-neutral-700">初期空腹度</label>
            <input type="number" placeholder="空腹度" value={initialHunger} onChange={(e) => setInitialHunger(Number(e.target.value))} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <input type="text" placeholder="職業名" value={jobName} onChange={(e) => setJobName(e.target.value)} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          <input type="number" placeholder="給料" value={jobSalary} onChange={(e) => setJobSalary(Number(e.target.value))} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500" />
          <select value={selectedWeapon} onChange={(e) => setSelectedWeapon(e.target.value as WeaponType)} className="p-2 border border-neutral-300 rounded-md focus:ring-primary-500 focus:border-primary-500 col-span-2">
            {allWeapons.map(weapon => <option key={weapon.name} value={weapon.name}>{weapon.name} (ダメージ: {weapon.damage}, 範囲: {weapon.range})</option>)}
          </select>
        </div>
        <button onClick={handleAddAgent} className="mt-2 w-full p-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center justify-center gap-2">
          <UserPlus size={16} /> エージェントを追加
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
