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
  RuleSummary,
  RuleValidationGroup,
  RuleValidationResult,
} from "../types/agent";

const existingObjects: Record<RuleObjectType, string[]> = {
  group: ["华星集团", "云数科技集团", "远海物流集团"],
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
    description: "用于红名单到期、欠费风险、长周期套餐到期等提醒配置。",
    tag: "一级入口",
  },
  {
    id: "quick-order",
    title: "订单执行监控配置",
    description: "用于订单执行中、失败、超时未完成、状态变化的监控提醒。",
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
  "contract-renewal": "其他已支持预警类型",
};

export const monitorConditionLabels: Record<string, string> = {
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

export function detectRuleIntent(request: string): RuleIntentMatch {
  const text = request.trim().toLowerCase();

  const alertKeywords = ["红名单", "欠费", "套餐到期", "到期", "预警", "提醒"];
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
      placeholder: intent === "alert" ? "例如：华星集团红名单到期提醒" : "例如：重点订单失败提醒",
    },
    {
      id: "objectType",
      label: "监控对象",
      type: "radio",
      required: true,
      options:
        intent === "alert"
          ? [
              { label: "集团", value: "group" },
              { label: "账户", value: "account" },
              { label: "客户", value: "customer" },
            ]
          : [
              { label: "订单号", value: "order" },
              { label: "集团", value: "group" },
              { label: "客户", value: "customer" },
            ],
    },
    {
      id: "objectValue",
      label: "对象名称/编号",
      type: "text",
      required: true,
      placeholder:
        values.objectType === "order"
          ? "例如：ORD-240301"
          : values.objectType === "account"
            ? "例如：ACC-31001"
            : "例如：华星集团 / 客户-陈洁",
      helper: values.objectType ? `可用对象示例：${existingObjects[values.objectType].join("、")}` : "先选择监控对象类型。",
    },
  ];

  if (intent === "alert") {
    const fields: RuleField[] = [
      ...baseFields,
      {
        id: "alertType",
        label: "预警类型",
        type: "radio",
        required: true,
        options: [
          { label: "红名单到期", value: "red-list-expiry" },
          { label: "欠费风险", value: "arrears-risk" },
          { label: "长周期套餐到期", value: "plan-expiry" },
          { label: "其他已支持预警类型", value: "contract-renewal" },
        ],
      },
      {
        id: "alertTimingMode",
        label: "提醒时间",
        type: "radio",
        required: true,
        options: [
          { label: "到期前N天", value: "days-before" },
          { label: "到期前N个工作日", value: "workdays-before" },
          { label: "达到条件时提醒", value: "condition-hit" },
        ],
      },
      {
        id: "alertFrequency",
        label: "提醒频率",
        type: "radio",
        required: true,
        options: [
          { label: "仅提醒一次", value: "once" },
          { label: "每日提醒", value: "daily" },
          { label: "每周提醒", value: "weekly" },
          { label: "持续提醒直到处理", value: "until-handled" },
        ],
      },
      ...notifyChannelFields(values),
      ...effectivePeriodFields(values, "alert"),
    ];
    return fields;
  }

  const orderFields: RuleField[] = [
    ...baseFields,
    {
      id: "monitorCondition",
      label: "监控条件",
      type: "radio",
      required: true,
      options: [
        { label: "执行中", value: "in-progress" },
        { label: "执行失败", value: "failed" },
        { label: "超时未完成", value: "timeout" },
        { label: "状态变更", value: "status-change" },
      ],
    },
    {
      id: "monitorTimingMode",
      label: "提醒时间 / 提醒阈值",
      type: "radio",
      required: true,
      options: [
        { label: "超过N小时未完成", value: "hours-timeout" },
        { label: "超过N天未完成", value: "days-timeout" },
        { label: "状态变化即提醒", value: "status-change" },
        { label: "指定时间点汇总提醒", value: "scheduled-summary" },
      ],
    },
    timingFieldForOrder(values),
    {
      id: "monitorFrequency",
      label: "提醒频率",
      type: "radio",
      required: true,
      options: [
        { label: "状态变化即提醒", value: "instant" },
        { label: "每日汇总", value: "summary-daily" },
        { label: "指定时段提醒", value: "scheduled-window" },
      ],
    },
    ...notifyChannelFields(values),
    ...effectivePeriodFields(values, "order-monitor"),
  ];
  return orderFields;
}

function timingFieldForOrder(values: RuleFormValues): RuleField {
  if (values.monitorTimingMode === "scheduled-summary") {
    return {
      id: "monitorSummaryTime",
      label: "汇总提醒时间",
      type: "text",
      required: true,
      placeholder: "例如：每天18:00",
      helper: "可填写具体时间描述，例如每天 18:00。",
    };
  }

  if (values.monitorTimingMode === "status-change") {
    return {
      id: "monitorThreshold",
      label: "提醒说明",
      type: "text",
      required: true,
      placeholder: "例如：状态变化即提醒",
      helper: "用于在摘要页展示当前阈值说明。",
    };
  }

  return {
    id: "monitorThreshold",
    label: "提醒阈值",
    type: "number",
    required: true,
    placeholder: values.monitorTimingMode === "days-timeout" ? "请输入天数" : "请输入小时数",
    helper: "请输入正整数。",
  };
}

function notifyChannelFields(values: RuleFormValues): RuleField[] {
  return [
    {
      id: "notifyChannels",
      label: "通知方式",
      type: "chips",
      required: true,
      options: [
        { label: "通知中心", value: "notification-center" },
        { label: "消息通知", value: "message" },
      ],
      helper: `当前已选：${(values.notifyChannels ?? []).length || 0} 项，可重复点击增减。`,
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
    objectGroup.issues.push({
      type: "object",
      severity: "error",
      title: "监控对象不完整",
      detail: "请选择监控对象类型并填写对象名称或编号。",
    });
  } else {
    const candidates = existingObjects[values.objectType];
    if (!candidates.includes(values.objectValue.trim())) {
      objectGroup.issues.push({
        type: "object",
        severity: "error",
        title: "对象不存在",
        detail: `${objectTypeLabels[values.objectType]}“${values.objectValue}”不存在，请检查对象名称或编号。`,
      });
    }
    if (permissionBlocked.has(values.objectValue.trim())) {
      objectGroup.issues.push({
        type: "object",
        severity: "error",
        title: "无监控权限",
        detail: `当前客户经理没有权限监控“${values.objectValue}”。`,
      });
    }
  }

  if (!values.ruleName?.trim()) {
    ruleGroup.issues.push({
      type: "rule",
      severity: "error",
      title: "规则名称缺失",
      detail: "请补充规则名称，方便后续在我的规则中管理。",
    });
  }

  if (intent === "alert") {
    if (!values.alertType) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "未选择预警类型",
        detail: "请选择红名单到期、欠费风险、长周期套餐到期或其他已支持预警类型。",
      });
    }

    if (values.objectType && values.alertType && unsupportedAlertTypesByObject[values.objectType]?.includes(values.alertType)) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "对象类型不支持当前规则",
        detail: `${objectTypeLabels[values.objectType]}暂不支持“${alertTypeLabels[values.alertType]}”规则。`,
      });
    }

    if (values.alertFrequency === "daily" && values.alertTimingMode === "condition-hit") {
      capacityGroup.issues.push({
        type: "capacity",
        severity: "warning",
        title: "建议降级为汇总提醒",
        detail: "条件命中且每日提醒可能产生高频消息，建议评估是否改为通知中心或每周提醒。",
      });
    }
  }

  if (intent === "order-monitor") {
    if (!values.monitorCondition) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "未选择监控条件",
        detail: "请选择执行中、执行失败、超时未完成或状态变更。",
      });
    }

    if (!values.monitorTimingMode) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "未选择提醒阈值模式",
        detail: "请配置超时阈值、状态变更或汇总提醒方式。",
      });
    }

    if (values.monitorTimingMode === "scheduled-summary") {
      if (!values.monitorSummaryTime?.trim()) {
        ruleGroup.issues.push({
          type: "rule",
          severity: "error",
          title: "汇总提醒时间缺失",
          detail: "指定时间点汇总提醒需要填写具体时间。",
        });
      }
    } else if (!values.monitorThreshold?.trim()) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "提醒阈值缺失",
        detail: "请补充超时阈值或状态变化说明。",
      });
    } else if (
      values.monitorTimingMode !== "status-change" &&
      (!/^\d+$/.test(values.monitorThreshold) || Number(values.monitorThreshold) <= 0 || Number(values.monitorThreshold) > 720)
    ) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "提醒阈值不合法",
        detail: "超时阈值需要是 1 到 720 之间的正整数。",
      });
    }

    if (values.monitorCondition === "status-change" && values.monitorFrequency === "summary-daily") {
      capacityGroup.issues.push({
        type: "capacity",
        severity: "info",
        title: "将按汇总检查执行",
        detail: "状态变化配置为每日汇总时，系统会以汇总检查方式执行而非实时触发。",
      });
    }
  }

  if (!(values.notifyChannels?.length ?? 0)) {
    ruleGroup.issues.push({
      type: "rule",
      severity: "error",
      title: "通知方式缺失",
      detail: "请至少选择一种通知方式。",
    });
  }

  if (values.notifyChannels?.includes("message") && values.objectType === "group") {
    capacityGroup.issues.push({
      type: "capacity",
      severity: "warning",
      title: "消息通知开销较高",
      detail: "集团级规则通过消息通知可能产生较高触达开销，建议同时保留通知中心。",
    });
  }

  if (values.effectivePeriod === "time-range") {
    if (!values.effectiveStart || !values.effectiveEnd) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "生效周期不完整",
        detail: "指定时间范围内有效时，需要同时填写开始和结束日期。",
      });
    } else if (values.effectiveStart > values.effectiveEnd) {
      ruleGroup.issues.push({
        type: "rule",
        severity: "error",
        title: "生效周期不合法",
        detail: "结束日期不能早于开始日期。",
      });
    }
  }

  const comparableRules = existingRules.filter((item) => item.id !== editingRuleId);

  const duplicate = comparableRules.find(
    (item) =>
      item.intent === intent &&
      item.objectType === values.objectType &&
      item.objectValue === values.objectValue &&
      item.primaryCondition === getPrimaryCondition(intent, values),
  );

  if (duplicate) {
    duplicateGroup.issues.push({
      type: "duplicate",
      severity: "error",
      title: "已存在相同规则",
      detail: `规则“${duplicate.name}”与当前配置高度一致，建议直接复用或修改已有规则。`,
    });
  }

  const similarCount = comparableRules.filter(
    (item) =>
      item.intent === intent &&
      item.objectType === values.objectType &&
      item.objectValue === values.objectValue &&
      item.primaryCondition !== getPrimaryCondition(intent, values),
  ).length;

  if (similarCount >= 2) {
    duplicateGroup.issues.push({
      type: "duplicate",
      severity: "warning",
      title: "存在高度重复规则",
      detail: `当前对象下已有 ${similarCount} 条相近规则，建议考虑合并提醒策略。`,
    });
  }

  const activeRules = existingRules.filter((item) => item.status === "active").length;
  if (activeRules >= 5) {
    capacityGroup.issues.push({
      type: "capacity",
      severity: "warning",
      title: "规则数量接近上限",
      detail: "当前客户经理已配置较多规则，建议优先清理重复规则。",
    });
  }

  const passed = groups.every((group) => group.issues.every((issue) => issue.severity !== "error"));
  const summary = passed ? "校验通过，可进入规则确认摘要页。" : "存在需要处理的问题，请修改后重新校验。";

  return { passed, groups, summary };
}

export function buildRuleSummary(intent: Exclude<RuleIntent, "unsupported">, values: RuleFormValues): RuleSummary {
  const executionMode = resolveExecutionMode(intent, values);
  const items =
    intent === "alert"
      ? [
          { label: "规则类型", value: "预警提醒类" },
          { label: "监控对象", value: `${objectTypeLabels[values.objectType as RuleObjectType]} / ${values.objectValue ?? "-"}` },
          { label: "触发条件 / 预警类型", value: alertTypeLabels[values.alertType ?? ""] ?? "-" },
          { label: "提醒时间", value: formatAlertTiming(values) },
          { label: "提醒频率", value: frequencyLabels[values.alertFrequency ?? ""] ?? "-" },
          { label: "通知方式", value: formatChannels(values.notifyChannels ?? []) },
          { label: "生效周期", value: formatEffective(values) },
          { label: "执行方式说明", value: executionLabels[executionMode] },
        ]
      : [
          { label: "规则类型", value: "订单执行监控类" },
          { label: "监控对象", value: `${objectTypeLabels[values.objectType as RuleObjectType]} / ${values.objectValue ?? "-"}` },
          { label: "触发条件 / 预警类型", value: monitorConditionLabels[values.monitorCondition ?? ""] ?? "-" },
          { label: "提醒时间 / 阈值", value: formatMonitorTiming(values) },
          { label: "提醒频率", value: frequencyLabels[values.monitorFrequency ?? ""] ?? "-" },
          { label: "通知方式", value: formatChannels(values.notifyChannels ?? []) },
          { label: "生效周期", value: formatEffective(values) },
          { label: "执行方式说明", value: executionLabels[executionMode] },
        ];

  return {
    title: values.ruleName ?? "规则摘要",
    description: intent === "alert" ? "系统将根据预警提醒规则持续监控目标对象。" : "系统将根据订单状态与阈值持续监控执行情况。",
    items,
    executionMode,
    executionLabel: executionLabels[executionMode],
    note:
      executionMode === "scheduled-scan" || executionMode === "async-scan" || executionMode === "summary-check"
        ? "当前规则采用扫描执行方式，提醒可能存在一定时延。"
        : "当前规则支持实时触发，命中后会立即生成提醒。",
  };
}

export function resolveExecutionMode(
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
): RuleExecutionMode {
  if (intent === "alert") {
    return values.alertTimingMode === "condition-hit" ? "event-trigger" : "scheduled-scan";
  }

  if (values.monitorTimingMode === "status-change" && values.monitorFrequency === "instant") {
    return "status-event";
  }
  if (values.monitorFrequency === "summary-daily" || values.monitorTimingMode === "scheduled-summary") {
    return "summary-check";
  }
  return "async-scan";
}

export function createManagedRule(
  intent: Exclude<RuleIntent, "unsupported">,
  values: RuleFormValues,
  createdBy: string,
): ManagedRule {
  const summary = buildRuleSummary(intent, values);
  return {
    id: `RULE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    name: values.ruleName ?? "未命名规则",
    intent,
    objectType: values.objectType as RuleObjectType,
    objectValue: values.objectValue ?? "",
    primaryCondition: getPrimaryCondition(intent, values),
    frequencyLabel: intent === "alert" ? frequencyLabels[values.alertFrequency ?? ""] : frequencyLabels[values.monitorFrequency ?? ""],
    notifyChannels: (values.notifyChannels ?? []) as RuleNotificationChannel[],
    effectiveLabel: formatEffective(values),
    executionMode: summary.executionMode,
    executionLabel: summary.executionLabel,
    status: values.effectivePeriod === "time-range" && values.effectiveStart && values.effectiveStart > "2026-04-23" ? "pending" : "active",
    createdAt: "2026-04-23 09:36",
    createdBy,
    values: { ...values },
    summary,
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
      alertFrequency: "daily",
      notifyChannels: ["notification-center", "message"],
      effectivePeriod: "long-term",
    },
    "active",
    "2026-04-18 10:20",
  ),
  createStarterRule(
    "RULE-AL1002",
    "客户-陈洁欠费风险提醒",
    "alert",
    {
      ruleName: "客户-陈洁欠费风险提醒",
      objectType: "customer",
      objectValue: "客户-陈洁",
      alertType: "arrears-risk",
      alertTimingMode: "condition-hit",
      alertOffset: "风险分达到80即提醒",
      alertFrequency: "once",
      notifyChannels: ["notification-center"],
      effectivePeriod: "long-term",
    },
    "paused",
    "2026-04-16 16:45",
  ),
  createStarterRule(
    "RULE-OM2001",
    "ORD-240301执行失败提醒",
    "order-monitor",
    {
      ruleName: "ORD-240301执行失败提醒",
      objectType: "order",
      objectValue: "ORD-240301",
      monitorCondition: "failed",
      monitorTimingMode: "status-change",
      monitorThreshold: "状态变化即提醒",
      monitorFrequency: "instant",
      notifyChannels: ["notification-center", "message"],
      effectivePeriod: "until-complete",
    },
    "active",
    "2026-04-21 09:10",
  ),
  createStarterRule(
    "RULE-OM2002",
    "远海物流集团订单超时监控",
    "order-monitor",
    {
      ruleName: "远海物流集团订单超时监控",
      objectType: "group",
      objectValue: "远海物流集团",
      monitorCondition: "timeout",
      monitorTimingMode: "hours-timeout",
      monitorThreshold: "48",
      monitorFrequency: "summary-daily",
      notifyChannels: ["notification-center"],
      effectivePeriod: "time-range",
      effectiveStart: "2026-04-20",
      effectiveEnd: "2026-05-20",
    },
    "expired",
    "2026-04-10 11:35",
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
    notificationChannels: ["notification-center", "message"],
    followUpStatus: "tracking",
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
    notificationChannels: ["notification-center", "message"],
    followUpStatus: "new",
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
    primaryCondition: getPrimaryCondition(intent, values),
    frequencyLabel: intent === "alert" ? frequencyLabels[values.alertFrequency ?? ""] : frequencyLabels[values.monitorFrequency ?? ""],
    notifyChannels: (values.notifyChannels ?? []) as RuleNotificationChannel[],
    effectiveLabel: formatEffective(values),
    executionMode: summary.executionMode,
    executionLabel: summary.executionLabel,
    status,
    createdAt,
    createdBy: "业务体验官",
    values,
    summary,
  };
}

function getPrimaryCondition(intent: Exclude<RuleIntent, "unsupported">, values: RuleFormValues): string {
  return intent === "alert" ? values.alertType ?? "" : values.monitorCondition ?? "";
}

function formatAlertTiming(values: RuleFormValues): string {
  if (values.alertTimingMode === "days-before") return "到期前提醒";
  if (values.alertTimingMode === "workdays-before") return "到期前工作日提醒";
  return "达到条件时提醒";
}

function formatMonitorTiming(values: RuleFormValues): string {
  if (values.monitorTimingMode === "hours-timeout") return `超过 ${values.monitorThreshold} 小时未完成`;
  if (values.monitorTimingMode === "days-timeout") return `超过 ${values.monitorThreshold} 天未完成`;
  if (values.monitorTimingMode === "status-change") return values.monitorThreshold ?? "状态变化即提醒";
  return values.monitorSummaryTime ?? "指定时间点汇总提醒";
}

function formatChannels(channels: string[]): string {
  if (!channels.length) return "-";
  return channels.map((item) => (item === "message" ? "消息通知" : "通知中心")).join(" + ");
}

function formatEffective(values: RuleFormValues): string {
  if (values.effectivePeriod === "time-range") {
    return `${effectiveLabels[values.effectivePeriod]} (${values.effectiveStart} 至 ${values.effectiveEnd})`;
  }
  return effectiveLabels[values.effectivePeriod ?? ""] ?? "-";
}

function buildAlertHitReason(rule: ManagedRule): string {
  if (rule.values.alertType === "red-list-expiry") return `${rule.objectValue}红名单将在3天后到期。`;
  if (rule.values.alertType === "arrears-risk") return `${rule.objectValue}存在欠费风险，已达到提醒条件。`;
  if (rule.values.alertType === "plan-expiry") return `${rule.objectValue}长周期套餐将在5个工作日后到期。`;
  return `${rule.objectValue}命中“${alertTypeLabels[rule.values.alertType ?? "contract-renewal"]}”提醒条件。`;
}

function buildOrderHitReason(rule: ManagedRule): string {
  if (rule.values.monitorCondition === "failed") return `订单${rule.objectValue}执行失败。`;
  if (rule.values.monitorCondition === "timeout") return `订单${rule.objectValue}已超过${rule.values.monitorThreshold}小时未完成。`;
  if (rule.values.objectType === "customer") return `客户${rule.objectValue}相关订单状态发生变化。`;
  if (rule.values.objectType === "group") return `集团${rule.objectValue}相关订单出现失败记录。`;
  return `订单${rule.objectValue}状态发生变化。`;
}
