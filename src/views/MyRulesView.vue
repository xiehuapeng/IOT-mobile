<template>
  <div class="page">
    <section class="section-card hero">
      <div class="page-kicker">Rules</div>
      <h2>我的规则</h2>
      <p>统一查看当前账号下的规则状态、提醒记录、失败兜底信息和生命周期轨迹。</p>
      <div class="chip-grid">
        <span class="pill">启用中 {{ activeRules.length }}</span>
        <span class="pill">待生效 {{ pendingRules.length }}</span>
        <span class="pill">异常/失败 {{ errorRules.length }}</span>
        <span class="pill">已完成 {{ completedRules.length }}</span>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>启用中的规则</h3>
          <p>可查看详情、调整配置、暂停执行或直接删除。</p>
        </div>
        <RouterLink class="quick-link" to="/app/agents/rule-config">新建规则</RouterLink>
      </div>
      <div class="rule-list">
        <article v-for="rule in activeRules" :key="rule.id" class="rule-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @pause="pause"
            @remove="remove"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="pendingRules.length">
      <div class="section-heading">
        <div>
          <h3>待生效规则</h3>
          <p>规则已创建完成，等待生效时间到达后自动启用。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in pendingRules" :key="rule.id" class="rule-card compact-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="pausedRules.length">
      <div class="section-heading">
        <div>
          <h3>已暂停规则</h3>
          <p>可继续调整配置，或恢复执行。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in pausedRules" :key="rule.id" class="rule-card compact-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
          <div class="action-grid single-row">
            <button class="accent-button small-action" type="button" @click="resume(rule.id)">恢复执行</button>
            <button class="ghost-button small-action" type="button" @click="terminate(rule.id)">终止规则</button>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="errorRules.length">
      <div class="section-heading">
        <div>
          <h3>异常与失败</h3>
          <p>集中查看创建失败、执行异常、数据源异常等需要重试或重绑的规则。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in errorRules" :key="rule.id" class="rule-card compact-card error-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
          <div class="failure-box" v-if="rule.latestFailureReason">{{ rule.latestFailureReason }}</div>
          <div class="action-grid single-row">
            <button class="accent-button small-action" type="button" @click="resume(rule.id)">重新绑定</button>
            <button class="ghost-button small-action" type="button" @click="editRule(rule.id)">重新创建</button>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="completedRules.length">
      <div class="section-heading">
        <div>
          <h3>已完成规则</h3>
          <p>一次性规则或目标已完成的规则会停留在这里。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in completedRules" :key="rule.id" class="rule-card compact-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="expiredRules.length">
      <div class="section-heading">
        <div>
          <h3>已失效规则</h3>
          <p>可查看历史配置，并在需要时基于原配置重新创建。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in expiredRules" :key="rule.id" class="rule-card compact-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
        </article>
      </div>
    </section>

    <section class="section-card panel" v-if="terminatedRules.length">
      <div class="section-heading">
        <div>
          <h3>已终止规则</h3>
          <p>用户主动终止后的规则会保留历史命中与处理轨迹。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in terminatedRules" :key="rule.id" class="rule-card compact-card">
          <RuleCardMeta
            :rule="rule"
            :selected-rule-id="selectedRuleId ?? undefined"
            @toggle="toggleHistory"
            @edit="editRule"
            @open-message-center="openMessageCenter"
            @open-agent="openAgentForRule"
          />
        </article>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>最近提醒记录</h3>
          <p>展示最近触发的提醒内容、风险等级与当前处理状态。</p>
        </div>
      </div>
      <div class="alert-list">
        <article v-for="alert in recentAlerts" :key="alert.id" class="alert-card">
          <strong>{{ alert.ruleName }}</strong>
          <p>{{ alert.reason }}</p>
          <small>{{ alert.triggeredAt }} / {{ alert.currentStatus }} / {{ alert.handlingStatus }}</small>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import { alertTypeLabels, monitorConditionLabels, ruleStatusLabels } from "../mock/ruleAssistant";
import {
  activeRules,
  completedRules,
  errorRules,
  expiredRules,
  getStatusLabel,
  pauseRule,
  pausedRules,
  pendingRules,
  recentAlerts,
  removeRule as deleteRule,
  resumeRule,
  ruleCenter,
  terminatedRules,
  terminateRule,
} from "../stores/ruleCenter";
import type { ManagedRule } from "../types/agent";

const router = useRouter();
const route = useRoute();
const selectedRuleId = ref<string | null>(null);

function historyForRule(ruleId: string) {
  return ruleCenter.alerts.filter((item) => item.ruleId === ruleId);
}

function editRule(ruleId: string) {
  router.push({ path: "/app/agents/rule-config", query: { ruleId } });
}

function openMessageCenter(ruleId: string) {
  router.push({ path: "/app/message-center", query: { ruleId } });
}

function openAgentForRule(rule: ManagedRule) {
  router.push(rule.intent === "order-monitor" ? "/app/agents/troubleshoot" : "/app/agents/rule-config");
}

function toggleHistory(ruleId: string) {
  selectedRuleId.value = selectedRuleId.value === ruleId ? null : ruleId;
  router.replace({ path: "/app/my-rules", query: selectedRuleId.value ? { ruleId } : {} });
}

function pause(ruleId: string) {
  pauseRule(ruleId);
}

function resume(ruleId: string) {
  resumeRule(ruleId);
}

function terminate(ruleId: string) {
  terminateRule(ruleId);
}

function remove(ruleId: string) {
  deleteRule(ruleId);
  if (selectedRuleId.value === ruleId) {
    selectedRuleId.value = null;
    router.replace({ path: "/app/my-rules" });
  }
}

watch(
  () => route.query.ruleId,
  (ruleId) => {
    if (!ruleId || Array.isArray(ruleId)) {
      selectedRuleId.value = null;
      return;
    }
    selectedRuleId.value = ruleId;
  },
  { immediate: true },
);

const RuleCardMeta = defineComponent({
  name: "RuleCardMeta",
  props: {
    rule: {
      type: Object as () => ManagedRule,
      required: true,
    },
    selectedRuleId: {
      type: String,
      default: null,
    },
  },
  emits: ["toggle", "edit", "pause", "remove", "open-message-center", "open-agent"],
  setup(props, { emit }) {
    function conditionLabel(rule: ManagedRule) {
      if (rule.intent === "alert") {
        return alertTypeLabels[rule.primaryCondition] ?? rule.primaryCondition;
      }
      return monitorConditionLabels[rule.primaryCondition] ?? rule.primaryCondition;
    }

    return () =>
      h("div", [
        h("div", { class: "rule-head" }, [
          h("div", [
            h("strong", props.rule.name),
            h("p", `${props.rule.id} / ${props.rule.executionLabel}`),
          ]),
          h("span", { class: "pill" }, getStatusLabel(props.rule.status)),
        ]),
        h("div", { class: "rule-meta" }, [
          h("div", [h("span", "监控对象"), h("strong", props.rule.objectValue)]),
          props.rule.intent === "order-monitor"
            ? h("div", [h("span", "监控范围"), h("strong", props.rule.scopeLabel ?? "-")])
            : null,
          h("div", [h("span", "触发条件"), h("strong", conditionLabel(props.rule))]),
          h("div", [h("span", "提醒频率"), h("strong", props.rule.frequencyLabel)]),
          h("div", [h("span", "当前状态"), h("strong", ruleStatusLabels[props.rule.status])]),
        ]),
        h("div", { class: "action-grid" }, [
          h("button", { class: "ghost-button small-action", type: "button", onClick: () => emit("toggle", props.rule.id) }, "查看详情"),
          h("button", { class: "ghost-button small-action", type: "button", onClick: () => emit("edit", props.rule.id) }, "调整配置"),
          h("button", { class: "ghost-button small-action", type: "button", onClick: () => emit("pause", props.rule.id) }, "暂停规则"),
          h("button", { class: "ghost-button small-action", type: "button", onClick: () => emit("remove", props.rule.id) }, "删除规则"),
        ]),
        props.selectedRuleId === props.rule.id
          ? h("div", { class: "history-panel" }, [
              h(
                "div",
                { class: "detail-grid" },
                props.rule.summary.items.map((item) =>
                  h("div", { class: "detail-item", key: item.label }, [h("span", item.label), h("strong", item.value)]),
                ),
              ),
              h(
                "div",
                { class: "detail-grid" },
                props.rule.statusHistory.map((item) =>
                  h("div", { class: "detail-item", key: `${item.status}-${item.timestamp}` }, [
                    h("span", item.timestamp),
                    h("strong", ruleStatusLabels[item.status]),
                    h("small", item.note),
                  ]),
                ),
              ),
              ...(historyForRule(props.rule.id).length
                ? historyForRule(props.rule.id).map((item) =>
                    h("div", { class: "history-item", key: item.id }, [
                      h("strong", item.reason),
                      h("p", `${item.triggeredAt} / ${item.recommendation}`),
                    ]),
                  )
                : [h("p", { class: "empty-text" }, "当前规则暂无触发记录。")]),
              h("div", { class: "action-grid detail-actions" }, [
                h("button", { class: "ghost-button small-action", type: "button", onClick: () => emit("edit", props.rule.id) }, "继续编辑"),
                h(
                  "button",
                  { class: "ghost-button small-action", type: "button", onClick: () => emit("open-message-center", props.rule.id) },
                  "查看消息",
                ),
                h(
                  "button",
                  { class: "accent-button small-action", type: "button", onClick: () => emit("open-agent", props.rule) },
                  props.rule.intent === "order-monitor" ? "进入排障助手" : "进入规则助手",
                ),
              ]),
            ])
          : null,
      ]);
  },
});
</script>

<style scoped>
.hero,
.panel {
  padding: 20px;
}

.hero p {
  margin: 10px 0 16px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.quick-link {
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.rule-list,
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.rule-card,
.alert-card {
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(154, 196, 255, 0.14);
  background: rgba(9, 31, 61, 0.52);
}

.error-card {
  border-color: rgba(255, 151, 103, 0.28);
}

:deep(.rule-head) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

:deep(.rule-head p),
.alert-card p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

:deep(.rule-meta) {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

:deep(.rule-meta div),
.failure-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

:deep(.rule-meta span) {
  color: var(--text-muted);
  font-size: 12px;
}

:deep(.action-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.single-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

:deep(.detail-actions) {
  margin-top: 12px;
}

.small-action {
  min-height: 42px;
  padding: 10px 12px;
}

:deep(.history-panel) {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(154, 196, 255, 0.12);
}

:deep(.detail-grid) {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

:deep(.detail-item),
:deep(.history-item) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

:deep(.detail-item span) {
  color: var(--text-muted);
  font-size: 12px;
}

:deep(.detail-item small),
:deep(.history-item p),
:deep(.empty-text),
.alert-card small {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
