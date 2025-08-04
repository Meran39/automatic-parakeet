import { useCallback } from 'react';
import { Agent } from '../models/Agent';
import { NamedLocation, ItemType, Proposal, ProposalType, AttackEffect, SimulationLog } from '../types';
import { Zombie } from '../models/Zombie';

interface UseSimulationActionsProps {
  agents: Agent[];
  locations: NamedLocation[];
  zombies: Zombie[];
  addLog: (type: SimulationLog['type'], message: string, agentId?: number) => void;
  setZombies: React.Dispatch<React.SetStateAction<Zombie[]>>;
  setAttackEffects: React.Dispatch<React.SetStateAction<AttackEffect[]>>;
}

export const useSimulationActions = ({ agents, locations, zombies, addLog }: UseSimulationActionsProps) => {

  const handleMoveAction = useCallback((agent: Agent, response: any) => {
    const targetLocationName = response.targetLocation;
    const targetLocation = locations.find(l => l.name === targetLocationName);
    if (targetLocation) {
      agent.moveTo(targetLocation);
      addLog('action', `${agent.name}が${targetLocationName}へ移動開始`, agent.id);
    } else {
      addLog('error', `${agent.name}が不明な場所 ${targetLocationName} へ移動しようとしました。`, agent.id);
    }
  }, [locations, addLog]);

  const handleWaitAction = useCallback((agent: Agent) => {
    agent.adjustEnergy(5); // エネルギーを少し回復
    addLog('action', `${agent.name}は休息してエネルギーを回復した。`, agent.id);
  }, [addLog]);

  const handleScavengeAction = useCallback((agent: Agent) => {
    const currentLocation = locations.find(loc => loc.name === agent.currentLocationName);
    if (currentLocation && currentLocation.resources) {
      let itemFound = false;
      for (const [item, details] of Object.entries(currentLocation.resources)) {
        if (Math.random() < details.chance) {
          const quantity = Math.floor(Math.random() * details.maxQuantity) + 1;
          agent.addItemToInventory(item as ItemType, quantity);
          addLog('action', `${agent.name}は${currentLocation.name}で${item}を${quantity}個見つけた！`, agent.id);
          itemFound = true;
          break; // 1回の探索で1種類のみ見つかる
        }
      }
      if (!itemFound) {
        addLog('action', `${agent.name}は${currentLocation.name}で物資を見つけられなかった。`, agent.id);
      }
    } else {
      addLog('info', `${agent.name}のいる場所には調達できる物資がない。`, agent.id);
    }
  }, [locations, addLog]);

  const handleGiveItemAction = useCallback((agent: Agent, response: any) => {
    const recipientAgent = agents.find(a => a.name === response.recipientName);
    const itemName = response.itemName as ItemType;

    if (recipientAgent && itemName) {
      if (agent.hasItemInInventory(itemName)) {
        agent.removeItemFromInventory(itemName);
        recipientAgent.addItemToInventory(itemName, 1); // 1つだけ渡す
        addLog('action', `${agent.name}は${recipientAgent.name}に${itemName}を渡した。`, agent.id);
      } else {
        addLog('info', `${agent.name}は${itemName}を持っていないため、${recipientAgent.name}に渡せなかった。`, agent.id);
      }
    } else {
      addLog('error', `${agent.name}はアイテムを渡す相手またはアイテムが不明なため、渡せなかった。`, agent.id);
    }
  }, [agents, addLog]);

  const handleProposeAction = useCallback((agent: Agent, response: any) => {
    const recipientAgent = agents.find(a => a.name === response.proposalRecipientName);
    if (recipientAgent && response.proposalType && response.proposalContent) {
      const newProposal: Proposal = {
        id: `prop-${Date.now()}-${agent.id}-${recipientAgent.id}`,
        senderId: agent.id,
        recipientId: recipientAgent.id,
        type: response.proposalType as ProposalType,
        content: response.proposalContent,
        status: 'pending',
        timestamp: Date.now(),
      };
      recipientAgent.pendingProposals.push(newProposal);
      addLog('action', `${agent.name}が${recipientAgent.name}に「${response.proposalType}」を提案した: ${response.proposalContent}`, agent.id);
    } else {
      addLog('error', `${agent.name}は提案の相手または内容が不明なため、提案できなかった。`, agent.id);
    }
  }, [agents, addLog]);

  const handleRespondToAction = useCallback((agent: Agent, response: any) => {
    const proposalId = response.proposalId;
    const proposalResponse = response.proposalResponse;
    const targetProposal = agent.pendingProposals.find(p => p.id === proposalId);

    if (targetProposal && proposalResponse) {
      targetProposal.status = proposalResponse === 'accept' ? 'accepted' : 'rejected';
      // 提案をpendingProposalsから削除
      agent.pendingProposals = agent.pendingProposals.filter(p => p.id !== proposalId);

      const senderAgent = agents.find(a => a.id === targetProposal.senderId);
      if (senderAgent) {
        const responseMessage = proposalResponse === 'accept'
          ? `${agent.name}はあなたの「${targetProposal.type}」の提案を承諾しました。`
          : `${agent.name}はあなたの「${targetProposal.type}」の提案を拒否しました。`;
        senderAgent.receivedMessages.push({ senderId: agent.id, recipientId: senderAgent.id, content: responseMessage, timestamp: new Date().toLocaleTimeString() });
        addLog('action', `${agent.name}が${senderAgent.name}の提案（${targetProposal.type}）を${proposalResponse === 'accept' ? '承諾' : '拒否'}した。`, agent.id);

        // 提案が承諾された場合の共同行動ロジック
        if (proposalResponse === 'accept') {
          if (targetProposal.type === '共同探索') {
            const targetLocationName = targetProposal.content.match(/「(.*?)」/)?.[1];
            const targetLocation = locations.find(loc => loc.name === targetLocationName);
            if (targetLocation) {
              agent.moveTo(targetLocation);
              senderAgent.moveTo(targetLocation);
              addLog('system', `${agent.name}と${senderAgent.name}が${targetLocation.name}への共同探索を開始した！`, agent.id);
            } else {
              addLog('error', `共同探索の場所「${targetLocationName}」が見つかりませんでした。`, agent.id);
            }
          } else if (targetProposal.type === '共同戦闘') {
            const targetZombie = zombies.length > 0 ? zombies[0] : null;
            if (targetZombie) {
              agent.moveTo({x: targetZombie.x, y: targetZombie.y, name: "zombie", type: "zombie", width: 10, height: 10, resources: {}}); // ゾンビの場所へ移動
              senderAgent.moveTo({x: targetZombie.x, y: targetZombie.y, name: "zombie", type: "zombie", width: 10, height: 10, resources: {}}); // ゾンビの場所へ移動
              addLog('system', `${agent.name}と${senderAgent.name}が共同戦闘を開始した！ターゲット: ゾンビ (ID: ${targetZombie.id})`, agent.id);
            } else {
              addLog('info', `共同戦闘を提案したが、ターゲットとなるゾンビがいなかった。`, agent.id);
            }
          } else if (targetProposal.type === '会議') {
            const targetLocationName = targetProposal.content.match(/「(.*?)」/)?.[1];
            const targetLocation = locations.find(loc => loc.name === targetLocationName);
            if (targetLocation) {
              agent.moveTo(targetLocation);
              senderAgent.moveTo(targetLocation);
              addLog('system', `${agent.name}と${senderAgent.name}が${targetLocation.name}で会議を開始した！`, agent.id);
            } else {
              addLog('error', `会議の場所「${targetLocationName}」が見つかりませんでした。`, agent.id);
            }
          }
        }
      }
    } else {
      addLog('error', `${agent.name}は不明な提案に応答しようとした。`, agent.id);
    }
  }, [agents, locations, zombies, addLog]);

  const handleAttackAction = useCallback((agent: Agent, response: any) => {
    const targetZombie = zombies.find(z => z.id === response.targetId);
    if (targetZombie && agent.weapon) {
      const damage = agent.attack(targetZombie);
      if (damage > 0) {
        targetZombie.health -= damage;
        addLog('action', `${agent.name}がゾンビ(ID: ${targetZombie.id})に${damage}のダメージを与えた！ 残り体力: ${targetZombie.health}`, agent.id);
        if (targetZombie.health <= 0) {
          addLog('system', `ゾンビ(ID: ${targetZombie.id})は倒された！`, agent.id);
          setZombies(prevZombies => prevZombies.filter(z => z.id !== targetZombie.id)); // ゾンビをリストから削除
        }
      } else {
        addLog('info', `${agent.name}はゾンビ(ID: ${targetZombie.id})を攻撃したが、射程圏外だったか武器がなかった。`, agent.id);
      }
    } else {
      addLog('error', `${agent.name}が攻撃しようとしたゾンビ(ID: ${response.targetId})が見つからないか、武器を装備していません。`, agent.id);
    }
  }, [zombies, addLog]);

  const handleSendMessageAction = useCallback((agent: Agent, response: any) => {
    const recipient = agents.find(a => a.name === response.recipientName);
    if (recipient && response.messageContent) {
      addLog('dialogue', `${agent.name} -> ${recipient.name}: 「${response.messageContent}」`, agent.id);
    } else {
      addLog('error', `${agent.name}がメッセージを送信しようとしましたが、宛先または内容が不明です。`, agent.id);
    }
  }, [agents, addLog]);

  return {
    handleMoveAction,
    handleWaitAction,
    handleScavengeAction,
    handleGiveItemAction,
    handleProposeAction,
    handleRespondToAction,
    handleAttackAction,
    handleSendMessageAction,
  };
};
