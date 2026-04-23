import type { AgentId, AgentMeta } from "../types/agent";

export const agentList: AgentMeta[] = [
  {
    id: "troubleshoot",
    name: "业务排障助手",
    shortName: "排障",
    description: "识别异常场景，收集关键信息并给出处置建议。",
    capability: "异常识别 / 原因定位 / 处置建议",
    category: "运营支撑",
    functionIntro: "围绕订单异常、卡服务异常、应用报错等问题，快速定位问题类型并组织排查路径。",
    domainIntro: "适用于订单执行异常、卡服务不可用、应用报错等运营支撑场景。",
    tags: ["意图识别", "处置建议", "工单联动"],
    route: "/app/agents/troubleshoot",
    status: "featured",
    featured: true,
    accent: "linear-gradient(135deg, #69ddff 0%, #2d7fff 100%)",
  },
  {
    id: "rule-config",
    name: "规则配置类助手",
    shortName: "规则",
    description: "通过对话和结构化卡片快速完成提醒规则与监控规则配置。",
    capability: "诉求识别 / 规则配置 / 校验确认",
    category: "策略编排",
    functionIntro: "支持预警提醒和订单执行监控两类规则配置，自动引导完成参数补全、校验与创建。",
    domainIntro: "适用于提醒策略、订单监控、规则校验、规则管理等配置场景。",
    tags: ["规则校验", "卡片配置", "规则管理"],
    route: "/app/agents/rule-config",
    status: "featured",
    featured: true,
    accent: "linear-gradient(135deg, #65f3d2 0%, #2a9dff 100%)",
  },
  {
    id: "service",
    name: "业务办理助手",
    shortName: "办理",
    description: "识别办理事项，采集参数和材料并推进办理结果确认。",
    capability: "事项识别 / 参数采集 / 办理推进",
    category: "客户服务",
    functionIntro: "围绕套餐变更、补换卡、国际漫游等业务办理场景，逐步收集参数并生成办理结果。",
    domainIntro: "适用于客户服务、业务受理、办理回执等标准办理场景。",
    tags: ["参数采集", "材料确认", "结果回执"],
    route: "/app/agents/service",
    status: "featured",
    featured: true,
    accent: "linear-gradient(135deg, #ffd36e 0%, #ff8c4b 100%)",
  },
  {
    id: "card-query",
    name: "卡信息查询助手",
    shortName: "卡查",
    description: "面向卡状态、套餐、启停和生命周期的快捷查询入口。",
    capability: "状态查询 / 套餐查询 / 生命周期",
    category: "查询服务",
    functionIntro: "快速查询卡状态、套餐信息与生命周期关键节点。",
    domainIntro: "适用于客服查询、运营排查和卡业务基础信息核验。",
    tags: ["查询", "卡信息"],
    route: "/app/agents/card-query",
    status: "preview",
    featured: false,
    accent: "linear-gradient(135deg, #5bc2ff 0%, #4c65ff 100%)",
  },
  {
    id: "knowledge-qa",
    name: "知识问答助手",
    shortName: "问答",
    description: "围绕制度口径、操作规范与业务规则提供问答支持。",
    capability: "知识检索 / 规范问答 / 口径说明",
    category: "知识服务",
    functionIntro: "基于知识库快速返回制度口径、处理规范和操作建议。",
    domainIntro: "适用于培训辅导、业务答疑和标准口径查询。",
    tags: ["问答", "知识库"],
    route: "/app/agents/knowledge-qa",
    status: "preview",
    featured: false,
    accent: "linear-gradient(135deg, #88c7ff 0%, #3aa0ff 100%)",
  },
  {
    id: "data-query",
    name: "数据查询助手",
    shortName: "数查",
    description: "面向业务指标、趋势和维度拆解的数据分析入口。",
    capability: "指标查询 / 趋势跟踪 / 数据分析",
    category: "数据服务",
    functionIntro: "支持业务指标查询、趋势分析与关键维度拆解。",
    domainIntro: "适用于运营分析、经营跟踪和专题数据查看。",
    tags: ["分析", "指标"],
    route: "/app/agents/data-query",
    status: "preview",
    featured: false,
    accent: "linear-gradient(135deg, #65d2ff 0%, #1ca7b8 100%)",
  },
];

export const agentsById = Object.fromEntries(agentList.map((agent) => [agent.id, agent])) as Record<
  AgentId,
  AgentMeta
>;

export const featuredAgents = agentList.filter((agent) => agent.featured);
export const previewAgents = agentList.filter((agent) => !agent.featured);

export const homeHighlights = [
  { label: "可用助手", value: "6 个" },
  { label: "高频入口", value: "3 类" },
  { label: "最近访问", value: "自动记录" },
];

export const stageMoments = [
  "首页聚合高频助手入口、最近访问与规则管理入口。",
  "智能体广场集中展示所有可用助手，支持按场景快速进入。",
  "进入助手后可直接开始对话交互并完成具体任务。",
];
