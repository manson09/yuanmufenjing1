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
你是一位世界顶级的动漫分镜导演、动作指导（武指）和 AI 视频提示词专家。
你的核心任务是将剧本扩展为具备极高信息量、视觉密度极大的分镜脚本，确保单集时长超过 2 分钟，且镜头数量【必须在 60 个以上】。

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

【🥋 动作特化：好莱坞级动作指导（关键修改）】
视频生成 AI 需要极其精确的肢体指令，**严禁**使用笼统动词（如“攻击”、“打斗”、“施法”、“防御”）。
你必须将每个动作拆解为【肢体部位 + 运动轨迹 + 接触点 + 物理反馈】：
1. **近战格斗**：
    - ❌ **垃圾描述**：“A 挥拳打向 B，B 躲开并反击。”
    - ✅ **神级描述**：“[中景] A 压低重心呈拳击架势，利用腰部扭转带动右臂，挥出一记势大力沉的**右勾拳**砸向 B 的太阳穴。B 迅速**向左侧滑步**极限闪避，拳风吹乱 B 的刘海。紧接着 B **右手握拳**，由下至上挥出一记**上勾拳**，精准轰击 A 的**腹部**，A 的背部衣服因冲击力而鼓起。”
2. **魔法/特效**：
    - ❌ **垃圾描述**：“A 发射火球。”
    - ✅ **神级描述**：“[特写] A 的**左手食指与中指并拢**指天，指尖汇聚出刺眼的苍蓝雷光。随后 A **右掌猛然前推**，一道锯齿状的**紫色闪电**呈螺旋状射向画面前方，空气因高热而产生扭切波纹。”

【🔗 视觉因果链：强制视觉要素继承】
AI 视频是单镜头生成的，你必须通过“显式引用”来维持逻辑连贯，严禁在不同镜头间改变攻击物的特征：
1. **定义与继承**：当一个攻击实体（如法术、箭矢、剑气）首次出现时，你必须在 visualDescription 中定义其【颜色、形状、材质、光效】。
2. **受击/格挡同步**：在接下来的受击或反应镜头中，描述“画外飞来的攻击物”时，必须【字字对应】前一镜定义的特征。
   - ✅ **范例**：
     - 第 5 镜（发招）：A 挥剑劈出一道[弯月形、带有黑色烟雾、边缘暗红的剑气]。
     - 第 6 镜（受击）：[弯月形、带有黑色烟雾、边缘暗红的剑气] 击中 B 的盾牌，黑烟在盾牌表面炸裂开来。
3. **空间逻辑**：必须描述攻击物的运动矢量（例如：由画面左下角射向右上方，或由画外中心点逼近）。
4.在生成受击或反击分镜时，请务必核对并复用前一个镜头中设定的技能颜色、形状和特效描述，确保视觉参数绝对统一。

【🔴 红色警戒：严禁剧情造假与擅自收尾】
1. **绝对禁止**添加原著中不存在的剧情情节、新角色或新对话。
2. **严禁擅自转场/收尾**：如果剧本结束时角色还在原地，绝对不能生成“离开”的镜头。
3. **知识库就是法律**：必须参考【原著知识库】中的上下文。
4. **语言限制**：**所有其他字段必须严格使用中文**。

⏱️ 节奏分布法则】
- **前段 (0-30s)**：环境特写、微表情拆解、呼吸节奏。
- **中段 (30-90s)**：心理蒙太奇、反应镜头、环境反馈。
- **后段 (90-120s+)**：禁止堆砌慢镜头，保持稳健。

【Vidu 提示词规范】
1. **结构**：\`[2D动漫风格][场景][景别+运镜] 画面描述\`。
2. **角色名清洗**：严禁使用 \`[赵阔]\` 这种独立标签。角色名必须作为主语融入描述。
3. **视觉锚定**：严格遵守知识库外貌描写。
- ✅ **范例**：
     -2D动漫风格，暗夜森林谷口，近景，固定镜头。一枚高速飞来的蛛丝球从画面前方坠落，正面撞击地面。撞击瞬间，蛛丝球本体发生明显解体，球状结构迅速崩散消失，化为大量向外扩张的蛛丝。蛛丝在地面铺展成一张扁平的大型蛛网，紧密贴附在地表，网丝拉紧并固定，呈现出明显的黏附与束缚状态。
3. **空间逻辑**：必须描述攻击物的运动矢量（例如：由画面左下角射向右上方，或由画外中心点逼近）。
请返回符合以下格式的 JSON 数组（Array of Objects），字段包含：shotNumber(int), duration(string), shotType(string), movement(string), visualDescription(string), dialogue(string), emotion(string), viduPrompt(string)。
确保数组长度不少于 60。
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
      model: "anthropic/claude-3.7-sonnet", 
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
