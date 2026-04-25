import type {
  AgentId,
  ManagedRule,
  RuleAlertRecord,
  RuleExecutionMode,
  RuleField,
  RuleFormValues,
  RuleIntent,
  RuleIntentMatch,
  RuleNotificationChannel,
  RuleObjectType,
  RuleQuickEntry,
  RuleRiskLevel,
  RuleSummary,
  RuleValidationGroup,
  RuleValidationResult,
} from "../types/agent";

const existingObjects: Record<RuleObjectType, string[]> = {
  group: ["华星集团", "华星集团北区", "华星集团政企分部", "云数科技集团", "远海物流集团"],
  account: ["ACC-31001", "ACC-44018", "ACC-88903"],
  customer: ["客户-陈洁", "客户-智造工厂A", "客户-南区连锁门店"],
  order: ["ORD-240301", "ORD-240778", "ORD-241122"],
};

const permissionBlocked = new Set(["云数科技集团", "ACC-88903", "客户-南区连锁门店"]);

const unsupportedAlertTypesByObject: Partial<Record<RuleObjectType, string[]>> = {
  account: ["red-list-expiry"],
  group: ["arrears-risk"],
};

export const ruleQuickEntries: RuleQuickEntry[] = [
  {
    id: "quick-alert",
    title: "预警提醒配置",
    description: "用于预警提醒规则配置。",
    tag: "一级入口",
  },
  {
    id: "quick-order",
    title: "订单执行监控配置",
    description: "用于订单执行状态监控。",
    tag: "一级入口",
  },
];

export const ruleScenarioHighlights = [
  "支持常用场景入口和自然语言两种发起方式。",
  "可直接进入结构化卡片配置，减少重复输入。",
  "创建后可继续查看提醒记录和规则管理。",
];

export const unsupportedRoutingTips: Record<AgentId, { title: string; route: string }> = {
  troubleshoot: { title: "业务排障助手", route: "/app/agents/troubleshoot" },
  service: { title: "业务办理助手", route: "/app/agents/service" },
  "knowledge-qa": { title: "知识问答智能体", route: "/app/agents/knowledge-qa" },
  "data-query": { title: "查询智能体", route: "/app/agents/data-query" },
  "card-query": { title: "卡信息查询智能体", route: "/app/agents/card-query" },
  "rule-config": { title: "规则配置类助手", route: "/app/agents/rule-config" },
};

export const alertTypeLabels: Record<string, string> = {
  "red-list-expiry": "红名单到期",
  "arrears-risk": "欠费风险",
  "plan-expiry": "长周期套餐到期",
};

export const monitorConditionLabels: Record<string, string> = {
  "order-monitor": "订单执行状态监控",
  "in-progress": "执行中",
  failed: "执行失败",
  timeout: "超时未完成",
  "status-change": "状态变更",
};

export const objectTypeLabels: Record<RuleObjectType, string> = {
  group: "集团",
  account: "账户",
  customer: "客户",
  order: "订单号",
};

export const monitorScopeLabels: Record<string, string> = {
  "all-orders": "所有订单",
  "specific-order": "特定订单",
};

export const frequencyLabels: Record<string, string> = {
  once: "仅提醒一次",
  daily: "每日提醒",
  weekly: "每周提醒",
  "until-handled": "持续提醒直到处理",
  instant: "状态变化即提醒",
  "summary-daily": "每日汇总",
  "scheduled-window": "指定时段提醒",
};

export const effectiveLabels: Record<string, string> = {
  "long-term": "长期有效",
  "time-range": "指定时间范围内有效",
  "one-time": "一次性监控",
  "until-complete": "持续监控至完成",
};

export const executionLabels: Record<RuleExecutionMode, string> = {
  "event-trigger": "实时触发",
  "scheduled-scan": "定时扫描",
  "status-event": "状态变化触发",
  "async-scan": "异步定时扫描",
  "summary-check": "汇总检查",
};

export const ruleStatusLabels = {
  draft: "草稿",
  "pending-confirmation": "待确认",
  creating: "创建中",
  "create-failed": "创建失败",
  pending: "待生效",
  active: "启用中",
  paused: "暂停中",
  error: "执行异常",
  completed: "已完成",
  expired: "已失效",
  terminated: "已终止",
} as const;

type SupportedRuleIntent = Exclude<RuleIntent, "unsupported">;

interface ParsedObjectMatch {
  objectType?: RuleObjectType;
  objectValue?: string;
}

export interface NaturalRuleDraftResult {
  intentMatch: RuleIntentMatch;
  values: RuleFormValues;
  missingLabels: string[];
  validationResult: RuleValidationResult | null;
  summary: RuleSummary | null;
}

export interface RuleObjectCandidate {
  objectType: RuleObjectType;
  value: string;
}

export interface RuleObjectResolution {
  status: "empty" | "not-found" | "multiple" | "forbidden" | "resolved";
  candidates: RuleObjectCandidate[];
  matched?: RuleObjectCandidate;
  message: string;
}

function detectObjectMatch(request: string, intent: SupportedRuleIntent): ParsedObjectMatch {
  const text = request.trim();

  for (const [objectType, candidates] of Object.entries(existingObjects) as Array<[RuleObjectType, string[]]>) {
    if (intent === "alert" && objectType === "order") continue;
    if (intent === "order-monitor" && objectType === "customer") continue;

    const matched = candidates.find((candidate) => text.includes(candidate));
    if (matched) {
      return { objectType, objectValue: matched };
    }
  }

  const demoObject = detectDemoObjectAlias(text, intent);
  if (demoObject.objectType || demoObject.objectValue) {
    return demoObject;
  }

  if (intent === "alert") {
    if (text.includes("集团")) return { objectType: "group" };
    if (text.includes("账户")) return { objectType: "account" };
  }

  if (intent === "order-monitor") {
    if (text.includes("订单")) return { objectType: "order" };
    if (text.includes("集团")) return { objectType: "group" };
    if (text.includes("客户")) return { objectType: "customer" };
  }

  return {};
}

function detectDemoObjectAlias(text: string, intent: SupportedRuleIntent): ParsedObjectMatch {
  if (intent !== "alert" && intent !== "order-monitor") return {};

  if (text.includes("不存在集团")) return { objectType: "group", objectValue: "不存在集团" };
  if (text.includes("受限集团")) return { objectType: "group", objectValue: "云数科技集团" };
  if (text.includes("华星")) return { objectType: "group", objectValue: "华星" };

  return {};
}

function searchableObjectTypes(_intent: SupportedRuleIntent, objectType?: RuleObjectType) {
  if (objectType) return [objectType];
  return ["group", "account"] as RuleObjectType[];
}

export function resolveRuleObject(
  intent: SupportedRuleIntent,
  values: RuleFormValues,
): RuleObjectResolution {
  const keyword = values.objectValue?.trim();
  if (!keyword) {
    return {
      status: "empty",
      candidates: [],
      message: "请先输入监控对象名称、编号或订单号，我再帮你继续匹配。",
    };
  }

  const searchableTypes = searchableObjectTypes(intent, values.objectType);
  const exactCandidates = searchableTypes.flatMap((objectType) =>
    existingObjects[objectType]
      .filter((candidate) => candidate === keyword)
      .map((value) => ({ objectType, value })),
  );
  const candidates = exactCandidates.length
    ? exactCandidates
    : searchableTypes.flatMap((objectType) =>
        existingObjects[objectType]
          .filter((candidate) => candidate.includes(keyword) || keyword.includes(candidate))
          .map((value) => ({ objectType, value })),
      );

  if (!candidates.length) {
    return {
      status: "not-found",
      candidates: [],
      message: `没有找到与“${keyword}”匹配的监控对象，请重新输入或换一个对象试试。`,
    };
  }

  if (candidates.length > 1) {
    return {
      status: "multiple",
      candidates,
      message: `我找到 ${candidates.length} 个可能的对象，请你确认要监控的是哪一个。`,
    };
  }

  const matched = candidates[0];
  if (permissionBlocked.has(matched.value)) {
    return {
      status: "forbidden",
      candidates,
      matched,
      message: `当前账号暂时没有权限监控“${matched.value}”，你可以换一个对象继续创建。`,
    };
  }

  return {
    status: "resolved",
    candidates,
    matched,
    message: `已匹配到监控对象“${matched.value}”，我会按这个对象继续为你生成规则。`,
  };
}

function inferNotifyChannels(_request: string): RuleNotificationChannel[] {
  return ["notification-center"];
}

function inferAlertValues(request: string, baseValues: RuleFormValues): RuleFormValues {
  const values: RuleFormValues = {
    ...baseValues,
    alertFrequency: "once",
    notifyChannels: inferNotifyChannels(request),
    effectivePeriod: "long-term",
  };

  if (request.includes("红名单")) {
    values.alertType = "red-list-expiry";
    values.alertTimingMode = "days-before";
  } else if (request.includes("欠费")) {
    values.alertType = "arrears-risk";
    values.alertTimingMode = "condition-hit";
  } else if (
    request.includes("套餐到期") ||
    request.includes("长周期套餐") ||
    request.includes("长周期到期") ||
    request.includes("套餐快到期") ||
    request.includes("长周期快到期")
  ) {
    values.alertType = "plan-expiry";
    values.alertTimingMode = "days-before";
  } else if (request.includes("到期")) {
    values.alertType = "red-list-expiry";
    values.alertTimingMode = "days-before";
  }

  if (request.includes("达到条件") || request.includes("有风险时") || request.includes("出现")) {
    values.alertTimingMode = "condition-hit";
  }

  const offsetMatch = request.match(/(\d+)\s*天/);
  if (offsetMatch && values.alertTimingMode === "days-before") {
    values.alertOffset = offsetMatch[1];
  }

  if (request.includes("每天") || request.includes("每日")) {
    values.alertFrequency = "daily";
  } else if (request.includes("每周")) {
    values.alertFrequency = "weekly";
  } else if (request.includes("持续")) {
    values.alertFrequency = "until-handled";
  }

  return values;
}

function inferOrderValues(request: string, baseValues: RuleFormValues): RuleFormValues {
  const values: RuleFormValues = {
    ...baseValues,
    notifyChannels: inferNotifyChannels(request),
    effectivePeriod: "until-complete",
    monitorCondition: "status-change",
    monitorThreshold: "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
  };

  const matchedOrder = existingObjects.order.find((candidate) => request.includes(candidate));
  if (matchedOrder) {
    values.monitorSpecificOrder = matchedOrder;
  }

  return values;
}

function buildSuggestedRuleName(intent: SupportedRuleIntent, values: RuleFormValues, request: string) {
  if (intent === "alert" && values.objectValue && values.alertType) {
    return `${values.objectValue}${alertTypeLabels[values.alertType]}`;
  }

  if (intent === "order-monitor" && values.objectValue && values.monitorSpecificOrder) {
    return `${values.objectValue}${values.monitorSpecificOrder}订单执行监控`;
  }

  return request.slice(0, 18);
}

export function buildNaturalRuleDraft(
  request: string,
  existingRules: ManagedRule[],
  editingRuleId?: string | null,
): NaturalRuleDraftResult {
  const intentMatch = detectRuleIntent(request);

  if (intentMatch.intent === "unsupported") {
    return {
      intentMatch,
      values: { naturalRequest: request },
      missingLabels: [],
      validationResult: null,
      summary: null,
    };
  }

  const objectMatch = detectObjectMatch(request, intentMatch.intent);
  const baseValues: RuleFormValues = {
    naturalRequest: request,
    ...objectMatch,
  };

  const values =
    intentMatch.intent === "alert"
      ? inferAlertValues(request, baseValues)
      : inferOrderValues(request, baseValues);

  values.ruleName = buildSuggestedRuleName(intentMatch.intent, values, request);

  const missingLabels = getRuleFields(intentMatch.intent, values)
    .filter((field) => field.required)
    .filter((field) => {
      const value = values[field.id as keyof RuleFormValues];
      return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
    })
    .map((field) => field.label);

  const validationResult =
    missingLabels.length === 0 ? validateRuleForm(intentMatch.intent, values, existingRules, editingRuleId) : null;
  const summary =
    missingLabels.length === 0 && validationResult && (validationResult.passed || validationResult.allowDuplicateContinue)
      ? buildRuleSummary(intentMatch.intent, values)
      : null;

  return {
    intentMatch,
    values,
    missingLabels,
    validationResult,
    summary,
  };
}

export function detectRuleIntent(request: string): RuleIntentMatch {
  const text = request.trim().toLowerCase();

  const alertKeywords = ["红名单", "欠费", "套餐到期", "长周期套餐", "长周期到期", "套餐快到期", "到期", "预警", "提醒"];
  const orderKeywords = ["订单", "执行情况", "执行失败", "状态变化", "卡单", "超时未完成"];
  const unsupportedMap: Array<{ keywords: string[]; agent: AgentId; reason: string }> = [
    { keywords: ["故障", "排障", "失败原因", "卡单"], agent: "troubleshoot", reason: "更适合先进入业务排障助手处理异常。" },
    { keywords: ["怎么做", "口径", "政策", "问答"], agent: "knowledge-qa", reason: "更适合使用知识问答智能体进行口径查询。" },
    { keywords: ["查询", "明细", "状态"], agent: "data-query", reason: "更适合切换到查询类智能体查看结果。" },
  ];

  if (alertKeywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
    return { intent: "alert", reason: "识别到预警、到期、欠费等提醒型关键词。" };
  }

  if (orderKeywords.some((keyword) => text.includes(keyword.toLowerCase()))) {
    return { intent: "order-monitor", reason: "识别到订单、执行监控、失败通知等监控型关键词。" };
  }

  const matchedUnsupported = unsupportedMap.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword.toLowerCase())),
  );

  if (matchedUnsupported) {
    return {
      intent: "unsupported",
      reason: matchedUnsupported.reason,
      suggestedAgentId: matchedUnsupported.agent,
    };
  }

  return {
    intent: "unsupported",
    reason: "未识别为规则配置类诉求，建议切换到其他智能体继续处理。",
    suggestedAgentId: "knowledge-qa",
  };
}

export function getRuleFields(intent: Exclude<RuleIntent, "unsupported">, values: RuleFormValues): RuleField[] {
  const baseFields: RuleField[] = [
    {
      id: "ruleName",
      label: "规则名称",
      type: "text",
      required: true,
      placeholder: intent === "alert" ? "例如：华星集团红名单到期提醒" : "例如：华星集团订单执行监控",
    },
    {
      id: "objectType",
      label: "监控对象",
      type: "select",
      required: true,
      options: [
        { label: "集团", value: "group" },
        { label: "账户", value: "account" },
      ],
    },
    {
      id: "objectValue",
      label: "对象名称/编号",
      type: "text",
      required: true,
      placeholder: values.objectType === "account" ? "例如：ACC-31001" : "例如：华星集团",
      helper: values.objectType ? `可用对象示例：${existingObjects[values.objectType].join("、")}` : "先选择监控对象类型。",
    },
  ];

  if (intent === "alert") {
    return [
      ...baseFields,
      {
        id: "alertType",
        label: "预警类型",
        type: "select",
        required: true,
        options: [
          { label: "红名单到期", value: "red-list-expiry" },
          { label: "欠费风险", value: "arrears-risk" },
          { label: "长周期套餐到期", value: "plan-expiry" },
        ],
      },
      ...(values.alertType === "arrears-risk"
        ? []
        : [
            {
              id: "alertOffset",
              label: "提前提醒天数",
              type: "number" as const,
              required: true,
              min: 1,
              max: 365,
              placeholder: "请输入提前几天提醒",
              helper: "例如填写 3，表示到期前 3 天提醒。",
            },
          ]),
      ...effectivePeriodFields(values, "alert"),
    ];
  }

  return [
    ...baseFields,
    {
      id: "monitorSpecificOrder",
      label: "订单号",
      type: "text",
      required: true,
      placeholder: "例如：ORD-240301",
      helper: `可用订单示例：${existingObjects.order.join("、")}`,
    },
    {
      id: "monitorThreshold",
      label: "监控内容",
      type: "textarea",
      placeholder: "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
      helper: "系统默认通过 APP 内消息提醒，并持续监控至订单结束。",
    },
  ];
}

function effectivePeriodFields(values: RuleFormValues, intent: Exclude<RuleIntent, "unsupported">): RuleField[] {
  const options =
    intent === "alert"
      ? [
          { label: "长期有效", value: "long-term" },
          { label: "指定时间范围内有效", value: "time-range" },
        ]
      : [
          { label: "一次性监控", value: "one-time" },
          { label: "持续监控至完成", value: "until-complete" },
          { label: "指定时间范围内有效", value: "time-range" },
        ];

  const fields: RuleField[] = [
    {
      id: "effectivePeriod",
      label: "生效周期",
      type: "radio",
      required: true,
      options,
    },
  ];

  if (values.effectivePeriod === "time-range") {
    fields.push(
      {
        id: "effectiveStart",
        label: "开始日期",
        type: "date",
        required: true,
      },
      {
        id: "effectiveEnd",
        label: "结束日期",
        type: "date",
        required: true,
      },
    );
  }

  return fields;
}

export function validateRuleForm(
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
  existingRules: ManagedRule[],
  editingRuleId?: string | null,
): RuleValidationResult {
  const groups: RuleValidationGroup[] = [
    { key: "object", title: "对象校验", issues: [] },
    { key: "rule", title: "规则校验", issues: [] },
    { key: "duplicate", title: "重复校验", issues: [] },
    { key: "capacity", title: "资源与开销校验", issues: [] },
  ];

  const objectGroup = groups[0];
  const ruleGroup = groups[1];
  const duplicateGroup = groups[2];
  const capacityGroup = groups[3];

  if (!values.objectType || !values.objectValue?.trim()) {
    objectGroup.issues.push({ type: "object", severity: "error", title: "监控对象不完整", detail: "请选择监控对象类型并填写对象名称或编号。" });
  } else {
    const candidates = existingObjects[values.objectType];
    if (!candidates.includes(values.objectValue.trim())) {
      objectGroup.issues.push({ type: "object", severity: "error", title: "对象不存在", detail: `${objectTypeLabels[values.objectType]}“${values.objectValue}”不存在，请检查对象名称或编号。` });
    }
    if (permissionBlocked.has(values.objectValue.trim())) {
      objectGroup.issues.push({ type: "object", severity: "error", title: "无监控权限", detail: `当前账号暂时没有权限监控“${values.objectValue}”。` });
    }
  }

  if (!values.ruleName?.trim()) {
    ruleGroup.issues.push({ type: "rule", severity: "error", title: "规则名称缺失", detail: "请补充规则名称，方便在我的规则中管理。" });
  }

  if (intent === "alert") {
    if (!values.alertType) {
      ruleGroup.issues.push({ type: "rule", severity: "error", title: "未选择预警类型", detail: "请选择红名单到期、欠费风险或长周期套餐到期。" });
    }
    if (values.objectType && values.alertType && unsupportedAlertTypesByObject[values.objectType]?.includes(values.alertType)) {
      ruleGroup.issues.push({ type: "rule", severity: "error", title: "对象类型暂不支持当前规则", detail: `${objectTypeLabels[values.objectType]}暂不支持“${alertTypeLabels[values.alertType]}”。` });
    }
    if (values.alertType !== "arrears-risk") {
      if (!values.alertOffset?.trim()) {
        ruleGroup.issues.push({ type: "rule", severity: "error", title: "未填写提前提醒天数", detail: "请填写需要提前多少天提醒。" });
      } else if (!/^\d+$/.test(values.alertOffset) || Number(values.alertOffset) <= 0 || Number(values.alertOffset) > 365) {
        ruleGroup.issues.push({ type: "rule", severity: "error", title: "提前提醒天数不合法", detail: "提前提醒天数需填写 1 到 365 之间的正整数。" });
      }
    } else {
      values.alertTimingMode = "condition-hit";
      values.alertFrequency = "once";
    }
  }

  if (intent === "order-monitor") {
    values.notifyChannels = ["notification-center"];
    values.effectivePeriod = "until-complete";
    values.monitorCondition = "status-change";
    if (!values.monitorThreshold?.trim()) {
      values.monitorThreshold = "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因";
    }
    if (!values.monitorSpecificOrder?.trim()) {
      ruleGroup.issues.push({ type: "rule", severity: "error", title: "订单号缺失", detail: "请补充需要持续监控的订单号。" });
    } else if (!existingObjects.order.includes(values.monitorSpecificOrder.trim())) {
      objectGroup.issues.push({ type: "object", severity: "error", title: "订单号不存在", detail: `订单号“${values.monitorSpecificOrder}”不存在，请检查后重新输入。` });
    }
  }

  if (values.effectivePeriod === "time-range") {
    if (!values.effectiveStart || !values.effectiveEnd) {
      ruleGroup.issues.push({ type: "rule", severity: "error", title: "生效周期不完整", detail: "指定时间范围内有效时，需要同时填写开始和结束日期。" });
    } else if (values.effectiveStart > values.effectiveEnd) {
      ruleGroup.issues.push({ type: "rule", severity: "error", title: "生效周期不合法", detail: "结束日期不能早于开始日期。" });
    }
  }

  const comparableRules = existingRules.filter((item) => item.id !== editingRuleId);
  const duplicate = comparableRules.find((item) => item.intent === intent && item.objectType === values.objectType && item.objectValue === values.objectValue && item.primaryCondition === getPrimaryCondition(intent, values));

  if (duplicate) {
    duplicateGroup.issues.push({ type: "duplicate", severity: "warning", title: "已存在相同规则", detail: `规则“${duplicate.name}”与当前配置高度一致，默认不建议重复创建。` });
  }

  const similarCount = comparableRules.filter((item) => item.intent === intent && item.objectType === values.objectType && item.objectValue === values.objectValue && item.primaryCondition !== getPrimaryCondition(intent, values)).length;
  if (similarCount >= 2) {
    duplicateGroup.issues.push({ type: "duplicate", severity: "warning", title: "存在较多相近规则", detail: `当前对象下已有 ${similarCount} 条相近规则，建议先查看已有规则。` });
  }

  const activeRules = existingRules.filter((item) => item.status === "active").length;
  if (activeRules >= 5) {
    capacityGroup.issues.push({ type: "capacity", severity: "warning", title: "规则数量接近上限", detail: "当前账号已配置较多规则，建议优先清理重复规则。" });
  }

  const hasBlockingError = groups.some((group) => group.issues.some((issue) => issue.severity === "error"));
  const allowDuplicateContinue = Boolean(duplicate) && !hasBlockingError;
  const passed = !hasBlockingError;
  const summary = hasBlockingError
    ? "存在需要处理的问题，请修改后重新校验。"
    : allowDuplicateContinue
      ? "检测到已存在相同规则，默认不建议重复创建。你可以查看已有规则，也可以继续创建。"
      : "校验通过，可以进入规则确认摘要页。";

  return { passed, groups, summary, duplicateRuleId: duplicate?.id, allowDuplicateContinue };
}

export function buildRuleSummary(intent: Exclude<RuleIntent, "unsupported">, values: RuleFormValues): RuleSummary {
  const executionMode = resolveExecutionMode(intent, values);
  const items =
    intent === "alert"
      ? [
          { label: "规则类型", value: "预警提醒类" },
          { label: "监控对象", value: `${objectTypeLabels[values.objectType as RuleObjectType]} / ${values.objectValue ?? "-"}` },
          { label: "预警类型", value: alertTypeLabels[values.alertType ?? ""] ?? "-" },
          { label: "提醒时间", value: formatAlertTiming(values) },
          { label: "生效周期", value: formatEffective(values) },
          { label: "执行方式说明", value: executionLabels[executionMode] },
        ]
      : [
          { label: "规则类型", value: "订单执行监控类" },
          { label: "监控对象", value: `${objectTypeLabels[values.objectType as RuleObjectType]} / ${values.objectValue ?? "-"}` },
          { label: "订单号", value: values.monitorSpecificOrder ?? "-" },
          {
            label: "监控内容",
            value: values.monitorThreshold ?? "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
          },
          { label: "通知方式", value: "APP内消息" },
          { label: "监控周期", value: "持续监控至订单结束" },
          { label: "执行方式说明", value: executionLabels[executionMode] },
        ];

  return {
    title: values.ruleName ?? "规则摘要",
    description:
      intent === "alert"
        ? "系统将根据预警提醒规则持续监控目标对象。"
        : "系统将默认持续跟踪订单执行状态，并在 APP 消息中心推送异常结果。",
    items,
    executionMode,
    executionLabel: executionLabels[executionMode],
    note:
      intent === "alert" && executionMode === "scheduled-scan"
        ? "当前规则采用定时扫描方式，提醒可能存在轻微时延。"
        : "当前规则支持实时状态触发，命中后会即时生成提醒。",
  };
}

export function resolveExecutionMode(
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
): RuleExecutionMode {
  if (intent === "alert") {
    return values.alertTimingMode === "condition-hit" ? "event-trigger" : "scheduled-scan";
  }
  return "status-event";
}

export function createManagedRule(
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
  createdBy: string,
): ManagedRule {
  const summary = buildRuleSummary(intent, values);
  const nextStatus =
    values.effectivePeriod === "time-range" && values.effectiveStart && values.effectiveStart > "2026-04-23" ? "pending" : "active";
  return {
    id: `RULE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: values.ruleName ?? "未命名规则",
    intent,
    objectType: values.objectType as RuleObjectType,
    objectValue: values.objectValue ?? "",
    scopeLabel: intent === "order-monitor" ? (values.monitorSpecificOrder ?? "-") : formatMonitorScope(values),
    primaryCondition: getPrimaryCondition(intent, values),
    frequencyLabel: intent === "alert" ? frequencyLabels[values.alertFrequency ?? ""] : "持续监控至订单结束",
    notifyChannels: (values.notifyChannels ?? []) as RuleNotificationChannel[],
    effectiveLabel: intent === "order-monitor" ? "持续监控至订单结束" : formatEffective(values),
    executionMode: summary.executionMode,
    executionLabel: summary.executionLabel,
    status: nextStatus,
    createdAt: "2026-04-23 09:36",
    createdBy,
    values: { ...values },
    summary,
    bindingLabel: summary.executionLabel,
    statusHistory: [
      { status: "draft", timestamp: "2026-04-23 09:34", note: "已生成规则草稿。" },
      { status: "pending-confirmation", timestamp: "2026-04-23 09:35", note: "规则摘要已确认，准备创建。" },
      { status: "creating", timestamp: "2026-04-23 09:36", note: "正在绑定执行策略并写入规则中心。" },
      {
        status: nextStatus,
        timestamp: "2026-04-23 09:36",
        note: nextStatus === "pending" ? "规则将在生效周期开始后自动启用。" : "规则创建成功，已进入启用状态。",
      },
    ],
  };
}

export function buildAlertPreview(rule: ManagedRule): RuleAlertRecord[] {
  if (rule.intent === "alert") {
    return [
      {
        id: `${rule.id}-ALERT-1`,
        ruleId: rule.id,
        ruleName: rule.name,
        ruleTypeLabel: "预警提醒类",
        objectValue: rule.objectValue,
        currentStatus: "命中预警条件",
        reason: buildAlertHitReason(rule),
        triggeredAt: "2026-04-25 10:20",
        recommendation: "查看详情并确认是否需要继续跟踪或调整规则。",
        notificationChannels: rule.notifyChannels,
        followUpStatus: "new",
        riskLevel: resolveRiskLevel(rule),
        handlingStatus: "待处理",
        secondaryReminderHint: resolveSecondaryReminder(rule),
        suggestedRoute: "/app/my-rules",
      },
    ];
  }

  return [
    {
      id: `${rule.id}-ALERT-1`,
      ruleId: rule.id,
      ruleName: rule.name,
      ruleTypeLabel: "订单执行监控类",
      objectValue: rule.objectValue,
      currentStatus: "订单状态异常",
      reason: buildOrderHitReason(rule),
      triggeredAt: "2026-04-25 15:08",
      recommendation: "如涉及失败、超时未完成或卡单，可跳转业务排障助手继续处理。",
      notificationChannels: rule.notifyChannels,
      followUpStatus: "new",
      riskLevel: resolveRiskLevel(rule),
      handlingStatus: "待处理",
      secondaryReminderHint: resolveSecondaryReminder(rule),
      suggestedAgentId: "troubleshoot",
      suggestedRoute: "/app/agents/troubleshoot",
    },
  ];
}

export const starterRules: ManagedRule[] = [
  createStarterRule(
    "RULE-AL1001",
    "华星集团红名单到期提醒",
    "alert",
    {
      ruleName: "华星集团红名单到期提醒",
      objectType: "group",
      objectValue: "华星集团",
      alertType: "red-list-expiry",
      alertTimingMode: "days-before",
      alertOffset: "3",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "long-term",
    },
    "active",
    "2026-04-18 10:20",
  ),
  createStarterRule(
    "RULE-AL1002",
    "ACC-44018欠费风险提醒",
    "alert",
    {
      ruleName: "ACC-44018欠费风险提醒",
      objectType: "account",
      objectValue: "ACC-44018",
      alertType: "arrears-risk",
      alertTimingMode: "condition-hit",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "long-term",
    },
    "paused",
    "2026-04-16 16:45",
  ),
  createStarterRule(
    "RULE-OM2001",
    "华星集团订单执行监控",
    "order-monitor",
    {
      ruleName: "华星集团订单执行监控",
      objectType: "group",
      objectValue: "华星集团",
      monitorSpecificOrder: "ORD-240301",
      monitorCondition: "status-change",
      monitorTimingMode: "status-change",
      monitorThreshold: "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
      notifyChannels: ["notification-center"],
      effectivePeriod: "until-complete",
    },
    "active",
    "2026-04-21 09:10",
  ),
  createStarterRule(
    "RULE-OM2002",
    "ACC-31001套餐到期提醒（历史）",
    "alert",
    {
      ruleName: "ACC-31001套餐到期提醒（历史）",
      objectType: "account",
      objectValue: "ACC-31001",
      alertType: "plan-expiry",
      alertTimingMode: "days-before",
      alertOffset: "7",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "time-range",
      effectiveStart: "2026-03-01",
      effectiveEnd: "2026-03-31",
    },
    "expired",
    "2026-03-01 11:35",
  ),
  createStarterRule(
    "RULE-AL1003",
    "ACC-31001长周期套餐到期提醒",
    "alert",
    {
      ruleName: "ACC-31001长周期套餐到期提醒",
      objectType: "account",
      objectValue: "ACC-31001",
      alertType: "plan-expiry",
      alertTimingMode: "days-before",
      alertOffset: "7",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "time-range",
      effectiveStart: "2026-04-28",
      effectiveEnd: "2026-05-28",
    },
    "pending",
    "2026-04-24 09:15",
  ),
  createStarterRule(
    "RULE-OM2003",
    "ACC-44018订单执行监控",
    "order-monitor",
    {
      ruleName: "ACC-44018订单执行监控",
      objectType: "account",
      objectValue: "ACC-44018",
      monitorSpecificOrder: "ORD-240778",
      monitorCondition: "status-change",
      monitorTimingMode: "status-change",
      monitorThreshold: "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
      notifyChannels: ["notification-center"],
      effectivePeriod: "until-complete",
    },
    "error",
    "2026-04-19 12:10",
  ),
  createStarterRule(
    "RULE-OM2004",
    "华星集团订单执行监控（已完成）",
    "order-monitor",
    {
      ruleName: "华星集团订单执行监控（已完成）",
      objectType: "group",
      objectValue: "华星集团",
      monitorSpecificOrder: "ORD-241122",
      monitorCondition: "status-change",
      monitorTimingMode: "status-change",
      monitorThreshold: "执行完成、执行失败、卡单或长时间未完成，批量订单成功失败数量及失败原因",
      notifyChannels: ["notification-center"],
      effectivePeriod: "one-time",
    },
    "completed",
    "2026-04-14 18:20",
  ),
  createStarterRule(
    "RULE-AL1004",
    "ACC-31001欠费风险提醒（已终止）",
    "alert",
    {
      ruleName: "ACC-31001欠费风险提醒（已终止）",
      objectType: "account",
      objectValue: "ACC-31001",
      alertType: "arrears-risk",
      alertTimingMode: "condition-hit",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "long-term",
    },
    "terminated",
    "2026-04-08 15:40",
  ),
];

export const starterAlerts: RuleAlertRecord[] = [
  {
    id: "ALERT-1",
    ruleId: "RULE-AL1001",
    ruleName: "华星集团红名单到期提醒",
    ruleTypeLabel: "预警提醒类",
    objectValue: "华星集团",
    currentStatus: "3天后到期",
    reason: "华星集团红名单将在3天后到期。",
    triggeredAt: "2026-04-22 09:40",
    recommendation: "建议联系客户经理确认续期安排，并视情况调整提醒频率。",
    notificationChannels: ["notification-center"],
    followUpStatus: "tracking",
    riskLevel: "medium",
    handlingStatus: "跟进中",
    secondaryReminderHint: "若到期前仍未处理，系统会继续提醒。",
    suggestedRoute: "/app/my-rules",
  },
  {
    id: "ALERT-2",
    ruleId: "RULE-OM2001",
    ruleName: "ORD-240301执行失败提醒",
    ruleTypeLabel: "订单执行监控类",
    objectValue: "ORD-240301",
    currentStatus: "执行失败",
    reason: "订单 ORD-240301 执行失败，已达到即时提醒条件。",
    triggeredAt: "2026-04-22 14:12",
    recommendation: "建议跳转业务排障助手继续处理失败原因。",
    notificationChannels: ["notification-center"],
    followUpStatus: "new",
    riskLevel: "high",
    handlingStatus: "待处理",
    secondaryReminderHint: "高风险事件会优先展示，并追加二次提醒。",
    suggestedAgentId: "troubleshoot",
    suggestedRoute: "/app/agents/troubleshoot",
  },
];

function createStarterRule(
  id: string,
  name: string,
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
  status: ManagedRule["status"],
  createdAt: string,
): ManagedRule {
  const summary = buildRuleSummary(intent, values);
  return {
    id,
    name,
    intent,
    objectType: values.objectType as RuleObjectType,
    objectValue: values.objectValue ?? "",
    scopeLabel: intent === "order-monitor" ? (values.monitorSpecificOrder ?? "-") : formatMonitorScope(values),
    primaryCondition: getPrimaryCondition(intent, values),
    frequencyLabel: intent === "alert" ? frequencyLabels[values.alertFrequency ?? ""] : "持续监控至订单结束",
    notifyChannels: (values.notifyChannels ?? []) as RuleNotificationChannel[],
    effectiveLabel: intent === "order-monitor" ? "持续监控至订单结束" : formatEffective(values),
    executionMode: summary.executionMode,
    executionLabel: summary.executionLabel,
    status,
    createdAt,
    createdBy: "业务体验官",
    values,
    summary,
    bindingLabel: summary.executionLabel,
    latestFailureReason:
      status === "error"
        ? "最近一次扫描任务执行失败，系统已暂停自动提醒，等待重新绑定。"
        : status === "create-failed"
          ? "规则创建失败，当前配置已保留，可重新提交或保存为草稿。"
          : undefined,
    statusHistory: [
      { status: "draft", timestamp: createdAt, note: "规则草稿已生成。" },
      { status: "pending-confirmation", timestamp: createdAt, note: "规则已确认待创建。" },
      { status: "creating", timestamp: createdAt, note: "规则已提交执行绑定。" },
      { status, timestamp: createdAt, note: `规则当前状态为${ruleStatusLabels[status]}。` },
    ],
  };
}

function getPrimaryCondition(intent: Exclude<RuleIntent, "unsupported">, values: RuleFormValues): string {
  return intent === "alert" ? values.alertType ?? "" : "order-monitor";
}

function formatAlertTiming(values: RuleFormValues): string {
  if (values.alertTimingMode === "days-before") {
    return `到期前 ${values.alertOffset ?? "N"} 天提醒`;
  }
  return "达到条件时提醒";
}

function formatMonitorScope(values: RuleFormValues): string {
  if (values.objectType !== "group" && values.objectType !== "customer") {
    return values.objectType === "order" ? "单订单监控" : "-";
  }

  if (values.monitorScope === "specific-order") {
    return `${monitorScopeLabels["specific-order"]}${values.monitorSpecificOrder ? ` / ${values.monitorSpecificOrder}` : ""}`;
  }

  return monitorScopeLabels[values.monitorScope ?? "all-orders"] ?? "所有订单";
}

function formatEffective(values: RuleFormValues): string {
  if (values.effectivePeriod === "time-range") {
    return `${effectiveLabels[values.effectivePeriod]} (${values.effectiveStart} 至 ${values.effectiveEnd})`;
  }
  return effectiveLabels[values.effectivePeriod ?? ""] ?? "-";
}

function resolveRiskLevel(rule: ManagedRule): RuleRiskLevel {
  if (rule.intent === "alert") {
    return rule.values.alertType === "arrears-risk" ? "high" : rule.values.alertType === "red-list-expiry" ? "medium" : "low";
  }

  if (rule.values.monitorCondition === "failed") return "high";
  if (rule.values.monitorCondition === "timeout") {
    return Number(rule.values.monitorThreshold ?? "0") >= 48 ? "high" : "medium";
  }
  return "medium";
}

function resolveSecondaryReminder(rule: ManagedRule) {
  const riskLevel = resolveRiskLevel(rule);
  if (riskLevel !== "high") return undefined;
  return "高风险事件会优先展示，必要时会追加二次提醒。";
}

function buildAlertHitReason(rule: ManagedRule): string {
  if (rule.values.alertType === "red-list-expiry") return `${rule.objectValue}红名单将于 ${rule.values.alertOffset ?? "3"} 天后到期。`;
  if (rule.values.alertType === "arrears-risk") return `${rule.objectValue}存在欠费风险，已达到提醒条件。`;
  if (rule.values.alertType === "plan-expiry") return `${rule.objectValue}长周期套餐将于 ${rule.values.alertOffset ?? "7"} 天后到期。`;
  return `${rule.objectValue}命中“${alertTypeLabels[rule.values.alertType ?? "red-list-expiry"]}”提醒条件。`;
}

function buildOrderHitReason(rule: ManagedRule): string {
  return `订单 ${rule.values.monitorSpecificOrder ?? "-"} 出现执行异常：2 笔成功、1 笔失败，失败原因已同步到消息中心。`;
}
