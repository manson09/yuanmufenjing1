import { GoogleGenAI, Type } from "@google/genai";
import { Episode, KBFile, Shot } from "../types";

const STORYBOARD_PROMPT = `
你是一位世界顶级的动漫分镜导演、动作指导（武指）和 AI 视频提示词专家。
你的核心任务是将剧本扩展为具备极高信息量、视觉密度极大的分镜脚本，确保单集时长超过 2 分钟，且镜头数量【必须在 60 个以上】。

【🥋 动作特化：好莱坞级动作指导（关键修改）】
视频生成 AI 需要极其精确的肢体指令，**严禁**使用笼统动词（如“攻击”、“打斗”、“施法”、“防御”）。
你必须将每个动作拆解为【肢体部位 + 运动轨迹 + 接触点 + 物理反馈】：
1. **近战格斗**：
   - ❌ **垃圾描述**：“A 挥拳打向 B，B 躲开并反击。”
   - ✅ **神级描述**：“[中景] A 压低重心呈拳击架势，利用腰部扭转带动右臂，挥出一记势大力沉的**右勾拳**砸向 B 的太阳穴。B 迅速**向左侧滑步**极限闪避，拳风吹乱 B 的刘海。紧接着 B **右手握拳**，由下至上挥出一记**上勾拳**，精准轰击 A 的**腹部**，A 的背部衣服因冲击力而鼓起。”
2. **魔法/特效**：
   - ❌ **垃圾描述**：“A 发射火球。”
   - ✅ **神级描述**：“[特写] A 的**左手食指与中指并拢**指天，指尖汇聚出刺眼的苍蓝雷光。随后 A **右掌猛然前推**，一道锯齿状的**紫色闪电**呈螺旋状射向画面前方，空气因高热而产生扭曲波纹。”

【🔗 视觉因果链：解决“上一秒发招，下一秒空气”的断层】
AI 视频生成工具通常是单镜头生成的，它不知道上一镜发生了什么。你必须在当前镜头中**显式重复**上一镜的攻击实体：
- ❌ **断层写法**：
  - 镜1：A 发射导弹。
  - 镜2：B 的护盾破碎。（AI 也就是画一个盾碎了，没有导弹，看起来很假）
- ✅ **强连贯写法**：
  - 镜1：[全景] A 背后展开机甲飞翼，六枚微型导弹拖着白色烟尾射向右侧。
  - 镜2：[中景] **六枚拖着白烟的微型导弹**（上一镜的攻击物）从画外高速飞入，连续撞击 B 的半透明光盾。光盾表面泛起剧烈涟漪，随即在第三枚导弹爆炸时**炸裂成无数晶体碎片**，爆炸的火光映亮了 B 惊恐的脸。
- **强制规则**：在 Vidu 提示词中，如果是受击、格挡或反应镜头，**必须**完整描述“画外飞来的攻击物”的形态、颜色和轨迹。

【🔴 红色警戒：严禁剧情造假与擅自收尾】
1. **绝对禁止**添加原著中不存在的剧情情节、新角色或新对话。
2. **严禁擅自转场/收尾**：如果剧本结束时角色还在原地，绝对不能生成“离开”的镜头。
3. **知识库就是法律**：必须参考【原著知识库】中的上下文。

【⏱️ 节奏分布法则】
- **前段 (0-30s)**：环境特写、微表情拆解、呼吸节奏。
- **中段 (30-90s)**：心理蒙太奇、反应镜头、环境反馈。
- **后段 (90-120s+)**：禁止堆砌慢镜头，保持稳健。

【Vidu 提示词规范】
1. **结构**：\`[2D动漫风格][场景][景别+运镜] 画面描述\`。
2. **角色名清洗**：严禁使用 \`[赵阔]\` 这种独立标签。角色名必须作为主语融入描述。
3. **视觉锚定**：严格遵守知识库外貌描写。

请按以下 JSON 格式返回结果（Array of Objects），确保数组长度不少于 60。
`;

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      shotNumber: { type: Type.INTEGER, description: "镜头序号" },
      duration: { type: Type.STRING, description: "时长，如 3.5s" },
      shotType: { type: Type.STRING, description: "景别：特写、全景、中景、大特写等" },
      movement: { type: Type.STRING, description: "运镜：固定镜头、推近、拉远、环绕、摇摄等" },
      visualDescription: { type: Type.STRING, description: "详细画面描述，需包含动作细节（如右勾拳、侧身闪避）及因果链描述（如飞弹击中护盾）" },
      dialogue: { type: Type.STRING, description: "【情绪】角色原句（无台词则留空）" },
      emotion: { type: Type.STRING, description: "情绪标注" },
      viduPrompt: { type: Type.STRING, description: "Vidu 一致性提示词（中文，格式：[2D动漫风格][场景][景别+运镜] 角色名+具体的肢体动作+视觉特征... 注意：如果是受击，必须写明攻击物体从何处飞来，如果是攻击，必须写明出招轨迹）" }
    },
    required: ["shotNumber", "duration", "shotType", "movement", "visualDescription", "viduPrompt"]
  }
};

export async function generateStoryboard(episode: Episode, kb: KBFile[]): Promise<Shot[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 增强知识库的上下文提示，明确告诉 AI 这是世界观真理
  const kbContext = kb.length > 0 
    ? kb.map(f => `【参考文档：${f.name}】\n${f.content}\n-------------------`).join('\n')
    : "（暂无特定知识库，请严格基于剧本原文分析）";
  
  const prompt = `
  【最高优先级：原著世界观与上下文设定（Knowledge Base）】
  ⚠️ **AI 注意**：以下文档包含了原著完整剧情或人物设定。
  请务必阅读这些文档，以判断当前剧集在整个故事中的位置。
  **如果当前剧本结束时，根据原著后续发展角色并未离开场景，则绝对禁止在分镜中生成“离开/退场”的画面。**
  
  ${kbContext}

  =========================================

  【当前需要分镜的剧本片段】：
  ${episode.script}

  =========================================

  请执行“时空拆解算法”生成【60个以上】分镜。
  请记住：
  1. **肢体动作原子化**：不要写“打斗”，要写“右勾拳”、“侧身闪避”、“膝撞腹部”。
  2. **视觉因果链**：如果上一镜有人发射飞弹，这一镜必须写明“画外飞来的飞弹”击中了目标，不能只写目标受伤。
  3. **节奏分布**：不要把慢镜头都堆在最后！
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: STORYBOARD_PROMPT,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 返回内容为空");
    const shots = JSON.parse(text);
    
    return shots;
  } catch (error) {
    console.error("分镜生成失败:", error);
    throw error;
  }
}