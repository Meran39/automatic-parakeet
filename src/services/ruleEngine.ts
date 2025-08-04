import { Agent } from '../models/Agent';
import { ActionResponse, NamedLocation } from '../types';

export class RuleEngine {
  decideAction(agent: Agent, allAgents: Agent[], availableLocations: NamedLocation[], currentStep: number): ActionResponse | null {
    // 例: エネルギーが20%以下なら休憩する
    if (agent.energy <= 20) {
      return {
        action: "待機",
        plan: "エネルギーが低下したため休憩します。",
        mood: 'tired',
        energy: 10 // エネルギーを少し回復
      } as ActionResponse;
    }

    // 例: 特定の目標がある場合、それに関連する行動を優先
    if (agent.goals.includes("地域の図書館を見つける")) {
      // ルールエンジンは具体的な行動を強制せず、LLMに判断を委ねるため、ここではnullを返す
      return null;
    }

    // プライベートな場所への侵入ルール
    // LLMが移動を決定した場合に、その場所がプライベートかどうかをチェック
    if (agent.shortTermPlan.includes('へ移動する')) {
      const moveRegex = /^\[(.*?)\]へ移動する/;
      const moveMatch = agent.shortTermPlan.match(moveRegex);
      if (moveMatch) {
        const targetLocationName = moveMatch[1];
        const targetLocation = availableLocations.find(l => l.name === targetLocationName);

        if (targetLocation && targetLocation.ownerAgentId) {
          // プライベートな場所の所有者を取得
          const ownerAgent = allAgents.find(a => a.id === targetLocation.ownerAgentId);
          if (ownerAgent) {
            const relationshipStrength = agent.relationships[ownerAgent.id.toString()] || 0;
            // 関係性が低い場合（例: 友情度が20未満）は侵入を禁止
            if (relationshipStrength < 20) {
              return {
                action: "待機", // 強制的に待機させる
                plan: "プライベートな場所への侵入は関係性が低いため断念します。",
                mood: 'neutral',
                energy: -1,
                reasoning: `Rule: Private property access denied due to low relationship with ${ownerAgent.name}.`
              } as ActionResponse;
            }
          }
        }
      }
    }

    // 新しいルール: 夜間の騒音禁止
    // 例: 50ステップ周期で、40-49ステップが夜間と仮定
    const isNightTime = currentStep % 50 >= 40;
    const noisyActions = ["歌う", "騒ぐ", "パーティー", "大声で話す"]; // 騒音とみなす行動のキーワード

    if (isNightTime && noisyActions.some(keyword => agent.shortTermPlan.includes(keyword))) {
      return {
        action: "待機", // 強制的に待機させる
        plan: "夜間なので静かにします。",
        mood: 'thoughtful', // 静かにすることで気分が落ち着く
        energy: -2, // 少しエネルギーを消費
        happiness: -5, // 騒げないことで少し不満
        reasoning: 'Rule: Noise prohibited during night time.'
      } as ActionResponse;
    }

    // 他のルールを追加...

    return null; // ルールに合致しない場合はnullを返す
  }
}
