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

const orderIntakeCard: DecisionCard = {
  id: "business-troubleshooting-order-intake",
  title: "问题受理",
  description: "支持自然语言描述；截图/拍照识别在演示态下以预设样例模拟。",
  submitLabel: "识别问题与参数",
  fields: [
    {
      id: "question",
      label: "自然语言问题",
      type: "textarea",
      required: true,
      placeholder: "例如：用户 13900139001 的订单 MO202604230001 已经执行 40 多分钟，一直显示处理中，帮我看下是不是卡单。",
      helper: "建议描述订单来源、订单号或批量任务号、当前状态、持续时长、失败提示等信息；系统会自动判断 CMIOT / 掌厅、单订单 / 批量订单以及任务状态。",
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
        { label: "订单失败截图", value: "order-shot" },
      ],
      helper: "演示态上传订单失败截图后，会自动识别服务号码、订单号、批量任务号和报错文案。",
    },
  ],
};

const communicationIntakeCard: DecisionCard = {
  id: "business-troubleshooting-communication-intake",
  title: "问题受理",
  description: "支持自然语言描述；截图/拍照识别在演示态下以预设样例模拟。",
  submitLabel: "识别问题与参数",
  fields: [
    {
      id: "question",
      label: "自然语言问题",
      type: "textarea",
      required: true,
      placeholder: "例如：用户 13800138000 反馈无法上网，ICCID 89860422102468000123，掌厅提示数据服务不可用。",
      helper: "建议描述服务号码、ICCID / IMSI、异常现象、来源场景和前台提示；系统会自动调用智能诊断并判断卡状态、数据、短信、语音等主异常方向。",
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
        { label: "通信失败截图", value: "communication-shot" },
      ],
      helper: "演示态上传通信失败截图后，会自动识别服务号码、ICCID 和掌厅报错文案。",
    },
  ],
};

const realnameIntakeCard: DecisionCard = {
  id: "business-troubleshooting-realname-intake",
  title: "问题受理",
  description: "支持自然语言描述；截图/拍照识别在演示态下以预设样例模拟。",
  submitLabel: "识别问题与参数",
  fields: [
    {
      id: "question",
      label: "自然语言问题",
      type: "textarea",
      required: true,
      placeholder: "例如：用户 13700137000 实名认证失败，订单 RN202604230066 提示证件号与姓名校验不一致。",
      helper: "建议描述服务号码、实名订单号、失败提示和办理进度；系统会先匹配 FAQ，再查询实名订单或工单状态。",
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
        { label: "实名失败截图", value: "realname-shot" },
      ],
      helper: "演示态上传实名失败截图后，会自动识别服务号码、实名订单号和失败文案。",
    },
  ],
};

export const intakeCards: Record<TroubleshootingEntryId, DecisionCard> = {
  communication: communicationIntakeCard,
  order: orderIntakeCard,
  realname: realnameIntakeCard,
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
    description: "先判断订单来源，再进入对应规则分支。",
    submitLabel: "判断订单来源",
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

export const orderShapeCard: DecisionCard = {
  id: "order-cmiot-shape",
  title: "CMIOT 订单执行异常",
  description: "系统继续判断是否为批量订单。",
  submitLabel: "继续查询订单状态",
  fields: [
    {
      id: "orderShape",
      label: "是否为批量订单",
      type: "radio",
      required: true,
      options: [
        { label: "否，单订单", value: "single", hint: "查询单订单状态" },
        { label: "是，批量订单", value: "batch", hint: "查询批量主任务状态" },
      ],
    },
  ],
};

export const cmiotSingleStatusCard: DecisionCard = {
  id: "order-cmiot-single-status",
  title: "查询单订单状态",
  description: "根据单订单执行状态输出当前状态、失败原因、驳回原因或成功结果。",
  submitLabel: "生成订单排障结果",
  fields: [
    {
      id: "orderStatus",
      label: "单订单状态",
      type: "radio",
      required: true,
      options: [
        { label: "执行中 / 长时间未完成", value: "single-running" },
        { label: "执行失败", value: "single-failed" },
        { label: "审核驳回", value: "single-rejected" },
        { label: "执行成功", value: "single-success" },
      ],
    },
  ],
};

export const cmiotBatchStatusCard: DecisionCard = {
  id: "order-cmiot-batch-status",
  title: "查询批量主任务状态",
  description: "根据批量主任务状态决定是否继续查询子任务执行明细。",
  submitLabel: "生成批量订单排障结果",
  fields: [
    {
      id: "orderStatus",
      label: "批量主任务状态",
      type: "radio",
      required: true,
      options: [
        { label: "执行中", value: "batch-running" },
        { label: "全部成功", value: "batch-success" },
        { label: "部分失败 / 全部失败", value: "batch-failed" },
        { label: "状态异常 / 查不到", value: "batch-unknown" },
      ],
    },
  ],
};

export const mobileOrderStatusCard: DecisionCard = {
  id: "order-mobile-status",
  title: "掌厅轻量化操作订单异常",
  description: "适用于服务停开、服务恢复和其他轻量化操作订单。",
  submitLabel: "生成掌厅订单排障结果",
  fields: [
    {
      id: "orderStatus",
      label: "掌厅订单提交与执行状态",
      type: "radio",
      required: true,
      options: [
        { label: "提交失败", value: "mobile-submit-failed" },
        { label: "执行中", value: "mobile-running" },
        { label: "执行失败", value: "mobile-failed" },
        { label: "执行成功", value: "mobile-success" },
      ],
    },
  ],
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

export interface OrderRouteInference {
  payload: Record<string, string>;
  sourceLabel: string;
  shapeLabel: string;
  statusLabel: string;
}

export interface CommunicationRouteInference {
  payload: Record<string, string>;
  statusLabel: string;
  queryLabel: string;
}

export function inferCommunicationRoute(intake: TroubleshootingIntake): CommunicationRouteInference {
  const text = `${intake.originalQuestion} ${intake.sourceScene} ${intake.errorText ?? ""}`;
  const issue = inferCommunicationIssue(text);
  return {
    payload: {
      communicationIssue: issue,
    },
    statusLabel: getCommunicationIssueLabel(issue),
    queryLabel: getCommunicationQueryLabel(issue),
  };
}

export function inferOrderRoute(intake: TroubleshootingIntake): OrderRouteInference {
  const text = `${intake.originalQuestion} ${intake.sourceScene} ${intake.errorText ?? ""}`;
  const isMobile = /掌厅|轻量|服务停开|服务恢复/.test(text);
  const isBatch = !isMobile && (/批量|主任务|子任务|BT\d+/i.test(text) || Boolean(intake.batchTaskNo));
  const source = isMobile ? "mobile" : "cmiot";
  const shape = isBatch ? "batch" : "single";
  const status = inferOrderStatus(text, source, shape);

  return {
    payload: {
      orderSource: source,
      orderShape: shape,
      orderStatus: status,
    },
    sourceLabel: source === "mobile" ? "掌厅轻量化操作订单异常" : "CMIOT 订单执行异常",
    shapeLabel: source === "mobile" ? "轻量化操作订单" : shape === "batch" ? "批量订单" : "单订单",
    statusLabel: getOrderStatusLabel(status),
  };
}

function inferCommunicationIssue(text: string): string {
  if (/多|同时|数据.*短信|短信.*语音|全都|多个/.test(text)) return "multi";
  if (/停机|生命周期|卡状态|欠费|停开/.test(text)) return "lifecycle";
  if (/短信|验证码|收不到短信|发不了短信/.test(text)) return "sms";
  if (/语音|通话|呼叫|打不出|接不了/.test(text)) return "voice";
  return "data";
}

function getCommunicationIssueLabel(issue: string): string {
  return {
    data: "数据业务异常",
    lifecycle: "停机/生命周期异常",
    sms: "短信异常",
    voice: "语音异常",
    multi: "多状态同时异常",
  }[issue] ?? "数据业务异常";
}

function getCommunicationQueryLabel(issue: string): string {
  return {
    data: "数据服务状态",
    lifecycle: "生命周期 / 卡状态",
    sms: "短信服务状态",
    voice: "语音服务状态",
    multi: "卡状态与多项服务状态",
  }[issue] ?? "数据服务状态";
}

function inferOrderStatus(text: string, source: string, shape: string): string {
  if (source === "mobile") {
    if (/提交失败|提交.*失败|参数校验/.test(text)) return "mobile-submit-failed";
    if (/执行成功|已成功|成功/.test(text)) return "mobile-success";
    if (/执行中|处理中|等待/.test(text)) return "mobile-running";
    return "mobile-failed";
  }

  if (shape === "batch") {
    if (/全部成功|全部执行完成|成功数量/.test(text)) return "batch-success";
    if (/查不到|状态异常|无法定位/.test(text)) return "batch-unknown";
    if (/执行中|处理中|很久|卡住|卡单/.test(text)) return "batch-running";
    return "batch-failed";
  }

  if (/审核驳回|驳回/.test(text)) return "single-rejected";
  if (/执行成功|已成功|成功/.test(text)) return "single-success";
  if (/执行失败|失败/.test(text)) return "single-failed";
  return "single-running";
}

function getOrderStatusLabel(status: string): string {
  return {
    "single-running": "执行中 / 长时间未完成",
    "single-failed": "执行失败",
    "single-rejected": "审核驳回",
    "single-success": "执行成功",
    "batch-running": "批量主任务执行中",
    "batch-success": "批量全部成功",
    "batch-failed": "批量部分失败 / 全部失败",
    "batch-unknown": "批量状态异常 / 查不到",
    "mobile-submit-failed": "提交失败",
    "mobile-running": "执行中",
    "mobile-failed": "执行失败",
    "mobile-success": "执行成功",
  }[status] ?? "执行失败";
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
  const actionMap: Record<string, string[]> = {
    data: ["核查数据服务状态并恢复数据能力", "确认 APN / 网络侧状态是否同步", "恢复后引导用户重新上网验证"],
    lifecycle: ["核查停机原因和生命周期状态", "满足条件时执行复机", "复机后复测数据、短信和语音能力"],
    sms: ["核查短信服务是否停开", "恢复短信服务功能", "恢复后引导用户收发短信验证"],
    voice: ["核查语音服务是否停开", "恢复语音服务功能", "恢复后引导用户拨测验证"],
    multi: ["优先处理停机与生命周期异常", "再恢复数据、短信和语音服务能力", "恢复后按异常项逐一复测"],
  };
  const executableMap: Record<string, { id: string; label: string; description: string }[]> = {
    data: [{ id: "restore-data-service", label: "恢复数据服务", description: "适用于数据服务异常关闭场景。" }],
    lifecycle: [{ id: "resume-card", label: "复机", description: "适用于停机或生命周期异常场景。" }],
    sms: [{ id: "restore-sms-service", label: "恢复短信服务", description: "适用于短信能力停开场景。" }],
    voice: [{ id: "restore-voice-service", label: "恢复语音服务", description: "适用于语音能力停开场景。" }],
    multi: [
      { id: "resume-card", label: "复机", description: "优先恢复生命周期状态。" },
      { id: "restore-service", label: "恢复服务功能", description: "恢复数据、短信、语音能力。" },
    ],
  };

  return {
    faultType: issueMap[issue as keyof typeof issueMap] ?? "通信异常",
    checkedItems: ["SIM 卡信息", "生命周期 / 卡状态", "停机原因", "数据服务", "短信服务", "语音服务"],
    conclusion:
      issue === "multi"
        ? "当前存在多项服务状态异常，优先建议处理停机与生命周期状态，再复核数据、短信和语音能力。"
        : `当前主异常方向为${issueMap[issue as keyof typeof issueMap] ?? "通信异常"}，建议按诊断结论执行对应恢复或核查动作。`,
    details: baseDetails,
    suggestedActions: actionMap[issue] ?? actionMap.data,
    status: issue === "multi" || issue === "lifecycle" ? "warning" : "info",
    reference: "TRB-COMM-POC-01",
    executableActions: executableMap[issue] ?? executableMap.data,
    unresolvedPoint: "需确认用户侧重新验证后业务是否恢复。",
  };
}

function buildOrderResult(
  intake: TroubleshootingIntake,
  order: { source: string; shape: string; status: string },
): TroubleshootingResult {
  const sourceLabel = order.source === "mobile" ? "掌厅轻量化操作订单" : "CMIOT 订单";
  const shapeLabel = order.source === "mobile" ? "轻量化操作订单" : order.shape === "batch" ? "批量订单" : "单订单";
  const orderRef = intake.batchTaskNo ?? intake.orderNo ?? (order.shape === "batch" ? "BT20260423009" : "MO202604230018");

  const statusProfiles: Record<
    string,
    { label: string; conclusion: string; details: { label: string; value: string }[]; actions: string[]; success?: boolean; executable?: boolean }
  > = {
    "single-running": {
      label: "执行中 / 长时间未完成",
      conclusion: "单订单长时间处于执行中，已达到疑似卡单阈值，建议继续等待短周期回执或转人工检查下游任务。",
      details: [
        { label: "当前状态", value: "执行中" },
        { label: "已执行时长", value: "42 分钟" },
        { label: "是否疑似卡单", value: "是，超过常规执行时长阈值" },
      ],
      actions: ["继续等待短周期回执", "超过阈值后转人工检查下游任务", "必要时重新触发执行链路"],
    },
    "single-failed": {
      label: "执行失败",
      conclusion: "单订单执行失败，失败环节定位在下游服务调用，建议按失败原因修正后重试或转人工。",
      details: [
        { label: "失败原因", value: "服务状态不允许操作" },
        { label: "失败环节", value: "下游能力执行" },
        { label: "建议下一步", value: "核查号码状态后重新触发执行" },
      ],
      actions: ["核查服务号码当前状态", "修正状态或参数后重试", "无法重试时转人工进一步处理"],
      executable: true,
    },
    "single-rejected": {
      label: "审核驳回",
      conclusion: "单订单已被审核驳回，需要按驳回原因补充或修正资料后重新提交。",
      details: [
        { label: "驳回原因", value: "业务材料与申请事项不一致" },
        { label: "建议补充/修正项", value: "补充授权材料并核对申请号码" },
      ],
      actions: ["补充授权材料", "修正申请信息", "重新提交审核"],
    },
    "single-success": {
      label: "执行成功",
      conclusion: "单订单已执行成功，如前台仍异常，建议继续排查业务状态同步或转人工。",
      details: [
        { label: "执行成功结果", value: "订单已完成，业务侧已返回成功回执" },
        { label: "前台仍异常建议", value: "继续排查状态同步或转人工复核" },
      ],
      actions: ["引导客户经理刷新前台状态", "若业务仍未恢复，切换通信异常诊断", "必要时转人工复核"],
      success: true,
    },
    "batch-running": {
      label: "批量主任务执行中",
      conclusion: "批量主任务仍在执行中，需关注执行时长和疑似卡单阈值。",
      details: [
        { label: "主任务状态", value: "执行中" },
        { label: "执行时长", value: "58 分钟" },
        { label: "是否疑似卡单", value: "接近阈值，建议继续观察" },
      ],
      actions: ["继续观察主任务回执", "超过阈值后转人工检查批量任务", "必要时查询子任务抽样明细"],
    },
    "batch-success": {
      label: "批量执行全部成功",
      conclusion: "批量主任务已执行完成，所有子任务均返回成功。",
      details: [
        { label: "批量执行完成", value: "是" },
        { label: "成功数量", value: "120" },
      ],
      actions: ["同步完成结果", "若前台仍异常，继续排查业务状态同步"],
      success: true,
    },
    "batch-failed": {
      label: "批量订单部分失败 / 全部失败",
      conclusion: "批量订单存在失败子任务，已查询子任务执行明细并汇总失败原因。",
      details: [
        { label: "总任务数", value: "120" },
        { label: "成功数量", value: "96" },
        { label: "失败数量", value: "24" },
        { label: "失败明细列表", value: "失败子任务 24 条，支持导出给人工坐席" },
        { label: "失败原因 TOP N", value: "服务状态不允许操作、号码状态未同步、下游接口超时" },
      ],
      actions: ["导出失败明细列表", "按失败原因分组处理", "可重试项修正后批量重试"],
      executable: true,
    },
    "batch-unknown": {
      label: "批量主任务状态异常 / 查不到",
      conclusion: "当前无法准确定位批量主任务状态，建议转人工进一步处理。",
      details: [
        { label: "当前无法准确定位", value: "主任务状态异常或查不到" },
        { label: "建议处理", value: "携带订单号、批量任务号和会话上下文转人工" },
      ],
      actions: ["转人工进一步处理", "补充批量任务号或提交时间", "检查是否存在跨系统同步延迟"],
    },
    "mobile-submit-failed": {
      label: "提交失败",
      conclusion: "掌厅轻量化操作订单提交失败，建议修正提交参数后重试或转人工。",
      details: [
        { label: "提交失败原因", value: "参数校验未通过，服务号码状态不满足提交条件" },
        { label: "建议下一步", value: "修正后重试 / 转人工" },
      ],
      actions: ["修正提交参数", "确认服务号码状态", "修正后重试或转人工"],
      executable: true,
    },
    "mobile-running": {
      label: "执行中",
      conclusion: "掌厅轻量化操作订单当前处理中，建议继续等待并关注回执。",
      details: [
        { label: "当前处理中", value: "是" },
        { label: "是否需继续等待", value: "是，未超过轻量化操作等待阈值" },
      ],
      actions: ["继续等待回执", "超过阈值后转人工", "必要时查询关联服务状态"],
    },
    "mobile-failed": {
      label: "执行失败",
      conclusion: "掌厅轻量化操作订单执行失败，建议按失败原因处理后重试。",
      details: [
        { label: "执行失败原因", value: "下游服务恢复能力调用失败" },
        { label: "建议下一步", value: "核查服务能力状态后重新发起轻量动作" },
      ],
      actions: ["核查服务能力状态", "重新触发轻量动作", "失败仍存在时转人工"],
      executable: true,
    },
    "mobile-success": {
      label: "执行成功",
      conclusion: "掌厅轻量化操作订单执行成功，如业务仍未恢复，建议继续排查。",
      details: [
        { label: "订单执行成功", value: "是" },
        { label: "业务仍未恢复建议", value: "继续排查卡状态、服务能力或转人工" },
      ],
      actions: ["引导客户经理复测业务", "业务仍未恢复时继续排查", "必要时转人工"],
      success: true,
    },
  };

  const profile = statusProfiles[order.status] ?? statusProfiles["single-failed"];
  const details = [
    { label: "订单来源", value: sourceLabel },
    { label: "订单形态", value: shapeLabel },
    { label: "订单号 / 批量任务号", value: orderRef },
    { label: "当前状态", value: profile.label },
    ...profile.details,
  ];

  return {
    faultType: `${sourceLabel}${shapeLabel}异常`,
    checkedItems:
      order.source === "mobile"
        ? ["掌厅订单提交状态", "掌厅订单执行状态", "轻量化操作范围", "执行回执"]
        : order.shape === "batch"
          ? ["批量主任务状态", "批量子任务执行明细", "失败原因 TOP N", "建议处理动作"]
          : ["单订单状态", "执行时长", "失败环节", "审核结果"],
    conclusion: profile.conclusion,
    details,
    suggestedActions: profile.actions,
    status: profile.success ? "success" : order.status.includes("running") ? "info" : "warning",
    reference: "TRB-ORDER-POC-02",
    executableActions: profile.executable
      ? [{ id: "retry-light-action", label: "重新触发轻量动作", description: "适用于修正后可重试的订单异常场景。" }]
      : [],
    unresolvedPoint: profile.success ? "前台仍异常时需确认业务侧状态同步。" : "需确认是否具备自动重试条件或转人工处理。",
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
