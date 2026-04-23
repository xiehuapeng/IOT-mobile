<template>
  <div class="page">
    <section class="summary section-card">
      <div class="page-kicker">Featured Flow</div>
      <h2>业务排障助手</h2>
      <p>面向客户经理的业务排障闭环，支持问题受理、参数识别、流程编排、结果输出和后续处理。</p>
      <div class="chip-grid">
        <button
          v-for="entry in troubleshootingEntryCards"
          :key="entry.id"
          class="ghost-button"
          type="button"
          @click="selectEntry(entry.id)"
        >
          {{ entry.title }}
        </button>
        <span class="pill">当前：{{ selectedEntryLabel }}</span>
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

    <button class="ghost-button reset-button" type="button" @click="resetFlow">重新开始业务排障</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

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
  intakeCard,
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

const phase = ref<TroubleshootingPhase>("intake");
const selectedEntry = ref<TroubleshootingEntryId>("communication");
const recognition = ref<TroubleshootingRecognition | null>(null);
const intake = ref<TroubleshootingIntake | null>(null);
const result = ref<TroubleshootingResult | null>(null);
const executionTrace = ref<TroubleshootingExecutionTrace | null>(null);
const handoffSummary = ref<TroubleshootingHandoffSummary | null>(null);
const errorMessage = ref("");
const messages = ref<ConversationMessage[]>([]);

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

function resetFlow() {
  phase.value = "intake";
  recognition.value = null;
  intake.value = null;
  result.value = null;
  executionTrace.value = null;
  handoffSummary.value = null;
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
    return;
  }

  if (phase.value === "orchestration" && intake.value) {
    pushMessage("user", formatPayload(payload));
    result.value = buildTroubleshootingResult(intake.value, payload);
    phase.value = "result";
    pushMessage("assistant", result.value.conclusion, result.value.status);
  }
}

function handleResultAction(action: TroubleshootingActionId) {
  if (!result.value || !intake.value) return;
  pushMessage("user", getActionLabel(action));

  if (action === "continue") {
    result.value = null;
    executionTrace.value = null;
    handoffSummary.value = null;
    phase.value = "intake";
    pushMessage("assistant", "请补充更多信息、更换排查对象，或切换新的排查方向。");
    return;
  }

  if (action === "execute") {
    if (!result.value.executableActions.length) {
      pushMessage("assistant", "当前仅支持查看结果或转人工，暂无可执行轻量动作。", "warning");
      return;
    }
    executionTrace.value = buildExecutionTrace(result.value, intake.value, result.value.executableActions[0]?.label);
    pushMessage("system", `已执行“${executionTrace.value.action}”，并记录留痕信息。`, "success");
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
  if (phase.value === "intake") return intakeCard;
  if (phase.value === "supplement") return supplementCard;
  if (phase.value === "orchestration" && intake.value) return orchestrationCards[intake.value.entryId];
  return null;
});

const selectedEntryLabel = computed(() => troubleshootingEntryLabels[selectedEntry.value]);

onMounted(() => {
  markAgentVisited("troubleshoot");
  resetFlow();
});
</script>

<style scoped>
.reset-button {
  width: 100%;
  padding: 14px 16px;
}
</style>
