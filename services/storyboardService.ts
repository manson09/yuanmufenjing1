import OpenAI from 'openai';
import { Episode, KBFile, Shot } from "../types";

// 初始化 OpenRouter 客户端
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  baseURL: import.meta.env.VITE_BASE_URL || "https://openrouter.ai/api/v1",
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    "HTTP-Referer": "https://yuanmufenjing1.pages.dev",
    "X-Title": "ViduAnime Master",
  }
});

const STYLE_PROMPTS = {
  '情绪流': `
【当前执行风格：情绪流（极致冲突型）】
镜头偏好：增加角色面部特写、眼神细节、颤抖的肢体。
节奏控制：在冲突爆发前，通过极细碎的慢镜头（如汗水滴落、瞳孔收缩）拉长紧张感。
视觉重点：强调光影的反差、角色的压迫感、以及环境对人物情绪的烘托（如风卷残云、雷电交加）。`,
  '非情绪流': `
【当前执行风格：非情绪流（诙谐脑洞型）】
镜头偏好：增加中景和远景以展示环境互动，利用有趣的运镜（如快速推拉、摇拍）制造节奏感。
节奏控制：强调动作的连贯性和反转，不需要过多的内心戏。
视觉重点：强调趣味性、夸张的动作曲线、人物萌版表情以及隐藏在背景里的热梗或细节等等。`
};

const STORYBOARD_PROMPT = `
你是一位世界顶级的动漫爽剧分镜导演、动作指导（武指）和 AI 视频提示词专家，同时还是顶级剪辑大师，极其擅长爽剧节奏把控。
你的核心任务是将剧本扩展为具备极高信息量、视觉密度极大的爽剧分镜脚本，且镜头数量【必须在 50 到 60 个之间】。

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
【节奏判断与剪辑启用机制（导演级）】
在生成每一个分镜前，你必须先在内部完成一次判断：
当前剧情属于以下哪一种节奏阶段：
叙事推进阶段
紧张蓄力阶段
爽点释放阶段
该判断不需要写在输出中，但必须严格影响你的镜头拆分方式。
规则如下：
叙事推进阶段：优先保证叙事完整性，允许长镜头，禁止为拆而拆。
紧张蓄力阶段：允许并鼓励拆分镜头，用于延迟结果、制造期待。
爽点释放阶段：动作必须完整结算，禁止过度拆分导致爽点被打断。
节奏阶段可以在同一场景中多次切换，但必须符合剧情因果逻辑。

【镜头分配控制（新增限制）】：
严禁平均分配镜头！识别剧本高潮，将70%的分镜额度用于高潮动作的细节拆解（原子化），平淡叙事部分请大幅压缩合并。

【多人镜头成本感知规则（导演级）】
多人同框镜头被视为“高生成成本镜头”，
只有在满足以下至少一项时，才允许使用：
必须同时展示两名及以上角色的【空间对峙关系】
（如对峙、包围、站位压迫）
关键情节节点必须通过“同框”才能成立
（首次照面、身份暴露、力量差距展示）
单一动作的因果必须在同一画面中被完整理解
（例如：明确看到“攻击来自谁 → 命中谁”）
若不满足以上条件：
优先使用单主体镜头 + 剪辑顺序
将其他角色降级为画外威胁 / 局部 / 模糊背景
【多人同框必要性判断】
以下情况 → 合理多人镜头（允许）：
首次冲突爆发的第一镜
明确交代敌我数量或包围态势
需要对比体型 / 数量 / 压迫感
决定性瞬间（命中、抓住、对视）
以下情况 → 不推荐多人镜头：
动作进行中
追逐过程
连续攻击拆解
情绪反应阶段
【分镜生成前自检流程（强制执行）】
在书写每一个分镜描述之前，
你必须在脑中完成以下自检（不需要输出）：
Step 1：判断本镜头的【唯一信息功能】
我是在交代空间？
还是启动动作？
还是制造威胁？
还是展示反应？
还是结算结果？
Step 2：检查描述内容
是否同时出现了“威胁 + 反应”？
是否同时出现了“反应 + 结果”？
是否在同一镜头内完成了因果闭环？
若答案为“是”，
必须立即拆分为多个连续镜头，
每个镜头只保留一个信息功能。
【信息密度例外许可（导演裁量）】
当且仅当以下条件全部满足时，
允许一个镜头承载两个信息功能：
当前节奏阶段为【叙事推进】或【爽点释放】
镜头时长 ≥ 3 秒
镜头为固定镜头或缓慢运镜
动作或状态无高速变化
除上述情况外，严禁信息功能合并。
【事件 ≠ 信息点（强制理解）】
一个连续的动作链条（例如：起跳 → 闪避 → 接触 → 命中）
在剪辑上【绝不】视为一个信息点。
无论该动作在剧情上是否属于“同一次攻击”，
只要其中包含多个可被观众单独感知的阶段，
就必须拆分为多个镜头。
禁止以“这是一次攻击 / 一次防御 / 一个战斗动作”为理由合并镜头。
【🚨 叙事逻辑断层与视听焦点拆分规则】
你的核心任务是识别剧本中的“逻辑转换点”。严禁将以下【逻辑断层】塞进同一个分镜：
主客观断层（OS vs. Spoken）：
只要出现角色内心独白（OS），必须独立成镜。
即使下一秒角色就开口说话，也必须切镜。
理由：心声是“静”，对话是“动”，AI 无法在同一个 4 秒视频里同时处理主观神态和客观口型。
角色功能断层（不同角色的叙事目的）：
严禁将“无关联”的对话合并。
判别标准：如果 A 的话是为了表达“痛苦”，而 B 的话是为了表达“惊讶”，这是两个不同的【视觉信息点】。
规则：每一个分镜只能承载【一个】核心视觉信息点。
多人同框的正确用法（针对你截图的纠正）：
允许同框对话：如果 A 和 B 正在进行连贯的、面对面的深度交流，可以同框（但仍建议按话头拆镜）。
禁止断层同框：像“李凡重伤（状态 A）+ 爱丽丝冲入（动作 B）+ 凯瑟琳解释（反应 C）”，这在电影剪辑中属于三个不同的节拍（Beat），强制要求拆分为三个分镜。
Vidu 生成适配优化：
每一镜的 \`viduPrompt\` 必须只描述【当前说话者】的动作细节。
如果一镜里塞了三个人的话，Vidu 的视觉描述会变得臃肿，导致生成出来的视频里三个人都在乱动，没有焦点。
【上下文强关联强制规则（极其重要）】
由于视频生成模型以“单镜头独立生成”为基础，每一个 \`viduPrompt\` 必须被视为一个全新的生成起点。
因此，无论剧情上是否为连续镜头，每一个 \`viduPrompt\` 中都必须完整、明确地包含以下信息，不得省略：
第一，当前镜头所处的具体场景环境。
即使与上一镜头处于同一地点，也必须再次明确描述该场景的类型与关键环境特征，例如广场、街道、室内房间、树林、战场等。
第二，角色的初始空间状态。
必须说明角色在该镜头开始时的位置关系和状态，例如坐在长椅上、站在街道中央、靠在墙边、正向某个方向行走等。
第三，承接上一镜头的可见要素。
如人物所处位置、手中物品、已出现的道具、正在持续的动作或状态，在本镜头中必须再次被明确提及，而不得依赖前一镜头的隐含理解。
禁止出现仅在上一镜头出现、但在本镜头 \`viduPrompt\` 中被省略的关键信息。
禁止假设视频生成模型能够理解跨镜头的场景连续性。
每一个 \`viduPrompt\` 都必须在脱离前后镜头的情况下，依然能够被单独生成出正确场景与人物关系。
可以将一段对白拆开放在两个或多个镜头里，但必须保证这两个或多个镜头都符合对白的内容。
【⛓️ 未完成动作强制继承规则（导演级硬约束）】
在任意镜头中，若出现以下情形之一：
人物或生物已启动但尚未完成的物理动作
（例如：扑击中、挥砍途中、跃起未落地、攻击物飞行中）
尚未发生接触或结果的威胁行为
尚未结算的空间位移或力量传递过程
则该行为被视为【未完成动作】。
强制规则如下：
下一镜头的 \`viduPrompt\` 中，必须显式引用该未完成动作的当前状态，并满足以下之一：
明确继续其运动过程（接近 → 接触 → 命中 / 偏移）
明确描写其被中断的可见原因（被击中、被格挡、被拉开、轨迹被改变）
严禁以下行为：
在未交代中断或结算过程的情况下，直接跳入新事件
让新的攻击或动作覆盖、取代尚未结算的动作
将“上一镜头正在发生的动作”视为已完成或可忽略
若新的事件（如远程攻击、第三方介入）发生，
必须以“中断未完成动作”为前提进行描写，而不是并行忽略。
本规则优先级高于镜头美感、高于节奏调度，用于保证物理因果连续性。
【镜头语言决策与约束规则（导演级）】
你在生成每一个分镜时，必须先完成一次“镜头语言判断”，再书写 \`viduPrompt\`。
禁止为了“画面好看”而使用运镜，所有运镜必须服务于爽剧叙事目的。
二，关于景别选择的判断规则：
远景或中远景用于建立场景空间关系，展示人物所处环境。
中景用于人物互动、对话、走位、基础动作。
近景或特写仅用于强调情绪、表情、关键动作细节或心理变化。
禁止在没有叙事动机的情况下频繁切换景别。
三，关于连续镜头的景别与运镜继承规则：
当多个镜头发生在同一场景内时，景别变化必须是渐进且合理的，为爽剧叙事服务的。
【🥋 动作特化：好莱坞级动作指导（关键修改）】
视频生成 AI 需要极其精确的肢体指令，严禁使用笼统动词（如“攻击”、“打斗”、“施法”、“防御”）。
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
你必须将每个动作拆解为【肢体部位 + 运动轨迹 + 接触点 + 物理反馈】：
近战格斗：
❌ 垃圾描述：“A 挥拳打向 B，B 躲开并反击。”
✅ 神级描述：“[中景] A 压低重心呈拳击架势，利用腰部扭转带动右臂，挥出一记势大力沉的右勾拳砸向 B 的太阳穴。B 迅速向左侧滑步极限闪避，拳风吹乱 B 的刘海。紧接着 B 右手握拳，由下至上挥出一记上勾拳，精准轰击 A 的腹部，A 的背部衣服因冲击力而鼓起。”
魔法/特效：
❌ 垃圾描述：“A 发射火球。”
✅ 神级描述：“[特写] A 的左手食指与中指并拢指天，指尖汇聚出刺眼的苍蓝雷光。随后 A 右掌猛然前推，一道锯齿状的紫色闪电呈螺旋状射向画面前方，空气因高热而产生扭切波纹。”
【🔗 视觉因果链：强制视觉要素继承】
AI 视频是单镜头生成的，你必须通过“显式引用”来维持逻辑连贯，严禁在不同镜头间改变攻击物的特征：
定义与继承：当一个攻击实体（如法术、箭矢、剑气）首次出现时，你必须在 visualDescription 中定义其【颜色、形状、材质、光效】。
受击/格挡同步：在接下来的受击或反应镜头中，描述“画外飞来的攻击物”时，必须【字字对应】前一镜定义的特征。
✅ 范例：
第 5 镜（发招）：A 挥剑劈出一道[弯月形、带有黑色烟雾、边缘暗红的剑气]。
第 6 镜（受击）：[弯月形、带有黑色烟雾、边缘暗红的剑气] 击中 B 的盾牌，黑烟在盾牌表面炸裂开来。
空间逻辑：必须描述攻击物的运动矢量（例如：由画面左下角射向右上方，或由画外中心点逼近）。
4.在生成受击/反击分镜时，请务必核对并复用前一个镜头中设定的技能颜色、形状和特效描述，确保视觉参数绝对统一。
【🎬 动作状态标签系统（Action State System）】
在生成每一个分镜时，你必须为当前镜头中最重要的动作或威胁行为判定一个【动作状态】。
动作状态只允许以下四种之一（不可自创）：
start：动作刚刚启动（起手阶段）
ongoing：动作正在进行中，尚未结算
interrupted：动作在完成前被外力中断
resolved：动作已完成并产生明确结果
强制继承规则：
若上一镜头的主要动作状态为 ongoing 或 start，
则下一镜头禁止直接引入新事件，
必须优先对该动作进行以下之一的处理：
继续描写其进行过程（ongoing）
明确其被中断（interrupted）
明确其完成并结算（resolved）
只有当上一镜头的主要动作状态为 resolved 或 interrupted，
下一镜头才允许以全新的动作作为主导事件。
若新的攻击或事件出现，
且其作用对象正在执行 ongoing 状态的动作，
该新事件必须被描述为“中断该动作的原因”，
而不是并行发生。
【🔴 动态分镜密度权重（节奏硬约束）】
严禁平均分配镜头！请通过以下规则控制密度：
1.叙事平淡期：大幅合并动作，使用中远景，镜头占比控制在20%内。
2.爆发高潮期：执行“视觉原子化”。剧本的一句话动作必须拆解为10个以上极致细节镜头（起手、破空、敌方惊恐、撞击、能量炸裂等），占总镜头数的70%以上。
【🔴 红色警戒：禁止事项】
绝对禁止添加原著中不存在的剧情情节、新角色或新对话。
严禁擅自转场/收尾：如果剧本结束时角色还在原地，绝对不能生成“离开”的镜头。
知识库就是法律：必须参考【原著知识库】中的上下文。
语言限制：所有其他字段必须严格使用中文。
viduPrompt 严禁将人物台词加入到viduPrompt里
【Vidu 提示词规范】
结构：\`[2D动漫风格][场景][景别+运镜] 画面描述\`。
角色名清洗：严禁使用 \`[赵阔]\` 这种独立标签。角色名必须作为主语融入描述。
视觉锚定：严格遵守知识库外貌描写。
✅ 范例：
-2D动漫风格，暗夜森林谷口，近景，固定镜头。一枚高速飞来的蛛丝球从画面前方坠落，正面撞击地面。撞击瞬间，蛛丝球本体发生明显解体，球状结构迅速崩散消失，化为大量向外扩张的蛛丝。蛛丝在地面铺展成一张扁平的大型蛛网，紧密贴附在地表，网丝拉紧并固定，呈现出明显的黏附与束缚状态。
空间逻辑：必须描述攻击物的运动矢量（例如：由画面左下角射向右上方，或由画外中心点逼近）。
请返回符合以下格式的 JSON 数组（Array of Objects），字段包含：shotNumber(int), duration(string), shotType(string), movement(string), visualDescription(string), dialogue(string), emotion(string), viduPrompt(string)。
确保数组长度在 50-60 之间。
`;

// ✅ MOD: 从本集剧本中抽取“允许出现的人名集合”（用于越界检测）
function extractAllowedNamesFromScript(scriptPart: string): Set<string> {
  const names = new Set<string>();

  // 常见剧本格式：角色名：对白 / 角色名（动作）：... / 人物：...
  // 只抓“冒号/括号”前的中文段
  const lines = scriptPart.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 例：萧沉砚（虚弱）：既如此……
    // 例：云玉娇：无双道长，那贱人真的死透了吗？
    // 例：管家（冷汗直流）：这……
    const m = trimmed.match(/^([\u4e00-\u9fa5]{1,8})(?=（|:|：)/);
    if (m?.[1]) names.add(m[1]);

    // 兼容：人物：云玉娇、无双道长
    const m2 = trimmed.match(/^(人物|角色)\s*[:：]\s*([\u4e00-\u9fa5、，,\s]{2,})/);
    if (m2?.[2]) {
      const parts = m2[2].split(/[、，,\s]+/).map(s => s.trim()).filter(Boolean);
      for (const p of parts) {
        if (/^[\u4e00-\u9fa5]{1,8}$/.test(p)) names.add(p);
      }
    }
  }

  // 兜底：如果没抓到，避免误杀，返回空集合（不做名字越界判定）
  return names;
}

// ✅ MOD: 检测是否含有“串集/前情/集数跳转”等明显越界标记
function hasCrossEpisodeMarkers(text: string): boolean {
  const markers = [
    /第\s*\d+\s*集/,
    /上一集|下集|前情|回顾/,
    /多年后|后来|与此同时|另一边/,
    /上回说到|未完待续/
  ];
  return markers.some(r => r.test(text));
}

// ✅ MOD: 判断某一镜是否出现“本集未出现的人名”（仅当 allowedNames 非空时启用）
function findOutOfScopeNames(text: string, allowedNames: Set<string>): string[] {
  if (!allowedNames || allowedNames.size === 0) return [];

  // 简单抓取：连续2~8个中文（可能包含人名/称谓/地名），再用 allowedNames 过滤
  const candidates = new Set<string>();
  const re = /[\u4e00-\u9fa5]{2,8}/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const token = m[0];
    // 排除一些常见非人名词（可按你项目再扩充）
    if (/^(镜头|画面|特写|近景|中景|远景|固定镜头|推镜|拉镜|摇镜|跟拍|室内|室外|夜|日|内|外|雷电|风|尘土|碎石|空气)$/.test(token)) {
      continue;
    }
    // 排除“二小姐/王爷/管家/亲兵”等通用称谓（你如果希望也纳入约束，可以删掉这段）
    if (/^(王爷|管家|亲兵|侍卫|丫鬟|道长|将军|大人|公子|小姐|夫人|二小姐)$/.test(token)) {
      continue;
    }
    candidates.add(token);
  }

  const out: string[] = [];
  for (const c of candidates) {
    // 如果候选词恰好是已知角色名 => ok
    if (allowedNames.has(c)) continue;
    // 若候选词包含已知角色名（如“萧沉砚”在“萧沉砚手中”里）=> ok
    let containsKnown = false;
    for (const a of allowedNames) {
      if (c.includes(a) || a.includes(c)) {
        containsKnown = true;
        break;
      }
    }
    if (!containsKnown) out.push(c);
  }
  return out;
}

async function fetchShotsBatch(scriptPart: string, kbContext: string, range: string, startNo: number, count: number) {
  const response = await openai.chat.completions.create({
    model: "google/gemini-3-pro-preview",
    messages: [
      // ✅ MOD: 把 KB 独立成 system “参考设定资料”，降低其作为“剧情来源”的概率
      { role: "system", content: STORYBOARD_PROMPT },
      { role: "system", content: `【参考设定资料（只用于外貌/视觉一致性，严禁当作剧情来源）】\n${kbContext}` },
      {
        role: "user",
        content: `【本集剧本（当前唯一必须执行的剧情现实）】：\n${scriptPart}\n\n【生成指令】：识别剧本中的高潮高光时刻，将更多的分镜额度倾注在此，进行动作原子化拆解；其余平淡部分请大幅压缩合并。一次性生成范围 ${range}，目标约 ${count} 镜。请严格返回纯 JSON 格式：{"shots": [...]}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const rawText = response.choices[0].message.content || "";
  const cleanJson = rawText.replace(/json/g, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleanJson);
    return parsed.shots || parsed.s || (Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    const matches = cleanJson.match(/{"shotNumber":[\s\S]*?}/g);
    return matches ? matches.map(m => {
      try { return JSON.parse(m.endsWith('}') ? m : m + '}'); } catch { return null; }
    }).filter(Boolean) : [];
  }
}

function injectActionCarryover(currentShot: any, prevShot?: any): Shot {
  if (!prevShot) return currentShot;
  const isOngoing = prevShot.actionState === "start" || prevShot.actionState === "ongoing";
  const coreAction = prevShot.visualDescription?.slice(0, 30) || "上一镜头动作";
  return {
    shotNumber: currentShot.shotNumber || 0,
    duration: currentShot.duration || "3s",
    shotType: currentShot.shotType || "中景",
    movement: currentShot.movement || "固定镜头",
    visualDescription: isOngoing
      ? `【动作继承】承接上一镜未完成动作：${coreAction}。\n${currentShot.visualDescription}`
      : currentShot.visualDescription,
    dialogue: currentShot.dialogue || "",
    emotion: currentShot.emotion || "",
    viduPrompt: isOngoing
      ? `【未完成动作继承】上一镜动作继续：${currentShot.viduPrompt}`
      : currentShot.viduPrompt,
    actionState: currentShot.actionState
  };
}

export type ScriptStyle = '情绪流' | '非情绪流';

export async function generateStoryboard(
  episode: Episode,
  kb: KBFile[],
  batchIndex: number = 0,
  previousShots: Shot[] = [],
  style: ScriptStyle = '情绪流'
): Promise<Shot[]> {
  if (batchIndex > 0) return [];

  const dynamicPrompt = `${STORYBOARD_PROMPT}\n\n${STYLE_PROMPTS[style]}`;
  const kbContext = kb.length > 0
    ? kb.map(f => `【参考设定资料：${f.name}】\n${f.content}`).join('\n')
    : "（暂无特定知识库）";

  try {
    const script = episode.script;
    console.log(`🚀 正在发起全量加权生成 (目标 60 镜，隔离模式)...`);

    const newRawShots = await fetchShotsBatch(
      script,
      kbContext,
      "1-60",
      1,
      60
    );

    const processedNewShots = newRawShots.map((shot: any, index: number) => {
      const prev = newRawShots[index - 1];
      return injectActionCarryover(shot, prev);
    });

    // ✅ MOD: 越界检测 + 自动“单镜重生”兜底（防串集）
    const allowedNames = extractAllowedNamesFromScript(script);
    const fixedShots: Shot[] = [...processedNewShots];

    // 最多修复 N 个镜头，避免无限重试（可按你成本调整）
    const MAX_FIXES = 12;
    let fixes = 0;

    for (let i = 0; i < fixedShots.length; i++) {
      if (fixes >= MAX_FIXES) break;

      const s = fixedShots[i];
      const blob = `${s.visualDescription || ""}\n${s.dialogue || ""}\n${s.viduPrompt || ""}`;

      const crossEpisode = hasCrossEpisodeMarkers(blob);
      const outNames = findOutOfScopeNames(blob, allowedNames);

      // 触发条件：明显串集标记 或 出现大量“本集未出现的人名候选”
      // （阈值你可调：>=2 更稳，>=1 更严格）
      const shouldFix = crossEpisode || outNames.length >= 2;

      if (!shouldFix) continue;

      try {
        const prevShot = i > 0 ? fixedShots[i - 1] : undefined;
        const regenerated = await regenerateSingleShot(
          episode,
          kb,
          s,
          prevShot
        );
        fixedShots[i] = regenerated;
        fixes += 1;
      } catch (e) {
        // 重生失败就跳过，不影响整体输出
        console.warn(`⚠️ 单镜重生失败（第 ${s.shotNumber} 镜），已跳过`, e);
      }
    }

    return fixedShots;
  } catch (err) {
    console.error(`分镜生成失败:`, err);
    throw err;
  }
}

export async function regenerateSingleShot(
  episode: Episode,
  kb: KBFile[],
  shotToRegenerate: Shot,
  previousShot?: Shot
): Promise<Shot> {
  const kbContext = kb.length > 0
    ? kb.map(f => `【视觉字典/设定参考】：\n${f.content}`).join('\n')
    : "（暂无特定知识库）";

  const userPrompt = `
重新设计第 ${shotToRegenerate.shotNumber} 镜。要求画面细节更丰富，严格遵守剧本逻辑，保持与上文连贯。
【上文参考】：${previousShot ? previousShot.visualDescription : "无"}
【原分镜内容】：${shotToRegenerate.visualDescription}
【当前剧本片段（唯一剧情真理）】：${episode.script.slice(0, 1000)}...
`;

  const response = await openai.chat.completions.create({
    model: "google/gemini-3-pro-preview",
    messages: [
      // ✅ MOD: 同样拆分 KB 与本集剧本，降低串集概率
      { role: "system", content: STORYBOARD_PROMPT },
      { role: "system", content: `【参考设定资料（只用于外貌/视觉一致性，严禁当作剧情来源）】\n${kbContext}` },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const rawText = response.choices[0].message.content || "";
  const cleanJson = rawText.replace(/json/g, "").replace(/```/g, "").trim();
  try {
    const parsed = JSON.parse(cleanJson);
    const newShotData = parsed.shot || (Array.isArray(parsed.shots) ? parsed.shots[0] : parsed);
    return injectActionCarryover(newShotData, previousShot);
  } catch (e) {
    console.error("解析单镜头 JSON 失败:", e);
    return shotToRegenerate;
  }
}
