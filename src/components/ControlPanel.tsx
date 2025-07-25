// ===============================
// src/components/ControlPanel.tsx
// ===============================
import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Settings, Zap, UserPlus } from 'lucide-react';
import { Job, NamedLocation, Weapon } from '../types';

import { Brain, DollarSign } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  currentStep: number;
  onToggleRunning: () => void;
  onRunStep: () => void;
  onReset: () => void;
  isProcessing: boolean;
  llmProvider: string;
  onProviderChange: (provider: string) => void;
  onAddAgent: (name: string, personality: string, initialLocationName: string, job: Job | null, initialMoney: number, initialHappiness: number, initialHunger: number, initialWeapon: Weapon | null) => void;
  availableLocations: NamedLocation[];
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  totalTokensUsed: number; // 追加
  totalCost: number;     // 追加
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isRunning,
  currentStep,
  onToggleRunning,
  onRunStep,
  onReset,
  isProcessing,
  llmProvider,
  onProviderChange,
  onAddAgent,
  availableLocations,
  simulationSpeed,
  onSpeedChange,
  totalTokensUsed,
  totalCost
}) => {
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPersonality, setNewAgentPersonality] = useState('');
  const [newAgentLocation, setNewAgentLocation] = useState(availableLocations[0]?.name || '');
  const [newAgentJobName, setNewAgentJobName] = useState('');
  const [newAgentJobSalary, setNewAgentJobSalary] = useState('0');
  const [newAgentMoney, setNewAgentMoney] = useState('500');
  const [newAgentHappiness, setNewAgentHappiness] = useState('50');
  const [newAgentHunger, setNewAgentHunger] = useState('50');
  const [newAgentWeaponName, setNewAgentWeaponName] = useState('');
  const [newAgentWeaponDamage, setNewAgentWeaponDamage] = useState('10');
  const [newAgentWeaponRange, setNewAgentWeaponRange] = useState('10');
  const [newAgentWeaponType, setNewAgentWeaponType] = useState<'melee' | 'ranged' | ''>('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleAddAgent = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newAgentName.trim()) {
      newErrors.name = '名前は必須です。';
    }
    if (!newAgentPersonality.trim()) {
      newErrors.personality = '性格は必須です。';
    }
    if (parseInt(newAgentMoney, 10) < 0) {
      newErrors.money = '所持金は0以上である必要があります。';
    }
    if (parseInt(newAgentHappiness, 10) < 0 || parseInt(newAgentHappiness, 10) > 100) {
      newErrors.happiness = '幸福度は0から100の範囲である必要があります。';
    }
    if (parseInt(newAgentHunger, 10) < 0 || parseInt(newAgentHunger, 10) > 100) {
      newErrors.hunger = '空腹度は0から100の範囲である必要があります。';
    }
    if (newAgentJobName && parseInt(newAgentJobSalary, 10) < 0) {
      newErrors.jobSalary = '給料は0以上である必要があります。';
    }
    if (newAgentJobSalary && !newAgentJobName.trim()) {
      newErrors.jobName = '給料を設定する場合、職業名は必須です。';
    }
    if (newAgentMoney && isNaN(parseInt(newAgentMoney, 10))) {
      newErrors.money = '初期所持金は数値で入力してください。';
    }
    if (newAgentJobSalary && isNaN(parseInt(newAgentJobSalary, 10))) {
      newErrors.jobSalary = '給料は数値で入力してください。';
    }
    if (newAgentWeaponName.trim() && (!newAgentWeaponDamage || isNaN(parseInt(newAgentWeaponDamage, 10)) || parseInt(newAgentWeaponDamage, 10) <= 0)) {
      newErrors.weaponDamage = '武器のダメージは0より大きい数値である必要があります。';
    }
    if (newAgentWeaponName.trim() && (!newAgentWeaponRange || isNaN(parseInt(newAgentWeaponRange, 10)) || parseInt(newAgentWeaponRange, 10) <= 0)) {
      newErrors.weaponRange = '武器の射程は0より大きい数値である必要があります。';
    }
    if (newAgentWeaponName.trim() && !newAgentWeaponType.trim()) {
      newErrors.weaponType = '武器のタイプは必須です。';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // エラーをクリア
    const job: Job | null = newAgentJobName ? { name: newAgentJobName, salary: parseInt(newAgentJobSalary, 10) } : null;
    const weapon = newAgentWeaponName.trim() ? {
      name: newAgentWeaponName,
      damage: parseInt(newAgentWeaponDamage, 10),
      range: parseInt(newAgentWeaponRange, 10),
      type: newAgentWeaponType as 'melee' | 'ranged',
    } : null;
    onAddAgent(newAgentName, newAgentPersonality, newAgentLocation, job, parseInt(newAgentMoney, 10), parseInt(newAgentHappiness, 10), parseInt(newAgentHunger, 10), weapon);
    setNewAgentName('');
    setNewAgentPersonality('');
    setNewAgentLocation(availableLocations[0]?.name || '');
    setNewAgentJobName('');
    setNewAgentJobSalary('0');
    setNewAgentMoney('500');
    setNewAgentHappiness('50');
    setNewAgentHunger('50');
    setNewAgentWeaponName('');
    setNewAgentWeaponDamage('10');
    setNewAgentWeaponRange('10');
    setNewAgentWeaponType('');
    setShowAddAgentForm(false);
  };

  return (
    <div className="bg-neutral-50 rounded-xl shadow-custom-medium p-8 border border-neutral-100">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-neutral-800 mb-2">
          <Settings className="text-neutral-600" />
          制御パネル
        </h2>
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Zap className="w-4 h-4 text-primary-500" />
            <span>LLM: {llmProvider}</span>
            <select 
              value={llmProvider} 
              onChange={(e) => onProviderChange(e.target.value)}
              className="ml-2 px-2 py-1 border rounded-md bg-neutral-100 text-neutral-700 border-neutral-300 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="huggingface">Hugging Face</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Brain className="w-4 h-4 text-primary-500" />
            <span>総トークン使用量: {totalTokensUsed}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <DollarSign className="w-4 h-4 text-primary-500" />
            <span>総コスト: ${totalCost.toFixed(6)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onToggleRunning}
            disabled={isProcessing}
            className={`flex-grow flex items-center justify-center gap-2 px-4 py-2 text-base sm:gap-3 sm:px-8 sm:py-4 sm:text-lg rounded-lg font-semibold transition-all duration-300 ease-in-out shadow-custom-light ${
              isRunning 
                ? 'bg-secondary-500 hover:bg-secondary-600 text-white' 
                : 'bg-accent-500 hover:bg-accent-600 text-white'
            } disabled:bg-neutral-300 disabled:shadow-none`}
          >
            {isRunning ? <Pause size={20} className="sm:w-6 sm:h-6" /> : <Play size={20} className="sm:w-6 sm:h-6" />}
            {isRunning ? '停止' : '開始'}
          </button>
          
          <button
            onClick={onRunStep}
            disabled={isRunning || isProcessing}
            className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-base sm:gap-3 sm:px-8 sm:py-4 sm:text-lg bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold shadow-custom-light disabled:bg-neutral-300 disabled:shadow-none transition-all duration-300 ease-in-out"
          >
            <RefreshCw size={20} className={`sm:w-6 sm:h-6 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? '処理中...' : '1ステップ実行'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onReset}
            disabled={isRunning || isProcessing}
            className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-base sm:gap-3 sm:px-8 sm:py-4 sm:text-lg bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg font-semibold shadow-custom-light disabled:bg-neutral-300 disabled:shadow-none transition-all duration-300 ease-in-out"
          >
            <RefreshCw size={20} className="sm:w-6 sm:h-6" />
            リセット
          </button>

          <button
            onClick={() => setShowAddAgentForm(!showAddAgentForm)}
            className="flex-grow flex items-center justify-center gap-2 px-4 py-2 text-base sm:gap-3 sm:px-8 sm:py-4 sm:text-lg bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-semibold shadow-custom-light transition-all duration-300 ease-in-out"
          >
            <UserPlus size={20} className="sm:w-6 sm:h-6" />
            エージェント追加
          </button>
        </div>
        
        <div className="ml-auto text-lg font-semibold text-neutral-700">
          ステップ: {currentStep}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <label htmlFor="simulationSpeed" className="text-neutral-700 font-medium">シミュレーション速度:</label>
        <input
          type="range"
          id="simulationSpeed"
          min="1000" // 1秒
          max="10000" // 10秒
          step="1000"
          value={simulationSpeed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full h-2 bg-neutral-300 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <span className="text-neutral-700">{simulationSpeed / 1000}秒/ステップ</span>
      </div>
      
      {showAddAgentForm && (
        <div className="mt-4 p-4 border border-neutral-200 rounded-lg bg-neutral-100 shadow-inner">
          <h3 className="text-lg font-semibold mb-3 text-neutral-800">新しいエージェントを追加</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-neutral-700">名前 <span className="text-secondary-500">*</span></label>
              <input type="text" id="agentName" value={newAgentName} onChange={(e) => {setNewAgentName(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.name; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.name ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: ジョン" />
              {errors.name && <p className="text-secondary-500 text-xs mt-1">{errors.name}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの名前を入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentPersonality" className="block text-sm font-medium text-neutral-700">性格 <span className="text-secondary-500">*</span></label>
              <input type="text" id="agentPersonality" value={newAgentPersonality} onChange={(e) => {setNewAgentPersonality(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.personality; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.personality ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 陽気で社交的" />
              {errors.personality && <p className="text-secondary-500 text-xs mt-1">{errors.personality}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの基本的な性格や特徴を記述してください。</p>
            </div>
            <div>
              <label htmlFor="agentLocation" className="block text-sm font-medium text-neutral-700">初期位置</label>
              <select id="agentLocation" value={newAgentLocation} onChange={(e) => setNewAgentLocation(e.target.value)} className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-neutral-50 text-neutral-700">
                {availableLocations.map(loc => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-neutral-500">エージェントがシミュレーション開始時に存在する場所を選択してください。</p>
            </div>
            <div>
              <label htmlFor="agentMoney" className="block text-sm font-medium text-neutral-700">初期所持金 (G)</label>
              <input type="number" id="agentMoney" value={newAgentMoney} onChange={(e) => {setNewAgentMoney(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.money; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.money ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 500" />
              {errors.money && <p className="text-secondary-500 text-xs mt-1">{errors.money}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントがシミュレーション開始時に持つ所持金を設定します。0以上の数値を入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentHappiness" className="block text-sm font-medium text-neutral-700">初期幸福度 (0-100)</label>
              <input type="number" id="agentHappiness" value={newAgentHappiness} onChange={(e) => {setNewAgentHappiness(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.happiness; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.happiness ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 50" min="0" max="100" />
              {errors.happiness && <p className="text-secondary-500 text-xs mt-1">{errors.happiness}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの初期幸福度を設定します。0から100の範囲で入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentHunger" className="block text-sm font-medium text-neutral-700">初期空腹度 (0-100)</label>
              <input type="number" id="agentHunger" value={newAgentHunger} onChange={(e) => {setNewAgentHunger(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.hunger; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.hunger ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 50" min="0" max="100" />
              {errors.hunger && <p className="text-secondary-500 text-xs mt-1">{errors.hunger}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの初期空腹度を設定します。0から100の範囲で入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentHappiness" className="block text-sm font-medium text-neutral-700">初期幸福度 (0-100)</label>
              <input type="number" id="agentHappiness" value={newAgentHappiness} onChange={(e) => {setNewAgentHappiness(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.happiness; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.happiness ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 50" min="0" max="100" />
              {errors.happiness && <p className="text-secondary-500 text-xs mt-1">{errors.happiness}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの初期幸福度を設定します。0から100の範囲で入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentHunger" className="block text-sm font-medium text-neutral-700">初期空腹度 (0-100)</label>
              <input type="number" id="agentHunger" value={newAgentHunger} onChange={(e) => {setNewAgentHunger(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.hunger; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.hunger ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 50" min="0" max="100" />
              {errors.hunger && <p className="text-secondary-500 text-xs mt-1">{errors.hunger}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの初期空腹度を設定します。0から100の範囲で入力してください。</p>
            </div>
            <div className="col-span-2">
              <label htmlFor="agentJobName" className="block text-sm font-medium text-neutral-700">職業名 (任意)</label>
              <input type="text" id="agentJobName" value={newAgentJobName} onChange={(e) => {setNewAgentJobName(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.jobName; return newPrev; });}} className={`mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.jobName ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 医者" />
              {errors.jobName && <p className="text-secondary-500 text-xs mt-1">{errors.jobName}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントの職業を設定します。給料を設定する場合は必須です。</p>
            </div>
            <div className="col-span-2">
              <label htmlFor="agentJobSalary" className="block text-sm font-medium text-neutral-700">給料 (G/ステップ) (任意)</label>
              <input type="number" id="agentJobSalary" value={newAgentJobSalary} onChange={(e) => {setNewAgentJobSalary(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.jobSalary; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.jobSalary ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 100" />
              {errors.jobSalary && <p className="text-secondary-500 text-xs mt-1">{errors.jobSalary}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントが仕事で得る給料を設定します。0以上の数値を入力してください。</p>
            </div>
            <div className="col-span-2">
              <label htmlFor="agentWeaponName" className="block text-sm font-medium text-neutral-700">武器名 (任意)</label>
              <input type="text" id="agentWeaponName" value={newAgentWeaponName} onChange={(e) => {setNewAgentWeaponName(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.weaponName; return newPrev; });}} className={`mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.weaponName ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: ナイフ" />
              {errors.weaponName && <p className="text-secondary-500 text-xs mt-1">{errors.weaponName}</p>}
              <p className="mt-1 text-xs text-neutral-500">エージェントが所持する武器の名前を設定します。</p>
            </div>
            <div>
              <label htmlFor="agentWeaponDamage" className="block text-sm font-medium text-neutral-700">武器ダメージ (任意)</label>
              <input type="number" id="agentWeaponDamage" value={newAgentWeaponDamage} onChange={(e) => {setNewAgentWeaponDamage(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.weaponDamage; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.weaponDamage ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 20" />
              {errors.weaponDamage && <p className="text-secondary-500 text-xs mt-1">{errors.weaponDamage}</p>}
              <p className="mt-1 text-xs text-neutral-500">武器のダメージ量を設定します。0より大きい数値を入力してください。</p>
            </div>
            <div>
              <label htmlFor="agentWeaponRange" className="block text-sm font-medium text-neutral-700">武器射程 (任意)</label>
              <input type="number" id="agentWeaponRange" value={newAgentWeaponRange} onChange={(e) => {setNewAgentWeaponRange(e.target.value); setErrors(prev => { const newPrev = {...prev}; delete newPrev.weaponRange; return newPrev; });}} className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.weaponRange ? 'border-secondary-500' : 'border-neutral-300'}`} placeholder="例: 5" />
              {errors.weaponRange && <p className="text-secondary-500 text-xs mt-1">{errors.weaponRange}</p>}
              <p className="mt-1 text-xs text-neutral-500">武器の射程を設定します。0より大きい数値を入力してください。</p>
            </div>
            <div className="col-span-2">
              <label htmlFor="agentWeaponType" className="block text-sm font-medium text-neutral-700">武器タイプ (任意)</label>
              <select id="agentWeaponType" value={newAgentWeaponType} onChange={(e) => {setNewAgentWeaponType(e.target.value as 'melee' | 'ranged' | ''); setErrors(prev => { const newPrev = {...prev}; delete newPrev.weaponType; return newPrev; });}} className={`mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50 ${errors.weaponType ? 'border-secondary-500' : 'border-neutral-300'}`}>
                <option value="">選択してください</option>
                <option value="melee">近接</option>
                <option value="ranged">遠距離</option>
              </select>
              {errors.weaponType && <p className="text-secondary-500 text-xs mt-1">{errors.weaponType}</p>}
              <p className="mt-1 text-xs text-neutral-500">武器のタイプを選択してください。</p>
            </div>
          </div>
          <button
            onClick={handleAddAgent}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-custom-light text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 ease-in-out"
          >
            追加
          </button>
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-4 bg-primary-50 p-4 rounded-lg text-primary-700 font-medium flex items-center gap-3 shadow-inner">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span>エージェントの行動を生成中...</span>
          </div>
      )}
    </div>
  );
};

export default ControlPanel;