<template>
  <div class="page">
    <section class="summary section-card entry-panel">
      <div class="section-heading">
        <div>
          <h3>业务排障助手</h3>
          <p>面向客户经理的业务排障闭环，支持问题受理、参数识别、流程编排、结果输出和后续处理。</p>
        </div>
      </div>
      <div class="chip-grid entry-actions">
        <button
          v-for="entry in troubleshootingEntryCards"
          :key="entry.id"
          class="ghost-button entry-button"
          :class="{ active: selectedEntry === entry.id }"
          type="button"
          @click="selectEntry(entry.id)"
        >
          {{ entry.title }}
        </button>
        <span class="pill entry-current">当前：{{ selectedEntryLabel }}</span>
      </div>
    </section>
    <ConversationThread :messages="messages" />

    <FlowDecisionCard
      v-if="currentCard"
      :card="currentCard"
      :error-message="errorMessage"
      @submit="handleSubmit"
    />

    <section v-if="recognition && !recognition.inScope" class="summary section-card">
      <div class="section-heading">
        <div>
          <h3>建议切换智能体</h3>
          <p>当前问题不属于业务排障范围，可切换到更匹配的智能体。</p>
        </div>
        <span class="pill">已结束</span>
      </div>
      <div class="chip-grid">
        <span v-for="agent in recognition.redirectAgents" :key="agent" class="pill">{{ agent }}</span>
      </div>
    </section>

    <TroubleshootingResultPanel
      v-if="result"
      :result="result"
      :execution-trace="executionTrace"
      :handoff-summary="handoffSummary"
      @action="handleResultAction"
    />

    <div v-if="executeLoading || executeSuccessVisible" class="process-mask">
      <section class="summary section-card process-dialog">
        <div class="section-heading">
          <div>
            <h3>{{ executeLoading ? "正在执行处理" : "处理成功" }}</h3>
            <p>
              {{
                executeLoading
                  ? "系统正在调用执行能力，请稍候..."
                  : "执行动作已完成，处理结果已同步到当前会话。"
              }}
            </p>
          </div>
          <span class="pill">{{ executeLoading ? "处理中" : "成功" }}</span>
        </div>
        <button
          v-if="executeSuccessVisible"
          class="accent-button process-button"
          type="button"
          @click="executeSuccessVisible = false"
        >
          我知道了
        </button>
      </section>
    </div>

    <button class="ghost-button reset-button" type="button" @click="resetFlow">重新开始业务排障</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import ConversationThread from "../../components/agent/ConversationThread.vue";
import FlowDecisionCard from "../../components/agent/FlowDecisionCard.vue";
import TroubleshootingResultPanel from "../../components/agent/TroubleshootingResultPanel.vue";
import {
  businessTroubleshootingIntro,
  buildExecutionTrace,
  buildHandoffSummary,
  buildTroubleshootingResult,
  getActionLabel,
  getMissingFields,
  inferCommunicationRoute,
  inferOrderRoute,
  intakeCards,
  mergeSupplement,
  orchestrationCards,
  recognizeTroubleshooting,
  supplementCard,
  troubleshootingEntryCards,
  troubleshootingEntryLabels,
} from "../../mock/businessTroubleshooting";
import { markAgentVisited } from "../../stores/appState";
import type {
  ConversationMessage,
  DecisionCard,
  TroubleshootingActionId,
  TroubleshootingEntryId,
  TroubleshootingExecutionTrace,
  TroubleshootingHandoffSummary,
  TroubleshootingIntake,
  TroubleshootingRecognition,
  TroubleshootingResult,
} from "../../types/agent";

type TroubleshootingPhase = "intake" | "supplement" | "orchestration" | "result" | "finished";
type OrderRouteStep = "source" | "cmiot-shape" | "cmiot-single-status" | "cmiot-batch-status" | "mobile-status";

const phase = ref<TroubleshootingPhase>("intake");
const orderRouteStep = ref<OrderRouteStep>("source");
const orderRoutePayload = ref<Record<string, string | string[]>>({});
const selectedEntry = ref<TroubleshootingEntryId>("communication");
const recognition = ref<TroubleshootingRecognition | null>(null);
const intake = ref<TroubleshootingIntake | null>(null);
const result = ref<TroubleshootingResult | null>(null);
const executionTrace = ref<TroubleshootingExecutionTrace | null>(null);
const handoffSummary = ref<TroubleshootingHandoffSummary | null>(null);
const executeLoading = ref(false);
const executeSuccessVisible = ref(false);
const errorMessage = ref("");
const messages = ref<ConversationMessage[]>([]);
const timers: number[] = [];

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
  phase.value = "intake";
  recognition.value = null;
  intake.value = null;
  orderRouteStep.value = "source";
  orderRoutePayload.value = {};
  result.value = null;
  executionTrace.value = null;
  handoffSummary.value = null;
  executeLoading.value = false;
  executeSuccessVisible.value = false;
  errorMessage.value = "";
  messages.value = [];
  pushMessage("assistant", businessTroubleshootingIntro);
}

function formatPayload(payload: Record<string, string | string[]>) {
  return Object.entries(payload)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : String(value).trim()))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join("、") : value}`)
    .join("；");
}

function selectEntry(entryId: TroubleshootingEntryId) {
  selectedEntry.value = entryId;
  orderRouteStep.value = "source";
  orderRoutePayload.value = {};
  pushMessage("user", `选择入口：${troubleshootingEntryLabels[entryId]}`);
}

function handleSubmit(payload: Record<string, string | string[]>) {
  errorMessage.value = "";

  if (phase.value === "intake") {
    const normalizedPayload = { ...payload, entryId: payload.entryId || selectedEntry.value };
    pushMessage("user", formatPayload(normalizedPayload));
    recognition.value = recognizeTroubleshooting(normalizedPayload);
    intake.value = recognition.value.extracted;
    selectedEntry.value = recognition.value.entryId;

    if (!recognition.value.inScope) {
      phase.value = "finished";
      pushMessage(
        "assistant",
        `该问题不属于业务排障范围，建议切换到：${recognition.value.redirectAgents?.join("、")}。`,
        "info",
      );
      return;
    }

    if (recognition.value.missingFields.length) {
      phase.value = "supplement";
      pushMessage(
        "assistant",
        `已识别为“${recognition.value.entryLabel}”，但还缺少：${recognition.value.missingFields.join("、")}。请补充后继续。`,
        "warning",
      );
      return;
    }

    phase.value = "orchestration";
    pushMessage("assistant", `已识别为“${recognition.value.entryLabel}”，参数足够，进入排障流程编排。`);
    if (intake.value.entryId === "order") {
      runAutoOrderOrchestration();
    } else if (intake.value.entryId === "communication") {
      runAutoCommunicationOrchestration();
    }
    return;
  }

  if (phase.value === "supplement" && intake.value) {
    pushMessage("user", formatPayload(payload));
    intake.value = mergeSupplement(intake.value, payload);
    const missingFields = getMissingFields(intake.value);
    if (missingFields.length) {
      errorMessage.value = `仍缺少：${missingFields.join("、")}。`;
      return;
    }
    phase.value = "orchestration";
    pushMessage("assistant", "关键参数已补齐，开始编排对应排障流程。");
    if (intake.value.entryId === "order") {
      runAutoOrderOrchestration();
    } else if (intake.value.entryId === "communication") {
      runAutoCommunicationOrchestration();
    }
    return;
  }

  if (phase.value === "orchestration" && intake.value) {
    if (intake.value.entryId === "order") {
      handleOrderRouteSubmit(payload);
      return;
    }

    pushMessage("user", formatPayload(payload));
    result.value = buildTroubleshootingResult(intake.value, payload);
    phase.value = "result";
    pushMessage("assistant", result.value.conclusion, result.value.status);
  }
}

function runAutoCommunicationOrchestration() {
  if (!intake.value) return;
  const inference = inferCommunicationRoute(intake.value);

  schedule(() => {
    pushMessage("system", "正在调用智能诊断统一入口...", "info");
    pushMessage("assistant", "已获取 SIM 卡信息、生命周期 / 卡状态、停机原因和服务能力状态。");
  }, 1000);

  schedule(() => {
    pushMessage("system", `正在查询${inference.queryLabel}...`, "info");
    pushMessage("assistant", `自动识别主异常方向：${inference.statusLabel}`);
  }, 3000);

  schedule(() => {
    if (!intake.value) return;
    result.value = buildTroubleshootingResult(intake.value, inference.payload);
    phase.value = "result";
    pushMessage("assistant", result.value.conclusion, result.value.status);
  }, 5000);
}

function runAutoOrderOrchestration() {
  if (!intake.value) return;
  orderRouteStep.value = "source";
  orderRoutePayload.value = {};
  const inference = inferOrderRoute(intake.value);

  schedule(() => {
    pushMessage("system", "正在调用订单来源判断接口...", "info");
    pushMessage("assistant", `自动识别订单来源：${inference.sourceLabel}`);
    orderRoutePayload.value = { ...orderRoutePayload.value, orderSource: inference.payload.orderSource };
    orderRouteStep.value = inference.payload.orderSource === "mobile" ? "mobile-status" : "cmiot-shape";
  }, 2000);

  schedule(() => {
    if (!intake.value) return;
    if (inference.payload.orderSource === "mobile") {
      pushMessage("system", "正在查询掌厅订单提交与执行状态...", "info");
      pushMessage("assistant", "自动进入掌厅轻量化操作订单分支。");
    } else {
      pushMessage("system", "正在判断是否为批量订单...", "info");
      pushMessage("assistant", `自动识别订单形态：${inference.shapeLabel}`);
      orderRoutePayload.value = { ...orderRoutePayload.value, orderShape: inference.payload.orderShape };
      orderRouteStep.value =
        inference.payload.orderShape === "batch" ? "cmiot-batch-status" : "cmiot-single-status";
    }
  }, 4000);

  schedule(() => {
    pushMessage("system", "正在查询任务状态与执行明细...", "info");
    pushMessage("assistant", `自动识别任务状态：${inference.statusLabel}`);
    orderRoutePayload.value = { ...orderRoutePayload.value, orderStatus: inference.payload.orderStatus };
  }, 6000);

  schedule(() => {
    if (!intake.value) return;
    result.value = buildTroubleshootingResult(intake.value, inference.payload);
    phase.value = "result";
    pushMessage("assistant", result.value.conclusion, result.value.status);
  }, 8000);
}

function handleOrderRouteSubmit(payload: Record<string, string | string[]>) {
  if (!intake.value) return;

  pushMessage("user", formatPayload(payload));
  orderRoutePayload.value = { ...orderRoutePayload.value, ...payload };

  if (orderRouteStep.value === "source") {
    if (payload.orderSource === "mobile") {
      orderRouteStep.value = "mobile-status";
      pushMessage("assistant", "已识别为“掌厅轻量化操作订单异常”，请继续选择提交与执行状态。");
      return;
    }

    orderRouteStep.value = "cmiot-shape";
    pushMessage("assistant", "已识别为“CMIOT 订单执行异常”，请继续判断是否为批量订单。");
    return;
  }

  if (orderRouteStep.value === "cmiot-shape") {
    if (payload.orderShape === "batch") {
      orderRouteStep.value = "cmiot-batch-status";
      pushMessage("assistant", "已进入批量订单分支，开始查询批量主任务状态。");
      return;
    }

    orderRouteStep.value = "cmiot-single-status";
    pushMessage("assistant", "已进入单订单分支，开始查询单订单状态。");
    return;
  }

  result.value = buildTroubleshootingResult(intake.value, orderRoutePayload.value);
  phase.value = "result";
  pushMessage("assistant", result.value.conclusion, result.value.status);
}

function handleResultAction(action: TroubleshootingActionId) {
  if (!result.value || !intake.value) return;
  pushMessage("user", getActionLabel(action));

  if (action === "continue") {
    result.value = null;
    executionTrace.value = null;
    handoffSummary.value = null;
    orderRouteStep.value = "source";
    orderRoutePayload.value = {};
    phase.value = "intake";
    pushMessage("assistant", "请补充更多信息、更换排查对象，或切换新的排查方向。");
    return;
  }

  if (action === "execute") {
    executeLoading.value = true;
    executeSuccessVisible.value = false;
    const executeDelay = intake.value.entryId === "communication" ? 2000 : 3000;
    schedule(() => {
      if (!result.value || !intake.value) return;
      executionTrace.value = buildExecutionTrace(result.value, intake.value, result.value.executableActions[0]?.label);
      executeLoading.value = false;
      executeSuccessVisible.value = true;
      pushMessage("system", `已执行“${executionTrace.value.action}”，处理成功。`, "success");
    }, executeDelay);
    return;
  }

  if (action === "handoff") {
    handoffSummary.value = buildHandoffSummary(result.value, intake.value);
    pushMessage("system", "已生成转人工摘要，并附带历史对话上下文。", "info");
    return;
  }

  phase.value = "finished";
  pushMessage("system", "本次业务排障处理已结束。", "success");
}

const currentCard = computed<DecisionCard | null>(() => {
  if (phase.value === "intake") return intakeCards[selectedEntry.value];
  if (phase.value === "supplement") return supplementCard;
  if (phase.value === "orchestration" && intake.value) {
    if (intake.value.entryId === "order" || intake.value.entryId === "communication") return null;
    return orchestrationCards[intake.value.entryId];
  }
  return null;
});

const selectedEntryLabel = computed(() => troubleshootingEntryLabels[selectedEntry.value]);

onMounted(() => {
  markAgentVisited("troubleshoot");
  resetFlow();
});

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<style scoped>
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
</style>
