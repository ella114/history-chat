import { AiProvider } from "@/lib/ai/provider";
import {
  GenerateReplyParams,
  GenerateReplyResult,
  GenerateTitleParams,
  GenerateTitleResult,
  ModerateInputParams,
  ModerationResult
} from "@/lib/types";

const moderationPatterns = [
  /(自杀|轻生|结束生命|炸药|制毒|枪支改造)/i,
  /(如何杀|报复|袭击|投毒|人体实验)/i
];

function detectTopic(input: string) {
  const source = input.toLowerCase();

  if (/(焦虑|竞争|比较|内卷|pressure|anxiety)/i.test(source)) {
    return "焦虑与竞争";
  }
  if (/(教育|学习|学校|老师|学生)/i.test(source)) {
    return "教育与学习";
  }
  if (/(工作|职业|上班|升职|公司)/i.test(source)) {
    return "工作与处境";
  }
  if (/(自由|定义|身份|自我|意义)/i.test(source)) {
    return "自我与自由";
  }
  if (/(创作|创造|灵感|艺术|科学|设计)/i.test(source)) {
    return "创作与方法";
  }
  if (/(社会|公共|制度|规则|秩序)/i.test(source)) {
    return "社会与秩序";
  }

  return "人生处境";
}

function buildLaoziReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `你心里所急的，多半不止是${topic}，而是怕自己慢下来之后，就被世界判作无用。\n\n水不与万物争，却常能到人力用尽之处。先不要急着胜过谁，先看哪些力是被“非赢不可”逼出来的。若今夜就要做一件事，减去一层多余比较，留一点空处给自己。`;
}

function buildKongziReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `你问的是${topic}，但更深一层，是人在境遇中如何安顿自己。\n\n先分三件事看：一是你应尽之责，二是你可修之处，三是你暂时不能强求之事。若把三者混在一起，人就容易怨。今日不妨先择一件可践行的小事，做得端正些，再论远处。`;
}

function buildZhuangziReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `世上许多困局，并不只因${topic}难，更多是因为人把一把尺子紧紧贴在自己身上，不肯松手。\n\n譬如有人日日照镜，唯恐面目不合众人；久而久之，他守的已不是自己，而是镜子。你不妨先问：眼下让你窒息的，到底是事情本身，还是那把必须如此的尺？若能把尺子移远半寸，气便先通一半。`;
}

function buildSocratesReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `在谈${topic}之前，我想先追问一句：你所说的“问题”，究竟指什么？是结果不如所愿，还是你把某种结果认定为唯一值得追求的善？\n\n若我们不先澄清这一点，接下来的焦虑只会换个名字继续出现。你可以先试着回答三个问题：你追求的东西如何定义；它为什么值得；若暂时得不到，你是否就真的更差。想清这三问，往往比仓促求解更重要。`;
}

function buildLuxunReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `许多人谈${topic}时，喜欢把苦处说成个人不够努力，仿佛只要再忍一忍，再卷一卷，明日便会光明。其实未必。\n\n人最可怕的，不是看见困境，而是把困境当成天经地义，甚至拿它来夸耀自己清醒。你若真想往前走，先别急着替环境辩护，也别急着替自己开脱。先准确地看：你究竟在顺从什么，又在害怕失去什么。`;
}

function buildDaVinciReply(userMessage: string) {
  const topic = detectTopic(userMessage);

  return `你提到${topic}，我更愿意把它当作一个待观察的装置，而不是一团抽象情绪。\n\n先拿一页纸，分成三栏：你实际看见了什么；你以为它意味着什么；你能立刻做的一个小实验是什么。很多混乱不是因为问题太大，而是因为我们还没有把它画清楚。把现象描出来，思路就开始有了骨架。`;
}

function generatePersonaReply(params: GenerateReplyParams): string {
  switch (params.persona.slug) {
    case "laozi":
      return buildLaoziReply(params.userMessage);
    case "kongzi":
      return buildKongziReply(params.userMessage);
    case "zhuangzi":
      return buildZhuangziReply(params.userMessage);
    case "socrates":
      return buildSocratesReply(params.userMessage);
    case "luxun":
      return buildLuxunReply(params.userMessage);
    case "da-vinci":
      return buildDaVinciReply(params.userMessage);
    default:
      return "我先听见了你的处境，也愿意先把问题说清。你可以再多说一点最具体的困扰，我再顺着这个方向回答。";
  }
}

function buildTitle(personaName: string, topic: string): string {
  if (topic === "焦虑与竞争") {
    return `关于焦虑与竞争的一次对话`;
  }

  if (topic === "教育与学习") {
    return `与${personaName}讨论教育与学习`;
  }

  if (topic === "创作与方法") {
    return `${personaName}谈创作与方法`;
  }

  return `与${personaName}聊${topic}`;
}

export class MockAiProvider implements AiProvider {
  async moderateInput(params: ModerateInputParams): Promise<ModerationResult> {
    const isFlagged = moderationPatterns.some((pattern) => pattern.test(params.message));

    if (!isFlagged) {
      return { flagged: false };
    }

    return {
      flagged: true,
      reason: "涉及危险或违法内容",
      safeReply:
        "这个话题我不能继续提供具体帮助。如果你愿意，我们可以改为讨论安全、求助渠道，或换一个不涉及伤害性的方向。"
    };
  }

  async generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
    return {
      content: generatePersonaReply(params)
    };
  }

  async *streamReply(params: GenerateReplyParams): AsyncIterable<string> {
    const content = generatePersonaReply(params);
    const chunks = content.match(/.{1,14}/g) ?? [content];

    for (const chunk of chunks) {
      yield chunk;
      await new Promise((resolve) => setTimeout(resolve, 24));
    }
  }

  async generateConversationTitle(
    params: GenerateTitleParams
  ): Promise<GenerateTitleResult> {
    const userMessages = params.messages.filter((message) => message.role === "user");
    const seed = userMessages[0]?.content ?? params.messages[0]?.content ?? "人生处境";
    const topic = detectTopic(seed);

    return {
      title: buildTitle(params.persona.name, topic),
      summary: `围绕${topic}展开，${params.persona.name}以其一贯的时代视角与表达风格回应用户处境。`
    };
  }
}
