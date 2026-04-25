<template>
  <div class="page troubleshoot-layout" :class="{ 'sidebar-hidden': !sidebarVisible }">
    <aside v-if="sidebarVisible" class="section-card sidebar">
      <div class="sidebar-head">
        <div>
          <div class="page-kicker">History</div>
          <h3>对话记录</h3>
        </div>
        <button class="sidebar-toggle" type="button" aria-label="隐藏侧边栏" @click="sidebarVisible = false">‹</button>
      </div>

      <div class="history-list">
        <button
          v-for="message in sidebarMessages"
          :key="message.id"
          type="button"
          class="history-item"
          :class="{ active: message.id === latestMessageId }"
          @click="copyHistoryMessage(message.content)"
        >
          <div class="history-content">
            <div class="history-topline">
              <span>{{ roleLabel(message.role) }}</span>
              <small>{{ message.timestamp }}</small>
            </div>
            <strong>{{ shorten(message.content) }}</strong>
          </div>
        </button>
      </div>

      <button class="sidebar-link reset-sidebar" type="button" @click="resetFlow">
        <span>重新对话</span>
        <small>清空当前流程并回到排障入口</small>
      </button>
    </aside>
    <button v-else class="sidebar-rail" type="button" aria-label="显示侧边栏" @click="sidebarVisible = true">
      记录
    </button>

    <div class="troubleshoot-main">
    <section class="summary section-card conversation-card">
      <div ref="conversationScrollRef" class="conversation-scroll">
        <ConversationThread :messages="messages" compact variant="plain" typewriter assistant-avatar-id="troubleshoot" />
        <div v-if="quickActions.length" class="assistant-action-strip">
          <span>{{ quickActionTitle }}</span>
          <div class="chip-grid entry-actions">
            <button
              v-for="action in quickActions"
              :key="action.id"
              class="ghost-button entry-button"
              type="button"
              @click="handleQuickAction(action.id)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="progressTask" class="summary section-card entry-panel">
      <div class="section-heading">
        <div>
          <h3>{{ progressTask.title }}</h3>
          <p>{{ progressTask.description }}</p>
        </div>
        <span class="pill">{{ progressPercent }}%</span>
      </div>
      <progress :value="progressPercent" max="100"></progress>
    </section>

    <section v-if="showRealnameCompletion" class="summary section-card entry-panel">
      <div class="section-heading">
        <div>
          <h3>完善实名资料</h3>
          <p>请输入姓名和证件号码，提交后将继续演示自动处理动作。</p>
        </div>
      </div>
      <div class="field-list">
        <label class="field-block">
          <span class="field-label">姓名</span>
          <input v-model="realnameForm.name" type="text" placeholder="请输入姓名" />
        </label>
        <label class="field-block">
          <span class="field-label">证件号码</span>
          <input v-model="realnameForm.idNo" type="text" placeholder="请输入证件号码" />
        </label>
      </div>
      <button class="accent-button process-button" type="button" @click="submitRealnameCompletion">提交并处理</button>
    </section>

    <section v-if="showComposer" class="summary section-card chat-composer">
      <div class="composer-row">
        <button class="ghost-button media-button" type="button" title="上传图片" aria-label="上传图片" @click="showBuildingToast">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 19h14V5H5v14Zm2-2 3.2-4 2.3 2.8 3-3.8L18 17H7Zm2.5-6.8a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
          </svg>
        </button>
        <textarea
          v-model="draft"
          rows="1"
          placeholder="请输入问题描述，按 Enter 发送"
          @keydown="handleComposerKeydown"
        ></textarea>
        <button
          class="ghost-button voice-button"
          type="button"
          @click="showBuildingToast"
          title="按住说话"
          aria-label="按住说话"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
          </svg>
        </button>
        <button class="accent-button send-button" type="button" @click="sendText">发送</button>
      </div>
      <small class="composer-hint">支持上传截图辅助排障</small>
    </section>
    <transition name="toast-fade">
      <div v-if="toastVisible" class="build-toast">当前功能还在建设中哦~</div>
    </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import ConversationThread from "../../components/agent/ConversationThread.vue";
import { appState, markAgentVisited } from "../../stores/appState";
import type { ConversationMessage, TroubleshootingEntryId } from "../../types/agent";

const route = useRoute();

type Phase =
  | "entry"
  | "collecting"
  | "confirming"
  | "diagnosing"
  | "result-actions"
  | "realname-completion"
  | "executing"
  | "finished"
  | "closed";

type QuickActionId =
  | TroubleshootingEntryId
  | "start"
  | "handoff"
  | "execute-communication"
  | "execute-order"
  | "realname-reauth"
  | "complete-realname-info"
  | "resolved"
  | "unresolved"
  | "restart";

interface QuickAction {
  id: QuickActionId;
  label: string;
}

interface IntakeState {
  entryId: TroubleshootingEntryId | null;
  userKey: string;
  issue: string;
  originalText: string;
  latestResult: string;
}

interface ProgressTask {
  title: string;
  description: string;
}

const entryLabels: Record<TroubleshootingEntryId, string> = {
  communication: "通信异常处理",
  order: "订单异常处理",
  realname: "实名异常处理",
};

const entryActions: QuickAction[] = [
  { id: "communication", label: "通信异常处理" },
  { id: "order", label: "订单异常处理" },
  { id: "realname", label: "实名异常处理" },
];

const phase = ref<Phase>("entry");
const messages = ref<ConversationMessage[]>([]);
const draft = ref("");
const intake = ref<IntakeState>({
  entryId: null,
  userKey: "",
  issue: "",
  originalText: "",
  latestResult: "",
});
const progressTask = ref<ProgressTask | null>(null);
const progressPercent = ref(0);
const realnameForm = ref({ name: "", idNo: "" });
const conversationScrollRef = ref<HTMLElement | null>(null);
const timers: number[] = [];
const sidebarVisible = ref(false);
const toastVisible = ref(false);
let toastTimer = 0;

const showComposer = computed(() => !["diagnosing", "executing", "finished", "realname-completion"].includes(phase.value));
const showRealnameCompletion = computed(() => phase.value === "realname-completion");
const sidebarMessages = computed(() => [...messages.value].reverse());
const latestMessageId = computed(() => messages.value.at(-1)?.id ?? "");
const accountManagerName = computed(() => {
  const name = appState.user?.name?.trim() || "当前账号";
  return /经理|客户经理/.test(name) ? name : `${name}客户经理`;
});

const quickActions = computed<QuickAction[]>(() => {
  if (phase.value === "entry") return entryActions;
  if (phase.value === "confirming") return [{ id: "start", label: "开始排障" }];
  if (phase.value === "result-actions") {
    if (intake.value.entryId === "communication") {
      return [
        { id: "handoff", label: "人工处理" },
        { id: "execute-communication", label: "复机" },
      ];
    }
    if (intake.value.entryId === "order") {
      return [
        { id: "handoff", label: "人工处理" },
        { id: "execute-order", label: "执行订单处理" },
      ];
    }
    return [
      { id: "handoff", label: "人工处理" },
      { id: "realname-reauth", label: "重新认证" },
      { id: "complete-realname-info", label: "完善资料" },
    ];
  }
  if (phase.value === "finished") {
    return [
      { id: "resolved", label: "已解决" },
      { id: "unresolved", label: "未解决" },
      { id: "restart", label: "重新对话" },
    ];
  }
  if (phase.value === "closed") return [{ id: "restart", label: "重新对话" }];
  return [];
});

const quickActionTitle = computed(() => {
  if (phase.value === "entry") return "快捷入口";
  if (phase.value === "confirming") return "确认开始";
  if (phase.value === "finished") return "结果确认";
  if (phase.value === "closed") return "重新开始";
  return "后续操作";
});

function nowText() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function pushMessage(role: ConversationMessage["role"], content: string, tone?: ConversationMessage["tone"]) {
  messages.value.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: nowText(),
    tone,
  });
  scrollConversationToBottom();
}

function roleLabel(role: ConversationMessage["role"]) {
  if (role === "assistant") return "助手";
  if (role === "user") return "你";
  return "系统";
}

function shorten(content: string) {
  return content.length > 18 ? `${content.slice(0, 18)}...` : content;
}

async function copyHistoryMessage(content: string) {
  try {
    await navigator.clipboard.writeText(content);
  } catch {
    // no-op
  }
}

function scrollConversationToBottom() {
  nextTick(() => {
    const node = conversationScrollRef.value;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  });
}

function schedule(callback: () => void, delay: number) {
  const timer = window.setTimeout(callback, delay);
  timers.push(timer);
}

function clearTimers() {
  timers.splice(0).forEach((timer) => window.clearTimeout(timer));
}

function resetFlow() {
  clearTimers();
  phase.value = "entry";
  draft.value = "";
  intake.value = {
    entryId: null,
    userKey: "",
    issue: "",
    originalText: "",
    latestResult: "",
  };
  progressTask.value = null;
  progressPercent.value = 0;
  realnameForm.value = { name: "", idNo: "" };
  messages.value = [];
  pushMessage("assistant", `你好，${accountManagerName.value}，我是您的排障小助手，请问我有什么可以帮助您？`);
}

async function startOrderFlowFromAlert(orderNo: string) {
  clearTimers();
  draft.value = "";
  intake.value = {
    entryId: "order",
    userKey: orderNo,
    issue: "订单异常处理",
    originalText: `订单号：${orderNo}，来自消息提醒的订单异常处理`,
    latestResult: "",
  };
  progressTask.value = null;
  progressPercent.value = 0;
  realnameForm.value = { name: "", idNo: "" };
  messages.value = [];
  phase.value = "confirming";
  pushMessage("assistant", `已收到订单监控提醒，正在为订单 ${orderNo} 发起异常处理流程。`);
  pushMessage("system", `已自动带入订单号 ${orderNo}，开始诊断执行状态与异常原因。`, "info");
  await nextTick();
  await startTroubleshooting();
}

function showBuildingToast() {
  toastVisible.value = true;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false;
  }, 1600);
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  sendText();
}

function sendText() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  pushMessage("user", text);

  if (phase.value === "entry") {
    pushMessage("assistant", "我可以进行通信异常处理、订单异常处理、实名异常处理，请问您遇到哪方面问题？", "info");
    return;
  }

  if (phase.value === "collecting") {
    collectProblem(text);
    return;
  }

  if (phase.value === "confirming") {
    if (text === "1") {
      startTroubleshooting();
      return;
    }
    intake.value.originalText = `${intake.value.originalText} ${text}`.trim();
    intake.value.issue = summarizeIssue(intake.value.originalText, intake.value.entryId);
    pushMessage("assistant", "补充信息已收到，是否开始排障？");
  }
}

function handleQuickAction(actionId: QuickActionId) {
  if (actionId === "communication" || actionId === "order" || actionId === "realname") {
    selectEntry(actionId);
    return;
  }
  if (actionId === "start") {
    pushMessage("user", "开始排障");
    startTroubleshooting();
    return;
  }
  if (actionId === "handoff") {
    pushMessage("user", "人工处理");
    enterManualChat();
    return;
  }
  if (actionId === "execute-communication") {
    executeAction("复机");
    return;
  }
  if (actionId === "execute-order") {
    executeAction("执行订单处理");
    return;
  }
  if (actionId === "realname-reauth") {
    executeAction("重新认证");
    return;
  }
  if (actionId === "complete-realname-info") {
    pushMessage("user", "完善资料");
    pushMessage("assistant", "请在下方输入姓名和证件号码。");
    phase.value = "realname-completion";
    return;
  }
  if (actionId === "resolved") {
    pushMessage("user", "已解决");
    pushMessage("assistant", "很高兴帮您解决问题，本次排障已结束。", "success");
    phase.value = "closed";
    return;
  }
  if (actionId === "unresolved") {
    pushMessage("user", "未解决");
    enterManualChat();
    return;
  }
  if (actionId === "restart") {
    resetFlow();
  }
}

function selectEntry(entryId: TroubleshootingEntryId) {
  intake.value = {
    entryId,
    userKey: "",
    issue: "",
    originalText: "",
    latestResult: "",
  };
  phase.value = "collecting";
  pushMessage("user", entryLabels[entryId]);

  if (entryId === "communication") {
    pushMessage("assistant", "小助手已准备就绪，请您提供下您的手机号或者ICCID以及出现的问题。");
    return;
  }
  if (entryId === "order") {
    pushMessage("assistant", "小助手已准备就绪，请您提供下您的手机号或者订单号以及出现的问题。");
    return;
  }
  pushMessage("assistant", "小助手已准备就绪，请您提供下您的手机号以及出现的问题。");
}

function collectProblem(text: string) {
  const entryId = intake.value.entryId;
  if (!entryId) return;

  const userKey = extractUserKey(text, entryId);
  if (!userKey) {
    pushMessage("assistant", missingMessage(entryId), "warning");
    return;
  }

  intake.value.userKey = userKey;
  intake.value.originalText = text;
  intake.value.issue = summarizeIssue(text, entryId);
  phase.value = "confirming";
  pushMessage(
    "assistant",
    `小助手已收到您的问题，异常用户：${intake.value.userKey}，异常问题：${intake.value.issue}，您还有什么需要补充，比如异常界面截图等等。`,
  );
}

function missingMessage(entryId: TroubleshootingEntryId) {
  if (entryId === "communication") return "我需要您提供手机号或者ICCID。";
  if (entryId === "order") return "我需要您提供手机号或订单号，并描述具体订单异常问题。";
  return "我需要您提供手机号，并描述具体实名异常问题。";
}

function extractUserKey(text: string, entryId: TroubleshootingEntryId) {
  const phone = text.match(/1[3-9]\d{9}/)?.[0];
  const iccid = text.match(/89\d{10,20}/)?.[0];
  const demoPhone = text.match(/(?:手机号|号码|用户|联系电话)[:：]?\s*([A-Z0-9]{6,})/i)?.[1];
  const orderNo = text.match(/(?:订单号|订单|工单号|单号)[:：]?\s*([A-Z0-9]{6,})/i)?.[1] ?? text.match(/[A-Z]{1,3}\d{6,}|\d{8,}[A-Z]?/i)?.[0];

  if (entryId === "communication") return phone ?? iccid ?? "";
  if (entryId === "order") return phone ?? orderNo ?? demoPhone ?? "";
  return phone ?? "";
}

function summarizeIssue(text: string, entryId: TroubleshootingEntryId | null) {
  if (entryId === "communication") {
    if (/短信|验证码/.test(text)) return "短信异常";
    if (/上网|流量|数据|网络/.test(text)) return "上网异常";
    if (/语音|通话|电话/.test(text)) return "语音异常";
    if (/停机|卡状态|保号/.test(text)) return "卡状态异常";
    return "通信异常";
  }
  if (entryId === "order") {
    if (/超时|卡单|一直|处理中|执行中/.test(text)) return "订单超时";
    if (/失败|报错/.test(text)) return "订单失败";
    return "订单异常";
  }
  if (/超时|未反馈|进行中|处理中/.test(text)) return "实名超时未反馈";
  if (/失败|不一致|资料|证件/.test(text)) return "实名失败";
  return "实名异常";
}

async function startTroubleshooting() {
  if (!intake.value.entryId) return;
  phase.value = "diagnosing";

  if (intake.value.entryId === "communication") {
    await runCommunicationFlow();
    return;
  }
  if (intake.value.entryId === "order") {
    await runOrderFlow();
    return;
  }
  await runRealnameFlow();
}

function runProgress(title: string, description: string, duration: number) {
  progressTask.value = { title, description };
  progressPercent.value = 0;
  const startedAt = Date.now();

  return new Promise<void>((resolve) => {
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      progressPercent.value = Math.min(100, Math.round((elapsed / duration) * 100));
      if (elapsed >= duration) {
        window.clearInterval(timer);
        progressPercent.value = 100;
        schedule(() => {
          progressTask.value = null;
          resolve();
        }, 180);
      }
    }, 120);
    timers.push(timer);
  });
}

async function runCommunicationFlow() {
  await runProgress("智能诊断统一入口", "正在调用智能诊断统一入口，请稍候。", 3000);
  pushMessage(
    "assistant",
    [
      "已完成 SIM 信息诊断：",
      `SIM 信息：${intake.value.userKey.startsWith("89") ? intake.value.userKey : "89860422102468000124"}`,
      "卡状态：停机保号",
      "是否停机：是",
      "短信服务是否异常：否",
      "数据服务是否异常：否",
      "通信服务是否异常：否",
    ].join("\n"),
  );

  await runProgress("故障原因排查", "正在进行故障原因排查，请稍候。", 5000);
  pushMessage(
    "assistant",
    [
      "SIM 卡信息：89860422102468000124",
      "生命周期 / 卡状态：停机保号",
      "停机时间：2026-04-23 09:18:32",
      "停机原因：账户欠费触发系统停机",
      "数据服务状态：正常",
      "短信服务状态：正常",
      "语音服务状态：正常",
      "",
      "建议动作：",
      "核查停机原因和生命周期状态",
      "满足条件时执行复机",
      "复机后复测数据、短信和语音能力",
    ].join("\n"),
    "warning",
  );
  intake.value.latestResult = "已排查到停机保号，停机原因是账户欠费触发系统停机，建议复机后复测数据、短信和语音能力。";
  pushMessage("assistant", "我已排查到具体原因，请您选择接下来的操作。");
  phase.value = "result-actions";
}

async function runOrderFlow() {
  await runProgress("智能诊断统一入口", "正在调用智能诊断统一入口，请稍候。", 5000);
  pushMessage(
    "assistant",
    ["用户：13900139001", "订单来源：CMIOT 订单", "订单：MO202604230001"].join("\n"),
  );

  pushMessage("assistant", "小助手正在进行订单状态查询。");
  await runProgress("订单状态查询", "正在查询订单状态，请稍候。", 5000);
  pushMessage("assistant", ["当前订单状态：执行中", "执行时间：42 分钟", "是否超时：是"].join("\n"), "info");
  pushMessage(
    "assistant",
    [
      "我已查询到具体订单信息：",
      "",
      "已核查项：",
      "单订单状态",
      "执行时长",
      "失败环节",
      "审核结果",
      "",
      "明细信息：",
      "订单来源：CMIOT 订单",
      "订单形态：单订单",
      "订单号 / 批量任务号：MO202604230001",
      "当前状态：执行中 / 长时间未完成",
      "已执行时长：42 分钟",
      "是否疑似卡单：是，超过常规执行时长阈值",
      "",
      "建议动作：",
      "继续等待短周期回执",
      "超过阈值后转人工检查下游任务",
      "必要时重新触发执行链路",
    ].join("\n"),
    "warning",
  );
  intake.value.latestResult = "已查询到 CMIOT 单订单执行中且长时间未完成，疑似卡单，建议继续等待短周期回执或转人工检查下游任务。";
  pushMessage("assistant", "请您继续您的操作。");
  phase.value = "result-actions";
}

async function runRealnameFlow() {
  const incompleteProfile = /资料|材料|照片|缺失|不完整/.test(intake.value.originalText);
  const failureReason = incompleteProfile ? "资料不完整" : "姓名/证件号不一致";
  const failureSummary = incompleteProfile
    ? "实名订单处理失败，失败原因疑似资料不完整，请先完善实名信息（姓名和身份证号）后重新认证或转人工处理。"
    : "实名订单处理失败，失败原因疑似姓名/证件号不一致，可完善资料后重新认证或转人工处理。";

  await runProgress("智能诊断统一入口", "正在调用智能诊断统一入口，请稍候。", 5000);
  pushMessage("assistant", [`用户：${intake.value.userKey || "13700137002"}`, "实名查询时间：2026-04-23 09:18:32"].join("\n"));

  pushMessage("assistant", "正在进行查询状态确认。");
  await runProgress("实名状态查询", "正在查询实名状态，请稍候。", 5000);
  pushMessage("assistant", ["实名查询状态：失败", "查询结束时间：2026-04-23 09:22:10", `失败原因：${failureReason}`].join("\n"), "warning");
  pushMessage(
    "assistant",
    [
      "我已确认查询状态，结果如下：",
      "",
      failureSummary,
      "",
      "已核查项：",
      "实名订单状态",
      "实名结果明细",
      "资料完整性",
      "状态同步情况",
      "",
      "明细信息：",
      "实名订单号：222222222222222222",
      "当前状态：失败",
      `结果明细：${failureReason}`,
      "",
      "建议动作：",
      incompleteProfile ? "补充姓名和身份证号后重新认证" : "完善资料后重新认证",
      "无法确认材料时转人工处理",
      "",
      "客户经理后续操作：",
      "可选择转人工处理，或在具备自动动作时执行处理。",
    ].join("\n"),
    "warning",
  );
  intake.value.latestResult = `已确认实名查询失败，失败原因疑似${failureReason}，建议${incompleteProfile ? "补充姓名和身份证号后重新认证" : "完善资料后重新认证"}或转人工处理。`;
  pushMessage("assistant", "请选择您要执行的操作。");
  phase.value = "result-actions";
}

function submitRealnameCompletion() {
  if (!realnameForm.value.name.trim() || !realnameForm.value.idNo.trim()) {
    pushMessage("assistant", "请先输入姓名和证件号码。", "warning");
    return;
  }
  pushMessage("user", `姓名：${realnameForm.value.name}，证件号码：${realnameForm.value.idNo}`);
  executeAction("完善资料");
}

async function executeAction(actionLabel: string) {
  pushMessage("user", actionLabel);
  phase.value = "executing";
  pushMessage("system", `已进行${actionLabel}操作，请不要关闭页面，耐心等待。`, "info");
  await runProgress("执行处理中", `正在执行${actionLabel}操作，请稍候。`, 8000);
  const resultMessage = `执行成功，用户${intake.value.userKey}的${intake.value.issue}问题已解决，请核查！`;
  intake.value.latestResult = resultMessage;
  pushMessage("assistant", resultMessage, "success");
  phase.value = "finished";
}

function buildManualSummary() {
  const entryLabel = intake.value.entryId ? entryLabels[intake.value.entryId] : "未选择";
  return [
    "异常情况摘要：",
    `排障类型：${entryLabel}`,
    `异常用户：${intake.value.userKey || "未识别"}`,
    `异常问题：${intake.value.issue || "用户反馈未解决"}`,
    `原始描述：${intake.value.originalText || "无"}`,
    "补充材料：无",
    intake.value.latestResult ? `当前处理结果：${intake.value.latestResult}` : "当前处理结果：自动排障后仍需人工跟进",
  ].join("\n");
}

function enterManualChat() {
  const customerName = accountManagerName.value;
  pushMessage("assistant", `你好，${customerName}，我是客服林安，工号 CS2048，请问你有什么问题？`);
  pushMessage("user", buildManualSummary());
  pushMessage("assistant", "已收到问题，并进行反馈，请耐心等待。", "info");
  phase.value = "closed";
}

onMounted(() => {
  markAgentVisited("troubleshoot");
  resetFlow();
  const autoSources = new Set(["message-center", "my-rules"]);
  const fromAutoSource = typeof route.query.source === "string" && autoSources.has(route.query.source);
  const autoEntry = route.query.entry === "order";
  const orderNo = typeof route.query.orderNo === "string" ? route.query.orderNo.trim() : "";
  if (fromAutoSource && autoEntry && orderNo) {
    void startOrderFlowFromAlert(orderNo);
  }
});

watch(
  () => [messages.value.length, quickActions.value.length, progressTask.value?.title, phase.value],
  () => scrollConversationToBottom(),
);

watch(
  () => [route.query.source, route.query.entry, route.query.orderNo].join("|"),
  (value, oldValue) => {
    if (value === oldValue) return;
    const autoSources = new Set(["message-center", "my-rules"]);
    const fromAutoSource = typeof route.query.source === "string" && autoSources.has(route.query.source);
    const autoEntry = route.query.entry === "order";
    const orderNo = typeof route.query.orderNo === "string" ? route.query.orderNo.trim() : "";
    if (fromAutoSource && autoEntry && orderNo) {
      void startOrderFlowFromAlert(orderNo);
    }
  },
);

onBeforeUnmount(() => {
  clearTimers();
  window.clearTimeout(toastTimer);
});
</script>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  gap: 10px;
}

.troubleshoot-layout {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  align-items: start;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.troubleshoot-layout.sidebar-hidden {
  grid-template-columns: 34px minmax(0, 1fr);
}

.troubleshoot-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.sidebar,
.conversation-card {
  min-width: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 170px);
  padding: 9px;
  overflow: hidden;
}

.sidebar-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.sidebar-head h3 {
  margin: 2px 0 0;
  font-size: 14px;
}

.sidebar-toggle,
.sidebar-rail {
  border: 1px solid rgba(153, 192, 255, 0.16);
  background: rgba(10, 31, 59, 0.72);
  color: var(--text-main);
}

.sidebar-toggle {
  width: 28px;
  height: 28px;
  border-radius: 12px;
  font-size: 18px;
  line-height: 1;
}

.sidebar-rail {
  position: sticky;
  top: 0;
  width: 34px;
  min-height: 132px;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}

.history-item {
  display: flex;
  align-items: flex-start;
  padding: 9px;
  border-radius: 14px;
  border: 1px solid rgba(141, 188, 255, 0.1);
  background: rgba(7, 25, 49, 0.72);
  color: var(--text-main);
  text-align: left;
  min-width: 0;
}

.history-content {
  min-width: 0;
  flex: 1;
}

.history-topline {
  display: block;
}

.history-topline span,
.history-topline small {
  color: var(--text-muted);
  font-size: 10px;
}

.history-item strong {
  display: -webkit-box;
  margin-top: 5px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1.4;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.history-item.active {
  border-color: rgba(99, 191, 255, 0.34);
  background: rgba(16, 51, 97, 0.68);
}

.sidebar-link {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(153, 192, 255, 0.16);
  background: rgba(10, 31, 59, 0.58);
  color: var(--text-main);
  text-align: left;
}

.sidebar-link span {
  font-size: 14px;
  font-weight: 700;
}

.sidebar-link small {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.conversation-card {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  padding: 18px;
}

.conversation-card {
  flex-direction: column;
}

.conversation-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
  -webkit-overflow-scrolling: touch;
}

.assistant-action-strip {
  margin-top: 12px;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid rgba(153, 192, 255, 0.14);
  background: rgba(9, 31, 61, 0.42);
}

.assistant-action-strip > span {
  display: block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-size: 13px;
}

.entry-panel {
  padding: 18px;
}

.entry-panel .section-heading {
  align-items: flex-start;
}

.entry-panel .section-heading > div {
  min-width: 0;
}

.entry-actions {
  margin-top: 14px;
  gap: 8px;
}

.entry-button {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

.entry-button.active {
  border-color: rgba(109, 198, 255, 0.45);
  background: rgba(23, 74, 141, 0.64);
}

.entry-current {
  flex-shrink: 0;
}

.chat-composer {
  position: relative;
  z-index: 5;
  flex: 0 0 auto;
  padding: 10px;
}

.composer-attachment {
  margin-bottom: 10px;
  padding: 9px 12px;
  border-radius: 14px;
  border: 1px solid rgba(153, 192, 255, 0.14);
  background: rgba(7, 24, 46, 0.56);
  color: var(--text-secondary);
  font-size: 12px;
}

.composer-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 42px 64px;
  gap: 7px;
  align-items: center;
}

.chat-composer textarea {
  width: 100%;
  min-height: 42px;
  max-height: 84px;
  padding: 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(155, 196, 255, 0.18);
  outline: none;
  resize: none;
  background: rgba(7, 24, 46, 0.72);
  color: var(--text-main);
  line-height: 1.55;
}

.chat-composer textarea::placeholder {
  color: var(--text-muted);
}

.media-button,
.voice-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 42px;
  padding: 0;
  white-space: nowrap;
  border-radius: 15px;
  font-size: 18px;
  font-weight: 700;
}

.media-button svg,
.voice-button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.voice-button.active {
  border-color: rgba(92, 201, 255, 0.56);
  background: rgba(23, 74, 141, 0.78);
}

.composer-hint {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  line-height: 1.4;
}

.send-button {
  min-height: 42px;
  min-width: 0;
  padding: 0 12px;
  border-radius: 16px;
}

.hidden-file-input {
  display: none;
}

.process-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 16, 33, 0.58);
  backdrop-filter: blur(8px);
}

.process-dialog {
  width: min(320px, 100%);
  padding: 18px;
}

.process-button {
  width: 100%;
  margin-top: 18px;
  padding: 12px 14px;
}

.reset-button {
  width: 100%;
  padding: 14px 16px;
}

.build-toast {
  position: absolute;
  left: 50%;
  bottom: 110px;
  transform: translateX(-50%);
  z-index: 8;
  min-width: 184px;
  max-width: calc(100% - 48px);
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(7, 18, 36, 0.92);
  border: 1px solid rgba(141, 193, 255, 0.2);
  color: #eef7ff;
  text-align: center;
  font-size: 13px;
  box-shadow: 0 16px 28px rgba(0, 8, 20, 0.28);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
