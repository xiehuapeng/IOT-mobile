<template>
  <div class="page">
    <ConversationThread :messages="messages" />

    <RuleEntryPanel
      v-if="stage === 'entry'"
      :request="naturalRequest"
      @update:request="naturalRequest = $event"
      @quick-entry="startQuickEntry"
      @submit-request="submitNaturalRequest"
    />

    <section v-else-if="stage === 'unsupported'" class="section-card unsupported-panel">
      <h3>当前诉求不属于规则配置范围</h3>
      <p>{{ unsupportedReason }}</p>
      <div class="route-card" v-if="unsupportedTarget">
        <strong>建议切换到：{{ unsupportedTarget.title }}</strong>
        <p>你也可以返回后重新描述诉求，或直接进入相关助手继续处理。</p>
      </div>
      <div class="action-row">
        <button class="ghost-button action-button" type="button" @click="resetFlow">重新发起</button>
        <button class="accent-button action-button" type="button" @click="jumpToUnsupportedTarget">前往处理</button>
      </div>
    </section>

    <RuleConfigForm
      v-else-if="stage === 'config' && currentIntent"
      :title="configTitle"
      :description="configDescription"
      :fields="configFields"
      :values="formValues"
      :error-message="formError"
      :show-back="true"
      @back="backToEntry"
      @submit="submitConfig"
    />

    <RuleValidationPanel
      v-else-if="stage === 'validation' && validationResult"
      :result="validationResult"
      @back="stage = 'config'"
      @next="stage = 'summary'"
    />

    <RuleSummaryPanel
      v-else-if="stage === 'summary' && ruleSummary"
      :summary="ruleSummary"
      @back="stage = 'config'"
      @confirm="confirmCreate"
    />

    <RuleCreateResult
      v-else-if="stage === 'created' && createdRule"
      :rule="createdRule"
      @manage="router.push('/app/my-rules')"
      @preview-alerts="stage = 'alerts'"
    />

    <RuleAlertPreview
      v-else-if="stage === 'alerts'"
      :alerts="previewAlerts"
      @manage="router.push('/app/my-rules')"
      @view-detail="router.push('/app/my-rules')"
      @track="trackAlert"
      @edit="editRule"
      @stop="pauseRuleById"
      @resume="resumeRuleById"
      @jump="jumpFromAlert"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import ConversationThread from "../../components/agent/ConversationThread.vue";
import RuleAlertPreview from "../../components/rule/RuleAlertPreview.vue";
import RuleConfigForm from "../../components/rule/RuleConfigForm.vue";
import RuleCreateResult from "../../components/rule/RuleCreateResult.vue";
import RuleEntryPanel from "../../components/rule/RuleEntryPanel.vue";
import RuleSummaryPanel from "../../components/rule/RuleSummaryPanel.vue";
import RuleValidationPanel from "../../components/rule/RuleValidationPanel.vue";
import {
  buildRuleSummary,
  createManagedRule,
  detectRuleIntent,
  getRuleFields,
  unsupportedRoutingTips,
  validateRuleForm,
} from "../../mock/ruleAssistant";
import { appState, markAgentVisited } from "../../stores/appState";
import {
  addRule,
  getRuleById,
  markAlertStatus,
  pauseRule,
  recentAlerts,
  resumeRule,
  ruleCenter,
  updateRule,
} from "../../stores/ruleCenter";
import type {
  ConversationMessage,
  ManagedRule,
  RuleAlertRecord,
  RuleEntryMode,
  RuleFormValues,
  RuleIntent,
  RuleSummary,
  RuleValidationResult,
} from "../../types/agent";

type RuleStage = "entry" | "unsupported" | "config" | "validation" | "summary" | "created" | "alerts";

const route = useRoute();
const router = useRouter();

const stage = ref<RuleStage>("entry");
const currentIntent = ref<Exclude<RuleIntent, "unsupported"> | null>(null);
const formValues = ref<RuleFormValues>({});
const naturalRequest = ref("");
const unsupportedReason = ref("");
const unsupportedAgentId = ref<RuleAlertRecord["suggestedAgentId"]>();
const validationResult = ref<RuleValidationResult | null>(null);
const ruleSummary = ref<RuleSummary | null>(null);
const createdRule = ref<ManagedRule | null>(null);
const formError = ref("");
const messages = ref<ConversationMessage[]>([]);
const editingRuleId = ref<string | null>(null);

const previewAlerts = computed(() =>
  createdRule.value ? ruleCenter.alerts.filter((item) => item.ruleId === createdRule.value?.id) : recentAlerts.value,
);
const configFields = computed(() => (currentIntent.value ? getRuleFields(currentIntent.value, formValues.value) : []));
const unsupportedTarget = computed(() => (unsupportedAgentId.value ? unsupportedRoutingTips[unsupportedAgentId.value] : null));
const configTitle = computed(() => (currentIntent.value === "alert" ? "预警提醒配置" : "订单执行监控配置"));
const configDescription = computed(() =>
  currentIntent.value === "alert"
    ? "请补充监控对象、预警类型、提醒时间、频率、通知方式和生效周期。"
    : "请补充监控对象、监控条件、提醒阈值、通知方式和生效周期。",
);

function cloneRuleFormValues(source: RuleFormValues): RuleFormValues {
  const next: RuleFormValues = {};
  Object.entries(source).forEach(([key, value]) => {
    next[key as keyof RuleFormValues] = (Array.isArray(value) ? [...value] : value) as never;
  });
  return next;
}

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
  stage.value = "entry";
  currentIntent.value = null;
  formValues.value = {};
  naturalRequest.value = "";
  unsupportedReason.value = "";
  unsupportedAgentId.value = undefined;
  validationResult.value = null;
  ruleSummary.value = null;
  createdRule.value = null;
  formError.value = "";
  editingRuleId.value = null;
  messages.value = [];
  pushMessage("assistant", "你好，我可以帮你配置预警提醒规则或订单执行监控规则。你可以直接描述诉求，也可以选择常用场景开始。");
}

function backToEntry() {
  stage.value = "entry";
  formError.value = "";
  pushMessage("assistant", "好的，我们回到入口，你可以重新选择场景或重新描述诉求。");
}

function startQuickEntry(entry: RuleEntryMode) {
  currentIntent.value = entry === "quick-alert" ? "alert" : "order-monitor";
  stage.value = "config";
  formValues.value = {
    ...formValues.value,
    naturalRequest: "",
  };
  pushMessage(
    "assistant",
    currentIntent.value === "alert"
      ? "已切换到预警提醒配置，请补充相关参数。"
      : "已切换到订单执行监控配置，请补充相关参数。",
  );
}

function submitNaturalRequest() {
  if (!naturalRequest.value.trim()) {
    formError.value = "请输入诉求后再继续。";
    return;
  }
  formError.value = "";
  pushMessage("user", naturalRequest.value.trim());
  const result = detectRuleIntent(naturalRequest.value);
  unsupportedReason.value = result.reason;
  unsupportedAgentId.value = result.suggestedAgentId;

  if (result.intent === "unsupported") {
    stage.value = "unsupported";
    pushMessage("assistant", result.reason, "warning");
    return;
  }

  currentIntent.value = result.intent;
  stage.value = "config";
  formValues.value = {
    naturalRequest: naturalRequest.value,
    ruleName: naturalRequest.value.slice(0, 18),
  };
  pushMessage("assistant", "已识别你的诉求，现在请继续补充配置参数。", "success");
}

function submitConfig(values: RuleFormValues) {
  formValues.value = values;
  formError.value = "";

  const missing = configFields.value.find((field) => {
    if (!field.required) return false;
    const value = values[field.id as keyof RuleFormValues];
    return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
  });
  if (missing) {
    formError.value = `请补充“${missing.label}”后再继续。`;
    return;
  }

  if (!currentIntent.value) return;

  validationResult.value = validateRuleForm(currentIntent.value, values, ruleCenter.rules, editingRuleId.value);
  ruleSummary.value = buildRuleSummary(currentIntent.value, values);
  stage.value = "validation";
  pushMessage("user", `已完成配置：${values.ruleName ?? "未命名规则"}`);
  pushMessage("assistant", validationResult.value.summary, validationResult.value.passed ? "success" : "warning");
}

function confirmCreate() {
  if (!currentIntent.value) return;

  const created = createManagedRule(currentIntent.value, formValues.value, appState.user?.name ?? "当前账号");

  if (editingRuleId.value) {
    created.id = editingRuleId.value;
    const original = getRuleById(editingRuleId.value);
    if (original) {
      created.createdAt = original.createdAt;
      created.createdBy = original.createdBy;
      created.status = "active";
    }
    updateRule(editingRuleId.value, created);
    pushMessage("system", `规则 ${created.id} 已更新。`, "success");
  } else {
    addRule(created);
    pushMessage("system", `规则 ${created.id} 已创建。`, "success");
  }

  createdRule.value = getRuleById(created.id) ?? created;
  stage.value = "created";
}

function editRule(ruleId: string) {
  const target = getRuleById(ruleId);
  if (!target) return;
  editingRuleId.value = target.id;
  currentIntent.value = target.intent;
  formValues.value = cloneRuleFormValues(target.values);
  stage.value = "config";
  formError.value = "";
  validationResult.value = null;
  ruleSummary.value = null;
  createdRule.value = null;
  pushMessage("assistant", `已带出规则“${target.name}”的配置，你可以继续修改。`);
  router.replace({ path: "/app/agents/rule-config", query: { ruleId } });
}

function pauseRuleById(ruleId: string) {
  pauseRule(ruleId);
  pushMessage("system", `规则 ${ruleId} 已暂停。`, "warning");
}

function resumeRuleById(ruleId: string) {
  resumeRule(ruleId);
  pushMessage("system", `规则 ${ruleId} 已重新启用。`, "success");
}

function trackAlert(alertId: string) {
  markAlertStatus(alertId, "tracking");
  pushMessage("system", `提醒 ${alertId} 已标记为继续跟踪。`, "success");
}

function jumpToUnsupportedTarget() {
  if (unsupportedTarget.value) {
    router.push(unsupportedTarget.value.route);
  }
}

function jumpFromAlert(alert: RuleAlertRecord) {
  if (alert.suggestedRoute) {
    router.push(alert.suggestedRoute);
  }
}

watch(
  () => route.query.ruleId,
  (ruleId) => {
    if (!ruleId || Array.isArray(ruleId)) return;
    const target = getRuleById(ruleId);
    if (!target) return;
    editingRuleId.value = target.id;
    currentIntent.value = target.intent;
    formValues.value = cloneRuleFormValues(target.values);
    stage.value = "config";
    messages.value = [];
    pushMessage("assistant", `已进入规则编辑，你可以直接调整“${target.name}”的配置。`);
  },
  { immediate: true },
);

onMounted(() => {
  markAgentVisited("rule-config");
  if (!route.query.ruleId) {
    resetFlow();
  }
});
</script>

<style scoped>
.unsupported-panel {
  padding: 20px;
}

.unsupported-panel p {
  margin: 10px 0 16px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.route-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(9, 31, 61, 0.5);
  border: 1px solid rgba(154, 196, 255, 0.12);
}

.route-card p {
  margin: 8px 0 0;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.action-button {
  flex: 1;
  padding: 14px 16px;
}
</style>
