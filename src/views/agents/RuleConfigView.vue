<template>
  <div class="page chat-layout">
    <aside class="section-card sidebar">
      <div class="sidebar-head">
        <div class="page-kicker">History</div>
        <h3>对话记录</h3>
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
          <div class="history-avatar">{{ roleLabel(message.role).slice(0, 1) }}</div>
          <div class="history-content">
            <div class="history-topline">
              <span>{{ roleLabel(message.role) }}</span>
              <small>{{ message.timestamp }}</small>
            </div>
            <strong>{{ shorten(message.content) }}</strong>
          </div>
        </button>
      </div>

      <RouterLink class="sidebar-link" to="/app/my-rules">
        <span>我的规则</span>
        <small>查看规则、提醒和历史命中</small>
      </RouterLink>
    </aside>

    <section class="section-card chat-panel">
      <div class="chat-scroll">
        <ConversationThread :messages="messages" variant="plain" compact />

        <RuleEntryPanel
          v-if="stage === 'entry'"
          :request="naturalRequest"
          :disabled="Boolean(analysisProgress)"
          @update:request="naturalRequest = $event"
          @quick-entry="startQuickEntry"
          @submit-request="submitNaturalRequest"
        />

        <div v-else-if="stage === 'processing' && analysisProgress" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>{{ analysisProgress.title }}</strong>
          </div>
          <section class="progress-panel">
            <p>{{ analysisProgress.detail }}</p>
            <div class="progress-track" aria-hidden="true">
              <span class="progress-fill" :style="{ width: `${analysisProgress.percent}%` }"></span>
            </div>
            <small>已完成 {{ analysisProgress.percent }}%</small>
          </section>
        </div>

        <div v-else-if="stage === 'unsupported'" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>诉求分流建议</strong>
          </div>
          <section class="unsupported-panel">
            <h3>当前诉求不属于规则配置范围</h3>
            <p>{{ unsupportedReason }}</p>
            <div class="route-card" v-if="unsupportedTarget">
              <strong>建议切换到：{{ unsupportedTarget.title }}</strong>
              <p>你也可以重新描述诉求，或者继续前往相关助手处理。</p>
            </div>
            <div class="action-row">
              <button class="ghost-button action-button" type="button" @click="resetFlow">重新发起</button>
              <button class="accent-button action-button" type="button" @click="jumpToUnsupportedTarget">前往处理</button>
            </div>
          </section>
        </div>

        <div v-else-if="stage === 'config' && currentIntent" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>{{ currentIntent === "alert" ? "预警提醒参数配置" : "订单执行监控配置卡" }}</strong>
          </div>
          <RuleConfigForm
            :title="configTitle"
            :description="configDescription"
            :fields="configFields"
            :values="formValues"
            :error-message="formError"
            :show-back="true"
            @update:values="formValues = $event"
            @back="backToEntry"
            @submit="submitConfig"
          />
        </div>

        <div v-else-if="stage === 'validation' && validationResult" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>规则校验结果</strong>
          </div>
          <RuleValidationPanel
            :result="validationResult"
            @back="stage = 'config'"
            @view-existing="openExistingRule"
            @next="stage = 'summary'"
          />
        </div>

        <div v-else-if="stage === 'summary' && ruleSummary" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>规则确认摘要</strong>
          </div>
          <RuleSummaryPanel
            :summary="ruleSummary"
            @back="stage = 'config'"
            @confirm="confirmCreate"
          />
        </div>

        <div v-else-if="stage === 'created' && createdRule" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>规则创建结果</strong>
          </div>
          <RuleCreateResult
            :rule="createdRule"
            @manage="router.push('/app/my-rules')"
            @preview-alerts="stage = 'alerts'"
          />
        </div>

        <div v-else-if="stage === 'alerts'" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>提醒命中与后续处理</strong>
          </div>
          <RuleAlertPreview
            :alerts="previewAlerts"
            @manage="router.push('/app/my-rules')"
            @view-detail="openExistingRule"
            @edit="editRule"
            @stop="pauseRuleById"
            @jump="jumpFromAlert"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import ConversationThread from "../../components/agent/ConversationThread.vue";
import RuleAlertPreview from "../../components/rule/RuleAlertPreview.vue";
import RuleConfigForm from "../../components/rule/RuleConfigForm.vue";
import RuleCreateResult from "../../components/rule/RuleCreateResult.vue";
import RuleEntryPanel from "../../components/rule/RuleEntryPanel.vue";
import RuleSummaryPanel from "../../components/rule/RuleSummaryPanel.vue";
import RuleValidationPanel from "../../components/rule/RuleValidationPanel.vue";
import {
  buildNaturalRuleDraft,
  buildRuleSummary,
  createManagedRule,
  getRuleFields,
  unsupportedRoutingTips,
  validateRuleForm,
} from "../../mock/ruleAssistant";
import { appState, markAgentVisited } from "../../stores/appState";
import { addRule, getRuleById, pauseRule, recentAlerts, ruleCenter, updateRule } from "../../stores/ruleCenter";
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

type RuleStage = "entry" | "processing" | "unsupported" | "config" | "validation" | "summary" | "created" | "alerts";

interface AnalysisProgressState {
  title: string;
  detail: string;
  percent: number;
}

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
const analysisProgress = ref<AnalysisProgressState | null>(null);

const previewAlerts = computed(() =>
  createdRule.value ? ruleCenter.alerts.filter((item) => item.ruleId === createdRule.value?.id) : recentAlerts.value,
);
const configFields = computed(() => (currentIntent.value ? getRuleFields(currentIntent.value, formValues.value) : []));
const unsupportedTarget = computed(() => (unsupportedAgentId.value ? unsupportedRoutingTips[unsupportedAgentId.value] : null));
const configTitle = computed(() => (currentIntent.value === "alert" ? "预警提醒配置" : "订单执行监控配置"));
const configDescription = computed(() =>
  currentIntent.value === "alert"
    ? "请补充监控对象、预警类型、提醒时间、频率、通知方式和生效周期。"
    : "请补充监控对象、监控范围、监控条件、提醒时间或阈值、通知方式和生效周期。",
);
const sidebarMessages = computed(() => [...messages.value].reverse());
const latestMessageId = computed(() => messages.value.at(-1)?.id ?? "");

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

function roleLabel(role: ConversationMessage["role"]) {
  if (role === "assistant") return "助手";
  if (role === "user") return "你";
  return "系统";
}

function shorten(content: string) {
  return content.length > 26 ? `${content.slice(0, 26)}...` : content;
}

async function copyHistoryMessage(content: string) {
  try {
    await navigator.clipboard.writeText(content);
  } catch {
    // no-op
  }
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
  analysisProgress.value = null;
  messages.value = [];
  pushMessage("assistant", "你好，我是规则配置类助手。");
  pushMessage("assistant", "我可以帮你完成预警提醒配置和订单执行监控配置。你可以点下方快捷场景，也可以直接输入诉求。");
}

function backToEntry() {
  stage.value = "entry";
  formError.value = "";
  analysisProgress.value = null;
  pushMessage("assistant", "好的，我们回到聊天入口。你可以重新选择场景，或者直接输入新的诉求。");
}

function startQuickEntry(entry: RuleEntryMode) {
  currentIntent.value = entry === "quick-alert" ? "alert" : "order-monitor";
  stage.value = "config";
  formValues.value = {
    ...formValues.value,
    naturalRequest: "",
  };
  pushMessage("user", entry === "quick-alert" ? "我想配置预警提醒" : "我想配置订单执行监控");
  pushMessage(
    "assistant",
    currentIntent.value === "alert"
      ? "好的，先进入预警提醒配置卡片，你按页面参数补充即可。"
      : "好的，先进入订单执行监控配置卡片，你按页面参数补充即可。",
    "success",
  );
}

function waitFor(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runAnalysisStep(title: string, detail: string, percent: number, delay = 320) {
  analysisProgress.value = { title, detail, percent };
  await waitFor(delay);
}

function buildMissingMessage(labels: string[]) {
  return `我先帮你识别出一部分参数，并已经替你填进卡片了。\n还需要你补充：${labels.join("、")}。`;
}

async function submitNaturalRequest() {
  if (!naturalRequest.value.trim()) {
    formError.value = "请输入诉求后再继续。";
    return;
  }

  formError.value = "";
  const request = naturalRequest.value.trim();
  pushMessage("user", request);
  stage.value = "processing";

  await runAnalysisStep("正在读你的诉求", "我先把这句话拆成监控对象、触发条件和提醒方式。", 20);
  const draft = buildNaturalRuleDraft(request, ruleCenter.rules, editingRuleId.value);

  await runAnalysisStep(
    "正在判断你想做什么",
    draft.intentMatch.intent === "alert"
      ? "我判断你更像是在配置预警提醒，我继续往下整理。"
      : draft.intentMatch.intent === "order-monitor"
        ? "我判断你是在配置订单执行监控，我继续帮你补成规则草稿。"
        : "我先帮你确认这条诉求是不是规则配置范围。",
    46,
  );

  unsupportedReason.value = draft.intentMatch.reason;
  unsupportedAgentId.value = draft.intentMatch.suggestedAgentId;

  if (draft.intentMatch.intent === "unsupported") {
    await runAnalysisStep("正在为你找更合适的助手", "这条诉求不太像规则配置，我帮你切到更匹配的处理入口。", 100, 260);
    analysisProgress.value = null;
    stage.value = "unsupported";
    pushMessage("assistant", draft.intentMatch.reason, "warning");
    naturalRequest.value = "";
    return;
  }

  currentIntent.value = draft.intentMatch.intent;
  formValues.value = draft.values;

  await runAnalysisStep("正在整理配置草稿", "能识别出来的参数我已经先替你填进卡片里，马上给你看。", 72);

  if (draft.missingLabels.length > 0) {
    await runAnalysisStep("还有几项需要你拍板", "我已经把草稿铺好了，缺的地方你补一下就能继续。", 100, 260);
    analysisProgress.value = null;
    validationResult.value = null;
    ruleSummary.value = null;
    stage.value = "config";
    pushMessage("assistant", buildMissingMessage(draft.missingLabels), "warning");
    naturalRequest.value = "";
    return;
  }

  validationResult.value = draft.validationResult;
  ruleSummary.value = draft.summary;

  if (draft.summary) {
    await runAnalysisStep("配置草稿已经准备好", "这份规则我已经替你拼好了，你确认一下就可以直接创建。", 100, 260);
    analysisProgress.value = null;
    stage.value = "summary";
    pushMessage("assistant", "已为你生成配置草稿，请确认是否创建。", "success");
    naturalRequest.value = "";
    return;
  }

  await runAnalysisStep("我发现这份草稿还需要你确认", "参数虽然齐了，但有几项校验结果我想先让你看一下。", 100, 260);
  analysisProgress.value = null;
  stage.value = "config";
  if (draft.validationResult) {
    pushMessage("assistant", draft.validationResult.summary, "warning");
  }
  naturalRequest.value = "";
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

function openExistingRule(ruleId: string) {
  router.push({ path: "/app/my-rules", query: { ruleId } });
}

function pauseRuleById(ruleId: string) {
  pauseRule(ruleId);
  pushMessage("system", `规则 ${ruleId} 已终止执行。`, "warning");
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
    analysisProgress.value = null;
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
.chat-layout {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.sidebar,
.chat-panel {
  min-height: 720px;
  min-width: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  overflow: hidden;
}

.sidebar-head h3 {
  margin: 2px 0 0;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(141, 188, 255, 0.1);
  background: rgba(7, 25, 49, 0.72);
  color: var(--text-main);
  text-align: left;
  min-width: 0;
}

.history-avatar {
  flex: 0 0 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(92, 201, 255, 0.14);
  color: #97e5ff;
  font-size: 12px;
  font-weight: 700;
}

.history-content {
  min-width: 0;
  flex: 1;
}

.history-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.history-topline span,
.history-topline small {
  color: var(--text-muted);
  font-size: 10px;
}

.history-item strong {
  display: -webkit-box;
  margin-top: 5px;
  line-height: 1.4;
  font-size: 12px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  min-width: 0;
}

.sidebar-link span {
  font-size: 14px;
  font-weight: 700;
  word-break: break-word;
}

.sidebar-link small {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 12px;
}

.chat-panel {
  padding: 12px;
  overflow: hidden;
}

.chat-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.progress-panel {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(154, 196, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(17, 46, 91, 0.86), rgba(7, 24, 46, 0.92)),
    rgba(8, 27, 56, 0.78);
  box-shadow:
    0 18px 40px rgba(2, 10, 24, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.progress-panel p {
  margin: 0;
  line-height: 1.7;
  color: var(--text-secondary);
}

.progress-track {
  height: 10px;
  margin-top: 16px;
  border-radius: 999px;
  background: rgba(8, 24, 46, 0.8);
  overflow: hidden;
}

.progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(84, 189, 255, 0.92), rgba(106, 225, 255, 0.92));
  box-shadow: 0 0 18px rgba(92, 201, 255, 0.28);
  transition: width 0.24s ease;
}

.progress-panel small {
  display: inline-block;
  margin-top: 10px;
  color: var(--text-muted);
}

.assistant-card-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assistant-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 6px;
}

.assistant-card-head strong {
  font-size: 14px;
}

.assistant-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(92, 201, 255, 0.12);
  color: #94e2ff;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.unsupported-panel {
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(154, 196, 255, 0.14);
  background: rgba(9, 31, 61, 0.42);
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

@media (max-width: 900px) {
  .chat-layout {
    grid-template-columns: 1fr;
  }

  .sidebar,
  .chat-panel {
    min-height: auto;
  }
}
</style>
