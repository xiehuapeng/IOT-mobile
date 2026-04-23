<template>
  <div class="page">
    <ConversationThread :messages="messages" />

    <FlowDecisionCard
      v-if="currentStep && currentStep.decisionCard"
      :card="currentStep.decisionCard"
      :error-message="errorMessage"
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
  buildServiceResult,
  getServiceSceneLabel,
  getServiceStep,
  serviceIntentStep,
  serviceMaterialsStep,
  type ServiceSceneId,
} from "../../mock/flows";
import { markAgentVisited } from "../../stores/appState";
import type { ConversationMessage, FlowResult } from "../../types/agent";

const phase = ref<"intent" | "params" | "materials" | "result">("intent");
const serviceType = ref<ServiceSceneId | null>(null);
const parameterPayload = ref<Record<string, string | string[]>>({});
const result = ref<FlowResult | null>(null);
const actionDone = ref(false);
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
  phase.value = "intent";
  serviceType.value = null;
  parameterPayload.value = {};
  result.value = null;
  actionDone.value = false;
  errorMessage.value = "";
  messages.value = [];
  pushMessage("assistant", serviceIntentStep.assistantPrompt);
}

function formatPayload(payload: Record<string, string | string[]>) {
  return Object.values(payload)
    .flat()
    .join(" / ");
}

function handleSubmit(payload: Record<string, string | string[]>) {
  errorMessage.value = "";

  if (phase.value === "intent") {
    serviceType.value = String(payload.serviceType) as ServiceSceneId;
    pushMessage("user", String(payload.requestSummary));
    phase.value = "params";
    pushMessage("assistant", `已识别为“${getServiceSceneLabel(serviceType.value)}”，请继续补充办理参数。`);
    return;
  }

  if (phase.value === "params" && serviceType.value) {
    parameterPayload.value = payload;
    pushMessage("user", formatPayload(payload));
    phase.value = "materials";
    pushMessage("assistant", serviceMaterialsStep.assistantPrompt);
    return;
  }

  if (phase.value === "materials" && serviceType.value) {
    const confirmed = Array.isArray(payload.materials) ? payload.materials : [];
    if (confirmed.length < 2) {
      errorMessage.value = "请至少确认两项关键内容后再继续。";
      return;
    }
    pushMessage("user", confirmed.join(" / "));
    result.value = buildServiceResult(serviceType.value, {
      ...parameterPayload.value,
      ...payload,
    });
    phase.value = "result";
    pushMessage("assistant", result.value.summary, "success");
  }
}

function handleAction() {
  if (!result.value || actionDone.value) return;
  actionDone.value = true;
  pushMessage("system", `办理指令已提交，单号 ${result.value.reference}。`, "success");
}

const currentStep = computed(() => {
  if (phase.value === "intent") return serviceIntentStep;
  if (phase.value === "params" && serviceType.value) return getServiceStep(serviceType.value);
  if (phase.value === "materials") return serviceMaterialsStep;
  return null;
});

onMounted(() => {
  markAgentVisited("service");
  resetFlow();
});
</script>

<style scoped>
.reset-button {
  width: 100%;
  padding: 14px 16px;
}
</style>
