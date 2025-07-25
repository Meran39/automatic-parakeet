// src/services/decisionManager.ts
import { Agent } from '../models/Agent';
import { LLMService } from './llm';
import { RuleEngine } from './ruleEngine';
import { ActionResponse, NamedLocation } from '../types';

export class DecisionManager {
  private llmService: LLMService;
  private ruleEngine: RuleEngine;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
    this.ruleEngine = new RuleEngine();
  }

  /**
   * エージェントの次の行動を決定します。
   * まずルールエンジンを試し、該当しなければ LLM にプロンプトを渡します。
   *
   * @param agent - 行動を決定する Agent インスタンス
   * @param currentStep - 現在のシミュレーションステップ
   * @param availableLocations - 利用可能な NamedLocation のリスト
   * @param allAgents - シミュレーション内の全エージェント
   * @param zombies - 目視可能なゾンビの状態 ({ x, y, health } の配列)
   */
  async decideAction(
    agent: Agent,
    currentStep: number,
    availableLocations: NamedLocation[],
    allAgents: Agent[],
    zombies: { x: number; y: number; health: number }[]
  ): Promise<ActionResponse> {
    // 1) ルールエンジンによる行動判定
    const ruleBasedAction = this.ruleEngine.decideAction(
      agent,
      allAgents,
      availableLocations,
      currentStep
    );
    if (ruleBasedAction) {
      console.log(
        `Agent ${agent.name} decided by rule: ${(ruleBasedAction as ActionResponse).action}`
      );
      return ruleBasedAction as ActionResponse;
    }

    // 2) LLM による行動判定
    const prompt = agent.generatePrompt(availableLocations, zombies);
    const llmResponseFromService = await this.llmService.generateAction(prompt);
    
    // Start with the response directly from LLMService
    const finalActionResponse: ActionResponse = { ...llmResponseFromService };

    // 3) メッセージ送信形式のパース
    const messageRegex = /^\[(.+?)へ\]\s*(.+)$/;
    const messageMatch = finalActionResponse.action.match(messageRegex);
    if (messageMatch) {
      finalActionResponse.isMessage = true;
      finalActionResponse.recipientName = messageMatch[1];
      finalActionResponse.messageContent = messageMatch[2];
    }

    // 4) 移動形式のパース
    const moveRegex = /^(.+?)へ移動する$/;
    const moveMatch = finalActionResponse.action.match(moveRegex);
    if (moveMatch && availableLocations.some((l) => l.name === moveMatch[1])) {
      finalActionResponse.targetLocation = moveMatch[1];
    }

    // 5) 購入形式のパース
    const purchaseRegex = /(.+?)を(\d+)Gで買う/;
    const purchaseMatch = finalActionResponse.action.match(purchaseRegex);
    if (purchaseMatch) {
      finalActionResponse.purchase = {
        itemName: purchaseMatch[1],
        cost: parseInt(purchaseMatch[2], 10),
      };
    }

    // 6) 最終的な ActionResponse を返却
    return finalActionResponse;
  }
}
