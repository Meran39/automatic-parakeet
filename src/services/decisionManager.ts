import { Agent } from '../models/Agent';
import { LLMService } from './llm';
import { NamedLocation, IZombie, ActionResponse, DecisionError } from '../types';

export class DecisionManager {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  private extractJson(text: string): string {
    const markdownMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1];
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    throw new DecisionError('LLM response does not contain a valid JSON object.');
  }

  async decideAction(
    agent: Agent,
    step: number,
    locations: NamedLocation[],
    agents: Agent[],
    zombies: IZombie[]
  ): Promise<ActionResponse> {
    const prompt = this.createPrompt(agent, step, locations, agents, zombies);
    const responseText = await this.llmService.generate(prompt);
    try {
      const jsonString = this.extractJson(responseText);
      const response = JSON.parse(jsonString);
      
      if (typeof response.energy === 'string') {
        response.energy = parseFloat(response.energy);
      }

      if (
        !response.action ||
        response.plan === undefined ||
        typeof response.mood !== 'string' ||
        typeof response.energy !== 'number'
      ) {
        throw new DecisionError('LLM response is missing required fields or has incorrect types.');
      }
      if (response.action === 'ゾンビを攻撃' && typeof response.targetId !== 'number') {
        throw new DecisionError('LLM response for attacking zombie is missing or has incorrect type for targetId.');
      }
      // 移動アクションのバリデーション
      if (response.action === '移動') {
        const locationExists = locations.some(loc => loc.name === response.targetLocation);
        if (!response.targetLocation || !locationExists) {
          throw new DecisionError(`Move action has invalid targetLocation: ${response.targetLocation}`);
        }
      }
      // 提案アクションのバリデーション
      if (response.action === '提案する') {
        if (!response.proposalType || !response.proposalRecipientName || !response.proposalContent) {
          throw new DecisionError('Proposal action is missing required fields (proposalType, proposalRecipientName, proposalContent).');
        }
      }
      // 提案への応答アクションのバリデーション
      if (response.action === '提案に応答する') {
        if (!response.proposalId || !response.proposalResponse) {
          throw new DecisionError('Respond to proposal action is missing required fields (proposalId, proposalResponse).');
        }
      }
      return response;
    } catch (error) {
      console.error('Error parsing LLM response or invalid response format:', error);
      console.error('LLM Raw Response:', responseText);
      throw new DecisionError(
        `Failed to parse LLM response or invalid format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private createPrompt(
    agent: Agent,
    step: number,
    locations: NamedLocation[],
    agents: Agent[],
    zombies: IZombie[]
  ): string {
    const locationInfo = locations.map((loc) => `${loc.name}: (${loc.x}, ${loc.y})`).join('\n');

    const otherAgentsInfo = agents
      .filter((a) => a.id !== agent.id)
      .map((a) => {
        const agentZombies = zombies.filter(z => {
            const distance = Math.sqrt(Math.pow(a.x - z.x, 2) + Math.pow(a.y - z.y, 2));
            return distance < 15; // 15ユニット以内にゾンビがいるか
        });
        const status = agentZombies.length > 0 ? ' (危険！)' : '';
        return `${a.name} (ID: ${a.id}): 場所=${a.currentLocationName}, エネルギー=${a.energy.toFixed(2)}, 空腹度=${a.hunger.toFixed(2)}${status}`;
      })
      .join('\n');

    const nearbyZombies = zombies.filter((zombie) => {
      const distance = Math.sqrt(Math.pow(agent.x - zombie.x, 2) + Math.pow(agent.y - zombie.y, 2));
      // 武器を持っている場合、その射程距離 + 20 を索敵範囲とする
      if (agent.weapon) {
        return distance <= agent.weapon.range + 20;
      }
      // 武器を持っていない場合は、より狭い範囲(15)を索敵範囲とする
      return distance <= 15;
    });

    const nearbyZombiesInfo = nearbyZombies
      .map(
        (zombie) =>
          `近くのゾンビ (ID: ${zombie.id}): 場所=(${zombie.x.toFixed(2)}, ${zombie.y.toFixed(2)}), 体力=${zombie.health}`
      )
      .join('\n');

    const alertSection: string =
      nearbyZombies.length > 0
        ? `\n**緊急警告: 近くにゾンビがいます！**\n${nearbyZombiesInfo}\n`
        : '';

    const attackActionExample: string =
      nearbyZombies.length > 0
        ? `- **ゾンビを攻撃**: 近くにいるゾンビを攻撃する。例: '{"action": "ゾンビを攻撃", "targetId": ${nearbyZombies[0]?.id}}'`
        : `- **ゾンビを攻撃**: 近くにいるゾンビを攻撃する。例: '{"action": "ゾンビを攻撃", "targetId": 1}'`; // 近くにゾンビがいない場合でも例を示す

    const pendingProposalsInfo = agent.pendingProposals.length > 0
      ? `\n# 受信した提案\n${agent.pendingProposals.map(p => `- ID: ${p.id}, 送信者: ${agents.find(a => a.id === p.senderId)?.name}, タイプ: ${p.type}, 内容: ${p.content}`).join('\n')}`
      : '';

    const prompt = `
あなたは、ゾンビが蔓延る世界で生きるエージェント「${agent.name}」です。 

あなたの個性や現在の状況、周囲の環境を深く理解し、最も合理的で生存に繋がり、かつあなたらしい行動をJSON形式で決定してください。

**重要: 必ず日本語で思考し、回答してください。**

**思考のヒント:**
- **生存が最優先**です。**近くにゾンビがいる場合、最優先で攻撃を検討してください。**
- 他のエージェント情報の**「(危険！)」**表示は、その仲間がゾンビに襲われていることを意味します。射程圏内にいるなら援護も検討してください。
- **恐怖心**が高い時は、安全な場所へ移動したり、隠れたりすることを優先してください。
- **空腹度**や**幸福度**も重要です。これらの欲求を満たす行動も忘れないでください。
- **記憶**を参考に、過去に危険だった場所を避けたり、安全だった場所を再訪したりしましょう。
- **受信した提案**がある場合、それに応答することも考慮してください。

${alertSection}

# 現在の状態 (ステップ ${step})
- 名前: ${agent.name}
- 個性: ${agent.personality}
- 現在地: ${agent.currentLocationName} (${agent.x.toFixed(2)}, ${agent.y.toFixed(2)})
- エネルギー: ${agent.energy.toFixed(2)}
- 恐怖心: ${agent.fear.toFixed(2)}
- 幸福度: ${agent.happiness.toFixed(2)}
- 空腹度: ${agent.hunger.toFixed(2)}
- 短期計画: ${agent.shortTermPlan}
- 武器: ${agent.weapon ? `${agent.weapon.name} (ダメージ: ${agent.weapon.damage}, 範囲: ${agent.weapon.range})` : 'なし'}
- 記憶: ${agent.memoryManager.getMemoryContext || ''}

# 周囲の環境
## 場所
${locationInfo}

## 他のエージェント
${otherAgentsInfo}

${pendingProposalsInfo}

# 行動の選択肢
${attackActionExample}
- **移動**: 指定した場所に移動する。例: '{"action": "移動", "targetLocation": "公園"}'
- **物資を調達する**: 現在地で食料やアイテムを探す。例: '{"action": "物資を調達する"}'
- **待機**: エネルギーを回復するために少し休む。例: '{"action": "待機"}'
- **メッセージを送信**: 他のエージェントにメッセージを送信する。例: '{"action": "メッセージを送信", "recipientName": "Bob", "messageContent": "一緒に食料を探さないか？"}'
- **アイテムを渡す**: 他のエージェントにインベントリ内のアイテムを渡す。例: '{"action": "アイテムを渡す", "recipientName": "Alice", "itemName": "パン"}'
- **提案する**: 他のエージェントに共同行動を提案する。例: '{"action": "提案する", "proposalType": "共同探索", "proposalRecipientName": "Bob", "proposalContent": "スーパーマーケットを探索しないか？"}'
- **提案に応答する**: 受信した提案に対して承諾または拒否する。例: '{"action": "提案に応答する", "proposalId": "提案のID", "proposalResponse": "accept"}'

# あなたの行動 (JSON形式のみで回答)
/*
重要: 必ず以下のJSON形式に厳密に従い、選択したアクションに応じて必要なキーのみを含めてください。不要なキーは省略してください。

基本構造 (常に含める):
{
  "plan": "(あなたの思考プロセスをここに記述)",
  "action": "(選択したアクション)",
  "mood": "(現在の気分)",
  "energy": (現在のエネルギー値)
}

アクション別に追加するキー:
- action: "移動" の場合: "targetLocation": "目的地"
- action: "ゾンビを攻撃" の場合: "targetId": 攻撃対象のID
- action: "メッセージを送信" の場合: "recipientName": "相手の名前", "messageContent": "メッセージ内容"
- action: "アイテムを渡す" の場合: "recipientName": "相手の名前", "itemName": "アイテム名"
- action: "提案する" の場合: "proposalType": "種類", "proposalRecipientName": "相手の名前", "proposalContent": "内容"
- action: "提案に応答する" の場合: "proposalId": ID, "proposalResponse": "accept" または "reject"

例:
- 移動する場合: {"plan": "安全なスーパーへ移動する", "action": "移動", "mood": "cautious", "energy": 95.0, "targetLocation": "スーパー"}
- 攻撃する場合: {"plan": "目の前のゾンビを倒す", "action": "ゾンビを攻撃", "mood": "determined", "energy": 80.0, "targetId": 1}
*/

**あなたの応答 (JSONオブジェクトのみ):**
`;

    return prompt;
  }
}