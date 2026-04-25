<template>
  <div class="page chat-layout" :class="{ 'sidebar-hidden': !sidebarVisible }">
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

      <RouterLink class="sidebar-link" to="/app/my-rules">
        <span>我的规则</span>
        <small>查看规则、提醒和全生命周期状态</small>
      </RouterLink>
    </aside>
    <button v-else class="sidebar-rail" type="button" aria-label="显示侧边栏" @click="sidebarVisible = true">
      记录
    </button>

    <section class="section-card chat-panel">
      <div class="chat-scroll">
        <ConversationThread :messages="messages" variant="plain" compact typewriter />

        <RuleEntryPanel
          v-if="stage === 'entry'"
          :request="naturalRequest"
          :disabled="Boolean(progressState)"
          @update:request="naturalRequest = $event"
          @quick-entry="startQuickEntry"
          @submit-request="submitNaturalRequest"
          @utility-click="showBuildingToast"
        />

        <div v-else-if="isProgressStage && progressState" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>{{ progressState.title }}</strong>
          </div>
          <section class="progress-panel">
            <p>{{ progressState.detail }}</p>
            <div class="progress-track" aria-hidden="true">
              <span class="progress-fill" :style="{ width: `${progressState.percent}%` }"></span>
            </div>
            <small>已完成 {{ progressState.percent }}%</small>
          </section>
        </div>

        <div v-else-if="stage === 'object-resolve' && objectResolution" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>监控对象解析</strong>
          </div>
          <section class="object-panel">
            <p>{{ objectResolution.message }}</p>

            <div v-if="objectResolution.status === 'multiple'" class="candidate-list">
              <button
                v-for="candidate in objectResolution.candidates"
                :key="`${candidate.objectType}-${candidate.value}`"
                type="button"
                class="candidate-card"
                @click="chooseObjectCandidate(candidate)"
              >
                <span>{{ objectTypeText(candidate.objectType) }}</span>
                <strong>{{ candidate.value }}</strong>
              </button>
            </div>

            <div class="action-row">
              <button class="ghost-button action-button" type="button" @click="backToConfigFromResolve">返回修改</button>
              <button
                v-if="objectResolution.status !== 'multiple'"
                class="accent-button action-button"
                type="button"
                @click="stage = 'config'"
              >
                继续补充
              </button>
            </div>
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
            submit-label="生成摘要"
            @update:values="formValues = $event"
            @back="backToEntry"
            @submit="submitConfig"
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
            @confirm="beginValidation"
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
            @next="beginCreate"
          />
        </div>

        <div v-else-if="stage === 'created' && createdRule" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>{{ createdRule.status === 'create-failed' ? '创建结果与兜底' : '规则创建结果' }}</strong>
          </div>
          <RuleCreateResult
            :rule="createdRule"
            @manage="router.push('/app/my-rules')"
            @preview-alerts="stage = 'alerts'"
            @retry="beginCreate"
            @save-draft="saveRuleAsDraft"
          />
        </div>

        <div v-else-if="stage === 'alerts'" class="assistant-card-shell">
          <div class="assistant-card-head">
            <span class="assistant-badge">助手卡片</span>
            <strong>提醒命中与治理动作</strong>
          </div>
          <RuleAlertPreview
            :alerts="previewAlerts"
            @manage="router.push('/app/my-rules')"
            @view-detail="openExistingRule"
            @edit="editRule"
            @stop="terminateRuleById"
            @snooze="snoozeAlert"
            @resolve="resolveAlert"
            @jump="jumpFromAlert"
          />
        </div>
      </div>
    </section>
    <transition name="toast-fade">
      <div v-if="toastVisible" class="build-toast">该功能正在建设中哦</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
  objectTypeLabels,
  resolveRuleObject,
  unsupportedRoutingTips,
  validateRuleForm,
  type RuleObjectCandidate,
  type RuleObjectResolution,
} from "../../mock/ruleAssistant";
import { appState, markAgentVisited } from "../../stores/appState";
import {
  addRule,
  appendRuleStatus,
  failRule,
  getRuleById,
  markAlertStatus,
  recentAlerts,
  ruleCenter,
  terminateRule,
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

type RuleStage =
  | "entry"
  | "processing"
  | "object-resolve"
  | "unsupported"
  | "config"
  | "summary"
  | "validation-processing"
  | "validation"
  | "creation-processing"
  | "created"
  | "alerts";

interface ProgressState {
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
const progressState = ref<ProgressState | null>(null);
const objectResolution = ref<RuleObjectResolution | null>(null);
const sidebarVisible = ref(false);
const toastVisible = ref(false);
let toastTimer = 0;

const previewAlerts = computed(() =>
  createdRule.value ? ruleCenter.alerts.filter((item) => item.ruleId === createdRule.value?.id) : recentAlerts.value,
);
const configFields = computed(() => (currentIntent.value ? getRuleFields(currentIntent.value, formValues.value) : []));
const unsupportedTarget = computed(() => (unsupportedAgentId.value ? unsupportedRoutingTips[unsupportedAgentId.value] : null));
const configTitle = computed(() => (currentIntent.value === "alert" ? "预警提醒配置" : "订单执行监控配置"));
const configDescription = computed(() =>
  currentIntent.value === "alert"
    ? "我已经先替你识别了规则类型、对象和提醒方式，下面把剩余参数补齐就能进入摘要确认。"
    : "我已经先替你识别了监控对象、范围和监控条件，下面继续补齐监控参数。",
);
const sidebarMessages = computed(() => [...messages.value].reverse());
const latestMessageId = computed(() => messages.value.at(-1)?.id ?? "");
const isProgressStage = computed(() => stage.value === "processing" || stage.value === "validation-processing" || stage.value === "creation-processing");

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
  return content.length > 18 ? `${content.slice(0, 18)}...` : content;
}

function showBuildingToast() {
  toastVisible.value = true;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false;
  }, 1600);
}

async function copyHistoryMessage(content: string) {
  try {
    await navigator.clipboard.writeText(content);
  } catch {
    // no-op
  }
}

function waitFor(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runProgress(stageKey: RuleStage, title: string, detail: string, percent: number, delay = 320) {
  stage.value = stageKey;
  progressState.value = { title, detail, percent };
  await waitFor(delay);
}

function buildMissingMessage(labels: string[]) {
  return `我先帮你识别出一部分参数，并已经替你填进卡片了。\n还需要你补充：${labels.join("、")}。`;
}

function collectMissingLabels(values: RuleFormValues) {
  return configFields.value
    .filter((field) => field.required)
    .filter((field) => {
      const value = values[field.id as keyof RuleFormValues];
      return Array.isArray(value) ? value.length === 0 : !String(value ?? "").trim();
    })
    .map((field) => field.label);
}

function objectTypeText(objectType: RuleObjectCandidate["objectType"]) {
  return objectTypeLabels[objectType];
}

function normalizeResolvedValues(values: RuleFormValues, resolution: RuleObjectResolution) {
  if (!resolution.matched) return values;
  return {
    ...values,
    notifyChannels: values.notifyChannels?.length ? values.notifyChannels : ["notification-center"],
    objectType: resolution.matched.objectType,
    objectValue: resolution.matched.value,
  };
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
  progressState.value = null;
  objectResolution.value = null;
  messages.value = [];
  pushMessage(
    "assistant",
    "你好，我是规则配置类助手，可以帮你完成预警提醒配置和订单执行监控配置。你可以直接选择下面两个入口开始，也可以在输入框里描述你的规则诉求。",
  );
}

function backToEntry() {
  stage.value = "entry";
  formError.value = "";
  progressState.value = null;
  objectResolution.value = null;
  pushMessage("assistant", "好的，我们回到聊天入口。你可以重新选择场景，或者直接输入新的诉求。");
}

function backToConfigFromResolve() {
  stage.value = "config";
  objectResolution.value = null;
}

function startQuickEntry(entry: RuleEntryMode) {
  currentIntent.value = entry === "quick-alert" ? "alert" : "order-monitor";
  stage.value = "config";
  objectResolution.value = null;
  validationResult.value = null;
  ruleSummary.value = null;
  createdRule.value = null;
  formValues.value = {
    naturalRequest: "",
    notifyChannels: ["notification-center"],
    ...(entry === "quick-order" ? { monitorFrequency: "summary-daily" as const } : {}),
  };
  pushMessage("user", entry === "quick-alert" ? "我想配置预警提醒" : "我想配置订单执行监控");
  pushMessage(
    "assistant",
    entry === "quick-alert"
      ? "好的，我已替您打开预警提醒配置卡"
      : "好的，我先替你打开订单执行监控配置卡。你可以继续补充自然语言，也可以直接在卡片里填写。",
    "success",
  );
}

async function continueWithValues(values: RuleFormValues, source: "natural" | "manual") {
  if (!currentIntent.value) return;

  const resolution = resolveRuleObject(currentIntent.value, values);
  objectResolution.value = resolution;

  if (resolution.status === "multiple" || resolution.status === "not-found" || resolution.status === "forbidden") {
    stage.value = "object-resolve";
    pushMessage("assistant", resolution.message, resolution.status === "multiple" ? "info" : "warning");
    return;
  }

  const normalizedValues = normalizeResolvedValues(values, resolution);
  formValues.value = normalizedValues;

  const missingLabels = collectMissingLabels(normalizedValues);
  if (missingLabels.length > 0) {
    stage.value = "config";
    if (source === "natural") {
      pushMessage("assistant", buildMissingMessage(missingLabels), "warning");
    }
    return;
  }

  ruleSummary.value = buildRuleSummary(currentIntent.value, normalizedValues);
  validationResult.value = null;
  stage.value = "summary";
  pushMessage("assistant", "已为你生成配置草稿，请确认是否创建。", "success");
}

async function submitNaturalRequest() {
  if (!naturalRequest.value.trim()) {
    formError.value = "请输入诉求后再继续。";
    return;
  }

  formError.value = "";
  const request = naturalRequest.value.trim();
  pushMessage("user", request);

  await runProgress("processing", "正在读你的诉求", "我先把这句话拆成监控对象、触发条件和提醒方式。", 20);
  const draft = buildNaturalRuleDraft(request, ruleCenter.rules, editingRuleId.value);

  await runProgress(
    "processing",
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
    await runProgress("processing", "正在为你找更合适的助手", "这条诉求不太像规则配置，我帮你切到更匹配的处理入口。", 100, 260);
    progressState.value = null;
    stage.value = "unsupported";
    pushMessage("assistant", draft.intentMatch.reason, "warning");
    naturalRequest.value = "";
    return;
  }

  currentIntent.value = draft.intentMatch.intent;
  formValues.value = draft.values;

  await runProgress("processing", "正在整理配置草稿", "能识别出来的参数我已经先替你填进卡片里，马上给你看。", 76);
  progressState.value = null;
  await continueWithValues(draft.values, "natural");
  naturalRequest.value = "";
}

async function submitConfig(values: RuleFormValues) {
  formValues.value = values;
  formError.value = "";
  const missingLabels = collectMissingLabels(values);
  if (missingLabels.length > 0) {
    formError.value = `请先补充：${missingLabels.join("、")}。`;
    return;
  }
  await continueWithValues(values, "manual");
}

async function beginValidation() {
  if (!currentIntent.value) return;

  await runProgress("validation-processing", "正在做规则校验", "我会依次检查对象权限、参数合法性、重复规则和执行安全。", 24);
  await runProgress("validation-processing", "正在核对对象与权限", "先确认监控对象存在、可访问，并且支持当前规则。", 52);
  await runProgress("validation-processing", "正在校验规则参数", "我再检查时间阈值、提醒频率、资源开销和白名单限制。", 84);

  validationResult.value = validateRuleForm(currentIntent.value, formValues.value, ruleCenter.rules, editingRuleId.value);
  progressState.value = null;
  stage.value = "validation";
  pushMessage("assistant", validationResult.value.summary, validationResult.value.passed ? "success" : "warning");
}

function simulateCreateOutcome(rule: ManagedRule) {
  if (rule.values.objectValue === "ACC-44018") {
    rule.latestFailureReason = "任务绑定失败：当前对象暂未开放到生产执行任务，建议保存为草稿后稍后重试。";
    rule.status = "create-failed";
    rule.statusHistory.push({
      status: "create-failed",
      timestamp: "2026-04-24 11:32",
      note: rule.latestFailureReason,
    });
  }

  if (rule.values.monitorCondition === "timeout" && rule.values.monitorFrequency === "instant") {
    rule.latestFailureReason = "执行安全检查未通过：大范围对象不建议即时提醒，系统已阻断生产绑定。";
    rule.status = "create-failed";
    rule.statusHistory.push({
      status: "create-failed",
      timestamp: "2026-04-24 11:32",
      note: rule.latestFailureReason,
    });
  }

  if (rule.values.objectType === "group" && rule.values.monitorCondition === "timeout") {
    rule.latestFailureReason = "任务绑定失败：集团级超时监控需转入异步扫描任务，当前生产通道尚未开放自动绑定。";
    rule.status = "create-failed";
    rule.statusHistory.push({
      status: "create-failed",
      timestamp: "2026-04-24 11:33",
      note: rule.latestFailureReason,
    });
  }

  return rule;
}

async function beginCreate() {
  if (!currentIntent.value) return;

  await runProgress("creation-processing", "正在创建规则", "我正在写入规则中心，并准备生成规则 ID。", 28);
  await runProgress("creation-processing", "正在绑定处理策略", "我会根据规则类型选择实时触发、汇总检查或定时扫描。", 68);

  const created = simulateCreateOutcome(
    createManagedRule(currentIntent.value, formValues.value, appState.user?.name ?? "当前账号"),
  );

  if (editingRuleId.value) {
    created.id = editingRuleId.value;
    const original = getRuleById(editingRuleId.value);
    if (original) {
      created.createdAt = original.createdAt;
      created.createdBy = original.createdBy;
      created.statusHistory = [...original.statusHistory, ...created.statusHistory];
    }
    updateRule(editingRuleId.value, created);
  } else {
    addRule(created);
  }

  if (created.status === "create-failed") {
    failRule(created.id, created.latestFailureReason ?? "创建失败");
  } else if (created.status === "pending") {
    appendRuleStatus(created.id, "pending", "规则创建完成，待生效时间到达后自动启用。");
  } else {
    appendRuleStatus(created.id, "active", "规则创建完成，已进入启用中。");
  }

  progressState.value = null;
  createdRule.value = getRuleById(created.id) ?? created;
  stage.value = "created";
  pushMessage(
    "system",
    created.status === "create-failed" ? `规则 ${created.id} 创建未完成。` : `规则 ${created.id} 已创建完成。`,
    created.status === "create-failed" ? "warning" : "success",
  );
}

function saveRuleAsDraft() {
  if (!createdRule.value) return;
  appendRuleStatus(createdRule.value.id, "draft", "已按失败兜底策略保存为草稿，可稍后重试。");
  createdRule.value = getRuleById(createdRule.value.id) ?? createdRule.value;
  pushMessage("system", `规则 ${createdRule.value.id} 已保存为草稿。`, "info");
}

function chooseObjectCandidate(candidate: RuleObjectCandidate) {
  objectResolution.value = null;
  continueWithValues(
    {
      ...formValues.value,
      objectType: candidate.objectType,
      objectValue: candidate.value,
    },
    "manual",
  );
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
  objectResolution.value = null;
  progressState.value = null;
  pushMessage("assistant", `已带出规则“${target.name}”的配置，你可以继续修改。`);
  router.replace({ path: "/app/agents/rule-config", query: { ruleId } });
}

function openExistingRule(ruleId: string) {
  router.push({ path: "/app/my-rules", query: { ruleId } });
}

function terminateRuleById(ruleId: string) {
  terminateRule(ruleId);
  pushMessage("system", `规则 ${ruleId} 已终止。`, "warning");
}

function snoozeAlert(alertId: string) {
  markAlertStatus(alertId, "snoozed");
  pushMessage("assistant", "已按你的选择暂不提醒，短期内会抑制同类提醒。", "info");
}

function resolveAlert(alertId: string) {
  const alert = ruleCenter.alerts.find((item) => item.id === alertId);
  markAlertStatus(alertId, "resolved");
  if (alert) {
    pushMessage("assistant", `已将“${alert.ruleName}”标记为已处理，后续会按治理策略停止重复提醒。`, "success");
  }
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
    progressState.value = null;
    objectResolution.value = null;
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

onBeforeUnmount(() => {
  window.clearTimeout(toastTimer);
});
</script>

<style scoped>
.chat-layout {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.chat-layout.sidebar-hidden {
  grid-template-columns: 34px minmax(0, 1fr);
}

.sidebar,
.chat-panel {
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
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
  line-height: 1.4;
  font-size: 12px;
  -webkit-line-clamp: 1;
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
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
}

.chat-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  padding-right: 2px;
  -webkit-overflow-scrolling: touch;
}

.progress-panel,
.object-panel,
.unsupported-panel {
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

.progress-panel p,
.object-panel p,
.unsupported-panel p {
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

.candidate-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.candidate-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(109, 198, 255, 0.2);
  background: rgba(9, 31, 61, 0.5);
  color: var(--text-main);
  text-align: left;
}

.candidate-card span {
  color: var(--text-muted);
  font-size: 12px;
}

.assistant-card-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
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

.route-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(9, 31, 61, 0.5);
  border: 1px solid rgba(154, 196, 255, 0.12);
  margin-top: 14px;
}

.route-card p {
  margin-top: 8px;
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

.build-toast {
  position: fixed;
  left: 50%;
  bottom: 106px;
  z-index: 60;
  transform: translateX(-50%);
  padding: 11px 16px;
  border-radius: 999px;
  background: rgba(6, 18, 36, 0.92);
  color: #fff;
  font-size: 14px;
  box-shadow: 0 14px 30px rgba(0, 8, 20, 0.34);
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

@media (max-width: 380px) {
  .chat-layout {
    grid-template-columns: 94px minmax(0, 1fr);
    gap: 8px;
  }

  .chat-layout.sidebar-hidden {
    grid-template-columns: 30px minmax(0, 1fr);
  }

  .sidebar {
    padding: 8px;
  }
}
</style>
