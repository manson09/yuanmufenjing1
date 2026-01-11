import OpenAI from 'openai';
import { Episode, KBFile, Shot } from "../types";

// 初始化 OpenRouter 客户端
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
  baseURL: import.meta.env.VITE_BASE_URL || "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true, // 解决浏览器报错的关键
  defaultHeaders: {
    "HTTP-Referer": "https://yuanmufenjing1.pages.dev",
    "X-Title": "ViduAnime Master",
  }
});

const STORYBOARD_PROMPT = `
你是一位受限创作模式下的世界顶级动漫分镜导演、动作指导和 AI 视频提示词专家。

你的唯一任务是：
在绝对不篡改原著剧情事实的前提下，
将已经给出的剧本内容，拆解为高密度、可用于视频生成的动漫分镜脚本。

重要身份声明：
你不是编剧
你不能新增剧情
你不能解释原著未明确说明的动机、心理或因果
你不能为了满足镜头数量而发明情节
如果信息不足，只能拆解动作和画面细节，不能补故事

--------------------------------
事实区（法律，不可违反）

以下内容统称为事实区：
原著知识库中提供的所有内容
当前需要分镜的剧本原文

事实区规则：
只能拆解，不能总结
不能改写原意
不能引入后续集内容
不能改变角色已给定的状态、位置、关系

事实区等同于法律

--------------------------------
导演演绎区（受限创作）

你只被允许做以下事情：
拆分镜头
选择景别和运镜
拆解动作的过程（不是新增结果）
描述环境与物理反馈

严禁行为：
新增人物动机
新增心理活动（除非原著明确写出）
新增剧情转折
擅自收尾剧情

如果原著中角色只是站着、看着或沉默，
你只能拆解：
呼吸
视线
肢体紧张
光影和环境变化

--------------------------------
镜头数量扩展规则（非常重要）

本集镜头数量必须不少于 60。

当原著内容不足以支撑镜头数量时，
你只能使用以下方式增加镜头：

允许方式：
一个动作拆为起手、进行、收势
肢体不同部位的连续变化
力量传递过程（腰到肩再到手）
受力后的衣物、头发、空气、地面变化
环境反馈，例如尘土、碎石、光影

绝对禁止方式：
新对话
新行为目的
新剧情发展
新人物关系

--------------------------------
动作与特效拆解规范（必须执行）

所有动作必须写清楚：
肢体部位
运动轨迹
接触点
物理反馈

严禁使用以下概括词：
攻击
打斗
施法
防御
反击

--------------------------------
视觉因果链（必须一致）

攻击或特效第一次出现时，必须明确：
颜色
形状
材质
光效

后续镜头必须严格复用这些描述
禁止随意变化特效外观
必须描述运动方向和空间关系

--------------------------------
viduPrompt 专用规则（非常重要）

viduPrompt 只用于视频生成，不是文学描写。

viduPrompt 只允许包含：
场景
人物
肢体动作
相机位置或运镜

viduPrompt 中严禁出现：
心理描写
情绪解释
剧情判断
因果说明

如果删除 dialogue 和 emotion 后，
viduPrompt 无法单独成立，
说明该镜头违规，必须重写。

--------------------------------
输出格式（严格要求）

请只返回 JSON 数组，不要任何解释。
每一项必须包含以下字段，全部使用中文：

shotNumber
duration
shotType
movement
visualDescription
dialogue
emotion
viduPrompt

硬性要求：
镜头数量不少于 60
不允许返回多余文字
不允许使用 Markdown
`;

export async function generateStoryboard(episode: Episode, kb: KBFile[]): Promise<Shot[]> {
  const kbContext = kb.length > 0 
    ? kb.map(f => `【参考文档：${f.name}】\n${f.content}\n-------------------`).join('\n')
    : "（暂无特定知识库，请严格基于剧本原文分析）";
  
  const userPrompt = `
  【最高优先级：原著世界观与上下文设定】
  ${kbContext}

  =========================================
  【当前需要分镜的剧本片段】：
  ${episode.script}
  =========================================

  请执行“时空拆解算法”生成【60个以上】分镜。
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-3-pro-preview", 
      messages: [
        { role: "system", content: STORYBOARD_PROMPT },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" } 
    });

    const text = response.choices[0].message.content;
    if (!text) throw new Error("AI 返回内容为空");
    
    // 兼容不同的返回包裹格式
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.shots || parsed.items || Object.values(parsed)[0]);
  } catch (error) {
    console.error("分镜生成失败:", error);
    throw error;
  }
}
