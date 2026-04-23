<template>
  <div class="page">
    <ConversationThread :messages="messages" />

    <FlowDecisionCard
      v-if="currentStep && currentStep.decisionCard"
      :card="currentStep.decisionCard"
      @submit="handleSubmit"
    />

    <ResultPanel v-if="result" :result="result" :action-done="actionDone" @action="handleAction" />

    <button class="ghost-button reset-button" type="button" @click="resetFlow">重新开始</button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import ConversationThread from "../../components/agent/ConversationThread.vue";
import FlowDecisionCard from "../../components/agent/FlowDecisionCard.vue";
import ResultPanel from "../../components/agent/ResultPanel.vue";
import {
  buildTroubleshootResult,
  classifyTroubleshoot,
  getTroubleshootSceneLabel,
  getTroubleshootStep,
  troubleshootFirstStep,
  type TroubleshootScenarioId,
} from "../../mock/flows";
import { markAgentVisited } from "../../stores/appState";
import type { ConversationMessage, FlowResult } from "../../types/agent";

const phase = ref<"intent" | "detail" | "result">("intent");
const scenario = ref<TroubleshootScenarioId | null>(null);
const result = ref<FlowResult | null>(null);
const actionDone = ref(false);
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
  phase.value = "intent";
  scenario.value = null;
  result.value = null;
  actionDone.value = false;
  messages.value = [];
  pushMessage("assistant", troubleshootFirstStep.assistantPrompt);
}

function formatPayload(payload: Record<string, string | string[]>) {
  return Object.entries(payload)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : String(value).trim()))
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join("、") : value}`)
    .join("；");
}

function handleSubmit(payload: Record<string, string | string[]>) {
  if (phase.value === "intent") {
    const description = String(payload.issueDescription ?? "");
    pushMessage("user", description);
    const detected = classifyTroubleshoot(description, String(payload.scenarioHint ?? ""));
    scenario.value = detected;
    phase.value = "detail";
    pushMessage("assistant", `已识别为“${getTroubleshootSceneLabel(detected)}”，请继续补充关键信息。`);
    return;
  }

  if (phase.value === "detail" && scenario.value) {
    pushMessage("user", formatPayload(payload));
    result.value = buildTroubleshootResult(scenario.value, payload);
    phase.value = "result";
    pushMessage("assistant", result.value.summary, result.value.status);
  }
}

function handleAction() {
  if (!result.value || actionDone.value) return;
  actionDone.value = true;
  pushMessage("system", `处置工单已生成，关联模板 ${result.value.reference}。`, "success");
}

const currentStep = computed(() => {
  if (phase.value === "intent") return troubleshootFirstStep;
  if (phase.value === "detail" && scenario.value) return getTroubleshootStep(scenario.value);
  return null;
});

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
