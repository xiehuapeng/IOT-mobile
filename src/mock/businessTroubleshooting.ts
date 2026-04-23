import type {
  DecisionCard,
  TroubleshootingActionId,
  TroubleshootingEntryId,
  TroubleshootingExecutionTrace,
  TroubleshootingHandoffSummary,
  TroubleshootingIntake,
  TroubleshootingRecognition,
  TroubleshootingResult,
} from "../types/agent";

export const troubleshootingEntryLabels: Record<TroubleshootingEntryId, string> = {
  communication: "通信异常诊断",
  order: "订单异常处理",
  realname: "实名异常查询",
};

export const troubleshootingEntryCards = [
  {
    id: "communication" as const,
    title: "通信异常诊断",
    description: "无法上网、卡状态异常、卡停机、短信异常、语音异常。",
  },
  {
    id: "order" as const,
    title: "订单异常处理",
    description: "订单卡单、长时间执行中、执行失败、批量任务失败、掌厅轻量化订单异常。",
  },
  {
    id: "realname" as const,
    title: "实名异常查询",
    description: "实名认证失败、身份校验不一致、实名进度和结果明细查询。",
  },
];

export const businessTroubleshootingIntro =
  "请选择排障入口，也可以直接描述问题。我会识别对象信息、判断排障范围，并编排对应诊断流程。";

export const intakeCard: DecisionCard = {
  id: "business-troubleshooting-intake",
  title: "问题受理",
  description: "支持自然语言描述；截图/拍照识别在演示态下以预设样例模拟。",
  submitLabel: "识别问题与参数",
  fields: [
    {
      id: "question",
      label: "自然语言问题",
      type: "textarea",
      required: true,
      placeholder: "例如：用户 13800138000 无法上网，ICCID 89860...，掌厅提示数据服务异常。",
      helper: "可包含服务号码、ICCID、订单号、批量任务号、报错文案和来源场景。",
    },
    {
      id: "sourceScene",
      label: "来源场景",
      type: "chips",
      required: true,
      options: [
        { label: "掌厅", value: "掌厅" },
        { label: "CMIOT", value: "CMIOT" },
        { label: "客户经理口述", value: "客户经理口述" },
      ],
    },
    {
      id: "snapshotCase",
      label: "截图/拍照识别样例",
      type: "chips",
      options: [
        { label: "不上传", value: "" },
        { label: "通信异常截图", value: "communication-shot" },
        { label: "订单失败截图", value: "order-shot" },
        { label: "实名失败截图", value: "realname-shot" },
      ],
      helper: "演示态会自动补充号码、ICCID、订单号或报错文案。",
    },
  ],
};

export const supplementCard: DecisionCard = {
  id: "business-troubleshooting-supplement",
  title: "补充关键参数",
  description: "系统已识别到排障方向，但仍需补齐核心对象信息。",
  submitLabel: "补齐后继续诊断",
  fields: [
    { id: "serviceNo", label: "服务号码", type: "text", placeholder: "请输入服务号码" },
    { id: "iccid", label: "ICCID / IMSI", type: "text", placeholder: "请输入 ICCID 或 IMSI" },
    { id: "orderNo", label: "订单号", type: "text", placeholder: "请输入订单号" },
    { id: "batchTaskNo", label: "批量任务号", type: "text", placeholder: "请输入批量任务号" },
    { id: "errorText", label: "报错文案", type: "textarea", placeholder: "请补充报错截图中的文案或前台提示" },
  ],
};

export const orchestrationCards: Record<TroubleshootingEntryId, DecisionCard> = {
  communication: {
    id: "communication-orchestration",
    title: "通信异常诊断编排",
    description: "调用智能诊断统一入口，并判断主异常方向。",
    submitLabel: "调用智能诊断",
    fields: [
      {
        id: "communicationIssue",
        label: "异常现象",
        type: "radio",
        required: true,
        options: [
          { label: "无法上网", value: "data" },
          { label: "卡停机 / 生命周期异常", value: "lifecycle" },
          { label: "短信异常", value: "sms" },
          { label: "语音异常", value: "voice" },
          { label: "多状态同时异常", value: "multi" },
        ],
      },
    ],
  },
  order: {
    id: "order-orchestration",
    title: "订单异常处理编排",
    description: "根据订单来源、订单形态和执行状态进入规则分支。",
    submitLabel: "查询订单状态",
    fields: [
      {
        id: "orderSource",
        label: "订单来源",
        type: "radio",
        required: true,
        options: [
          { label: "CMIOT 订单", value: "cmiot" },
          { label: "掌厅轻量化操作订单", value: "mobile" },
        ],
      },
      {
        id: "orderShape",
        label: "订单形态",
        type: "radio",
        required: true,
        options: [
          { label: "单订单", value: "single" },
          { label: "批量订单", value: "batch" },
        ],
      },
      {
        id: "orderStatus",
        label: "状态样例",
        type: "radio",
        required: true,
        options: [
          { label: "执行中 / 疑似卡单", value: "running" },
          { label: "执行失败", value: "failed" },
          { label: "部分失败", value: "partial-failed" },
          { label: "审核驳回", value: "rejected" },
          { label: "执行成功", value: "success" },
        ],
      },
    ],
  },
  realname: {
    id: "realname-orchestration",
    title: "实名异常查询编排",
    description: "先匹配 FAQ 常见原因，再查询实名相关订单或工单状态。",
    submitLabel: "查询实名状态",
    fields: [
      {
        id: "realnameStatus",
        label: "实名状态样例",
        type: "radio",
        required: true,
        options: [
          { label: "处理中", value: "processing" },
          { label: "成功", value: "success" },
          { label: "失败", value: "failed" },
          { label: "查不到 / 无法定位", value: "not-found" },
        ],
      },
    ],
  },
};

const screenshotExtracts: Record<string, Partial<TroubleshootingIntake>> = {
  "communication-shot": {
    serviceNo: "13800138000",
    iccid: "89860422102468000123",
    errorText: "掌厅提示：数据服务不可用，请检查卡状态。",
  },
  "order-shot": {
    serviceNo: "13900139000",
    orderNo: "MO202604230018",
    batchTaskNo: "BT20260423009",
    errorText: "CMIOT 批量任务部分失败，失败原因：服务状态不允许操作。",
  },
  "realname-shot": {
    serviceNo: "13700137000",
    orderNo: "RN202604230066",
    errorText: "实名认证失败：证件号与姓名校验不一致。",
  },
};

export function recognizeTroubleshooting(
  payload: Record<string, string | string[]>,
): TroubleshootingRecognition {
  const question = String(payload.question ?? "");
  const requestedEntry = String(payload.entryId ?? "communication") as TroubleshootingEntryId;
  const snapshotCase = String(payload.snapshotCase ?? "");
  const extracted: TroubleshootingIntake = {
    entryId: classifyEntry(question, requestedEntry),
    originalQuestion: question,
    sourceScene: String(payload.sourceScene ?? "掌厅"),
    ...extractIdentifiers(question),
    ...screenshotExtracts[snapshotCase],
  };

  const outOfScope = /套餐推荐|资费介绍|活动规则|账单解释|知识库|指标趋势/.test(question);
  if (outOfScope) {
    return {
      inScope: false,
      entryId: extracted.entryId,
      entryLabel: troubleshootingEntryLabels[extracted.entryId],
      missingFields: [],
      extracted,
      redirectAgents: ["知识问答智能体", "数据查询智能体", "卡状态管理智能体"],
    };
  }

  const missingFields = getMissingFields(extracted);
  return {
    inScope: true,
    entryId: extracted.entryId,
    entryLabel: troubleshootingEntryLabels[extracted.entryId],
    missingFields,
    extracted,
  };
}

export function mergeSupplement(
  current: TroubleshootingIntake,
  payload: Record<string, string | string[]>,
): TroubleshootingIntake {
  return {
    ...current,
    serviceNo: firstFilled(current.serviceNo, payload.serviceNo),
    iccid: firstFilled(current.iccid, payload.iccid),
    imsi: firstFilled(current.imsi, payload.iccid),
    orderNo: firstFilled(current.orderNo, payload.orderNo),
    batchTaskNo: firstFilled(current.batchTaskNo, payload.batchTaskNo),
    errorText: firstFilled(current.errorText, payload.errorText),
  };
}

export function getMissingFields(intake: TroubleshootingIntake): string[] {
  if (intake.entryId === "communication") {
    return [!intake.serviceNo && !intake.iccid && !intake.imsi ? "服务号码 / ICCID / IMSI" : ""].filter(Boolean);
  }

  if (intake.entryId === "order") {
    return [!intake.orderNo && !intake.batchTaskNo ? "订单号 / 批量任务号" : ""].filter(Boolean);
  }

  return [!intake.orderNo && !intake.serviceNo ? "实名订单号 / 服务号码" : ""].filter(Boolean);
}

export function buildTroubleshootingResult(
  intake: TroubleshootingIntake,
  payload: Record<string, string | string[]>,
): TroubleshootingResult {
  if (intake.entryId === "communication") {
    return buildCommunicationResult(intake, String(payload.communicationIssue ?? "multi"));
  }

  if (intake.entryId === "order") {
    return buildOrderResult(intake, {
      source: String(payload.orderSource ?? "cmiot"),
      shape: String(payload.orderShape ?? "single"),
      status: String(payload.orderStatus ?? "failed"),
    });
  }

  return buildRealnameResult(intake, String(payload.realnameStatus ?? "failed"));
}

export function buildExecutionTrace(
  result: TroubleshootingResult,
  intake: TroubleshootingIntake,
  actionLabel?: string,
): TroubleshootingExecutionTrace {
  return {
    operator: "演示客户经理",
    operatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    target: intake.serviceNo ?? intake.iccid ?? intake.orderNo ?? intake.batchTaskNo ?? "当前排障对象",
    action: actionLabel ?? result.executableActions[0]?.label ?? "执行轻量处理",
    result: "执行成功，结果已同步到会话上下文。",
    contextRef: result.reference,
  };
}

export function buildHandoffSummary(
  result: TroubleshootingResult,
  intake: TroubleshootingIntake,
): TroubleshootingHandoffSummary {
  return {
    originalQuestion: intake.originalQuestion,
    objectInfo: [
      intake.serviceNo ? `服务号码：${intake.serviceNo}` : "",
      intake.iccid ? `ICCID：${intake.iccid}` : "",
      intake.imsi ? `IMSI：${intake.imsi}` : "",
      intake.orderNo ? `订单号：${intake.orderNo}` : "",
      intake.batchTaskNo ? `批量任务号：${intake.batchTaskNo}` : "",
      `来源场景：${intake.sourceScene}`,
    ].filter(Boolean),
    checkedItems: result.checkedItems,
    keyResults: result.details.map((detail) => `${detail.label}：${detail.value}`),
    conclusion: result.conclusion,
    suggestedActions: result.suggestedActions,
    unresolvedPoint: result.unresolvedPoint ?? "需人工确认最终处置口径。",
  };
}

export function getActionLabel(action: TroubleshootingActionId): string {
  return {
    continue: "继续排查",
    execute: "执行处理",
    handoff: "转人工客服",
    finish: "结束本次处理",
  }[action];
}

function classifyEntry(question: string, fallback: TroubleshootingEntryId): TroubleshootingEntryId {
  if (/实名|认证|证件|身份/.test(question)) return "realname";
  if (/订单|批量|任务|执行失败|卡单|驳回/.test(question)) return "order";
  if (/上网|停机|短信|语音|无信号|卡状态|ICCID/i.test(question)) return "communication";
  return fallback;
}

function extractIdentifiers(question: string): Partial<TroubleshootingIntake> {
  const serviceNo = question.match(/1[3-9]\d{9}/)?.[0];
  const iccid = question.match(/89\d{10,20}/)?.[0];
  const orderNo = question.match(/[A-Z]{1,3}\d{8,}/)?.[0];
  const batchTaskNo = question.match(/BT\d{8,}/)?.[0];
  return {
    serviceNo,
    iccid,
    orderNo,
    batchTaskNo,
    errorText: question.length > 14 ? question : undefined,
  };
}

function firstFilled(current: string | undefined, next: string | string[] | undefined): string | undefined {
  const value = Array.isArray(next) ? next[0] : next;
  return current || (value?.trim() ? value.trim() : undefined);
}

function buildCommunicationResult(intake: TroubleshootingIntake, issue: string): TroubleshootingResult {
  const baseDetails = [
    { label: "SIM 卡信息", value: intake.iccid ?? intake.serviceNo ?? "已通过智能诊断入口查询" },
    { label: "生命周期 / 卡状态", value: issue === "lifecycle" || issue === "multi" ? "停机保号" : "在用" },
    { label: "停机时间", value: issue === "lifecycle" || issue === "multi" ? "2026-04-23 09:18:32" : "未查询到停机记录" },
    { label: "停机原因", value: issue === "lifecycle" || issue === "multi" ? "账户欠费触发系统停机" : "无" },
    { label: "数据服务状态", value: issue === "data" || issue === "multi" ? "异常关闭" : "正常" },
    { label: "短信服务状态", value: issue === "sms" || issue === "multi" ? "停开" : "正常" },
    { label: "语音服务状态", value: issue === "voice" || issue === "multi" ? "停开" : "正常" },
  ];

  const issueMap = {
    lifecycle: "停机/生命周期异常",
    data: "数据业务异常",
    sms: "短信异常",
    voice: "语音异常",
    multi: "多状态同时异常",
  } as const;

  return {
    faultType: issueMap[issue as keyof typeof issueMap] ?? "通信异常",
    checkedItems: ["SIM 卡信息", "生命周期 / 卡状态", "停机原因", "数据服务", "短信服务", "语音服务"],
    conclusion:
      issue === "multi"
        ? "当前存在多项服务状态异常，优先建议处理停机与生命周期状态，再复核数据、短信和语音能力。"
        : `当前主异常方向为${issueMap[issue as keyof typeof issueMap] ?? "通信异常"}，建议按诊断结论执行对应恢复或核查动作。`,
    details: baseDetails,
    suggestedActions: ["复核卡状态和生命周期", "按异常方向执行复机或服务恢复", "恢复后请客户经理引导用户重新验证"],
    status: issue === "multi" || issue === "lifecycle" ? "warning" : "info",
    reference: "TRB-COMM-POC-01",
    executableActions: [
      { id: "resume-card", label: "复机", description: "适用于停机或生命周期异常场景。" },
      { id: "restore-service", label: "恢复服务功能", description: "适用于数据、短信、语音能力停开场景。" },
    ],
    unresolvedPoint: "需确认用户侧重新验证后业务是否恢复。",
  };
}

function buildOrderResult(
  intake: TroubleshootingIntake,
  order: { source: string; shape: string; status: string },
): TroubleshootingResult {
  const sourceLabel = order.source === "mobile" ? "掌厅轻量化操作订单" : "CMIOT 订单";
  const shapeLabel = order.shape === "batch" ? "批量订单" : "单订单";
  const statusMap: Record<string, string> = {
    running: "执行中 / 疑似卡单",
    failed: "执行失败",
    "partial-failed": "部分失败",
    rejected: "审核驳回",
    success: "执行成功",
  };

  const details = [
    { label: "订单来源", value: sourceLabel },
    { label: "订单形态", value: shapeLabel },
    { label: "订单号 / 批量任务号", value: intake.batchTaskNo ?? intake.orderNo ?? "MO202604230018" },
    { label: "当前状态", value: statusMap[order.status] ?? "执行失败" },
    { label: "已执行时长", value: order.status === "running" ? "42 分钟" : "已结束" },
    {
      label: "失败原因 TOP N",
      value:
        order.status === "partial-failed" || order.status === "failed"
          ? "服务状态不允许操作、号码状态未同步、下游接口超时"
          : "无失败原因",
    },
    { label: "失败明细列表", value: order.status === "partial-failed" ? "共 120 条，成功 96 条，失败 24 条" : "无批量失败明细" },
  ];

  return {
    faultType: `${sourceLabel}${shapeLabel}异常`,
    checkedItems: ["订单提交状态", "订单执行状态", "审核结果", "批量主任务", "批量子任务明细"],
    conclusion:
      order.status === "success"
        ? "订单已执行成功，如前台业务仍未恢复，建议转入通信异常诊断或人工复核。"
        : `${sourceLabel}当前状态为${statusMap[order.status] ?? "执行失败"}，建议根据失败环节处理后重试或转人工。`,
    details,
    suggestedActions:
      order.status === "running"
        ? ["继续等待短周期回执", "超过阈值后转人工检查下游任务", "必要时重新触发执行链路"]
        : ["按失败原因修正参数或状态", "批量失败场景导出失败明细", "无法定位时转人工坐席"],
    status: order.status === "success" ? "success" : "warning",
    reference: "TRB-ORDER-POC-02",
    executableActions:
      order.status === "success"
        ? []
        : [{ id: "retry-light-action", label: "重新触发轻量动作", description: "适用于掌厅轻量化订单修正后重试。" }],
    unresolvedPoint: order.status === "success" ? "前台仍异常时需确认业务侧状态同步。" : "需人工确认失败明细是否可批量重试。",
  };
}

function buildRealnameResult(intake: TroubleshootingIntake, status: string): TroubleshootingResult {
  const statusMap: Record<string, string> = {
    processing: "处理中",
    success: "成功",
    failed: "失败",
    "not-found": "查不到 / 无法定位",
  };

  return {
    faultType: "实名异常查询",
    checkedItems: ["FAQ 常见原因", "实名订单状态", "实名结果明细", "资料完整性", "状态同步情况"],
    conclusion:
      status === "failed"
        ? "实名订单失败，常见原因包括姓名/证件号不一致、资料不完整或状态未同步，建议修正后重新提交。"
        : `实名相关订单当前为${statusMap[status] ?? "处理中"}，请按状态结果继续跟进。`,
    details: [
      { label: "FAQ 匹配原因", value: "姓名/证件号不一致、资料不完整、状态未同步、需人工核查" },
      { label: "实名订单号", value: intake.orderNo ?? "RN202604230066" },
      { label: "当前状态", value: statusMap[status] ?? "处理中" },
      { label: "结果明细", value: status === "failed" ? "证件号与姓名校验不一致" : "系统已返回实名处理结果" },
    ],
    suggestedActions:
      status === "failed"
        ? ["核对姓名与证件号", "补充缺失资料", "重新提交实名申请或转人工核查"]
        : ["关注状态同步", "必要时查询工单明细", "无法定位时转人工处理"],
    status: status === "success" ? "success" : status === "processing" ? "info" : "warning",
    reference: "TRB-REALNAME-POC-03",
    executableActions: [],
    unresolvedPoint: "实名异常通常需要人工确认材料真实性和最终处理口径。",
  };
}
