<template>
  <div class="page">
    <section class="section-card hero">
      <div class="page-kicker">Rules</div>
      <h2>我的规则</h2>
      <p>统一查看当前账号下的生效规则、暂停规则、失效规则以及最近触发记录。</p>
      <div class="chip-grid">
        <span class="pill">生效中 {{ activeRules.length }}</span>
        <span class="pill">已暂停 {{ pausedRules.length }}</span>
        <span class="pill">已失效 {{ expiredRules.length }}</span>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>生效中的规则</h3>
          <p>可查看详情、调整配置、暂停执行或直接删除。</p>
        </div>
        <RouterLink class="quick-link" to="/app/agents/rule-config">新建规则</RouterLink>
      </div>
      <div class="rule-list">
        <article v-for="rule in activeRules" :key="rule.id" class="rule-card">
          <div class="rule-head">
            <div>
              <strong>{{ rule.name }}</strong>
              <p>{{ rule.id }} / {{ rule.executionLabel }}</p>
            </div>
            <span class="pill">生效中</span>
          </div>
          <div class="rule-meta">
            <div><span>监控对象</span><strong>{{ rule.objectValue }}</strong></div>
            <div><span>触发条件</span><strong>{{ conditionLabel(rule) }}</strong></div>
            <div><span>提醒频率</span><strong>{{ rule.frequencyLabel }}</strong></div>
            <div><span>生效周期</span><strong>{{ rule.effectiveLabel }}</strong></div>
          </div>
          <div class="action-grid">
            <button class="ghost-button small-action" type="button" @click="toggleHistory(rule.id)">查看详情</button>
            <button class="ghost-button small-action" type="button" @click="editRule(rule.id)">调整配置</button>
            <button class="ghost-button small-action" type="button" @click="pauseRule(rule.id)">暂停执行</button>
            <button class="ghost-button small-action" type="button" @click="removeRule(rule.id)">删除规则</button>
            <button class="ghost-button small-action" type="button" @click="toggleHistory(rule.id)">查看触发记录</button>
          </div>
          <div v-if="selectedRuleId === rule.id" class="history-panel">
            <div v-for="item in historyForRule(rule.id)" :key="item.id" class="history-item">
              <strong>{{ item.reason }}</strong>
              <p>{{ item.triggeredAt }} / {{ item.recommendation }}</p>
            </div>
            <p v-if="!historyForRule(rule.id).length" class="empty-text">当前规则暂无触发记录。</p>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>已暂停规则</h3>
          <p>可继续调整配置，或恢复执行。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in pausedRules" :key="rule.id" class="rule-card compact-card">
          <div class="rule-head">
            <div>
              <strong>{{ rule.name }}</strong>
              <p>{{ rule.id }}</p>
            </div>
            <span class="pill">已暂停</span>
          </div>
          <div class="action-grid single-row">
            <button class="ghost-button small-action" type="button" @click="editRule(rule.id)">调整配置</button>
            <button class="accent-button small-action" type="button" @click="resumeRule(rule.id)">恢复执行</button>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>已失效规则</h3>
          <p>可查看历史配置，并在需要时基于原配置重新创建。</p>
        </div>
      </div>
      <div class="rule-list compact-list">
        <article v-for="rule in expiredRules" :key="rule.id" class="rule-card compact-card">
          <div class="rule-head">
            <div>
              <strong>{{ rule.name }}</strong>
              <p>{{ rule.id }} / {{ rule.effectiveLabel }}</p>
            </div>
            <span class="pill">已失效</span>
          </div>
          <div class="action-grid single-row">
            <button class="ghost-button small-action" type="button" @click="editRule(rule.id)">基于原配置创建</button>
          </div>
        </article>
      </div>
    </section>

    <section class="section-card panel">
      <div class="section-heading">
        <div>
          <h3>最近提醒记录</h3>
          <p>展示最近触发的提醒内容与当前状态。</p>
        </div>
      </div>
      <div class="alert-list">
        <article v-for="alert in recentAlerts" :key="alert.id" class="alert-card">
          <strong>{{ alert.ruleName }}</strong>
          <p>{{ alert.reason }}</p>
          <small>{{ alert.triggeredAt }} / {{ alert.currentStatus }}</small>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { alertTypeLabels, monitorConditionLabels } from "../mock/ruleAssistant";
import {
  activeRules,
  expiredRules,
  pausedRules,
  recentAlerts,
  removeRule as deleteRule,
  pauseRule as stopRule,
  resumeRule as enableRule,
  ruleCenter,
} from "../stores/ruleCenter";

const router = useRouter();
const selectedRuleId = ref<string | null>(null);

function editRule(ruleId: string) {
  router.push({ path: "/app/agents/rule-config", query: { ruleId } });
}

function toggleHistory(ruleId: string) {
  selectedRuleId.value = selectedRuleId.value === ruleId ? null : ruleId;
}

function historyForRule(ruleId: string) {
  return ruleCenter.alerts.filter((item) => item.ruleId === ruleId);
}

function conditionLabel(rule: { intent: "alert" | "order-monitor"; primaryCondition: string }) {
  if (rule.intent === "alert") {
    return alertTypeLabels[rule.primaryCondition] ?? rule.primaryCondition;
  }
  return monitorConditionLabels[rule.primaryCondition] ?? rule.primaryCondition;
}

function pauseRule(ruleId: string) {
  stopRule(ruleId);
}

function resumeRule(ruleId: string) {
  enableRule(ruleId);
}

function removeRule(ruleId: string) {
  deleteRule(ruleId);
  if (selectedRuleId.value === ruleId) selectedRuleId.value = null;
}
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

.rule-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.rule-head p,
.alert-card p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.rule-meta {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.rule-meta div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

.rule-meta span {
  color: var(--text-muted);
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.single-row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.small-action {
  min-height: 42px;
  padding: 10px 12px;
}

.history-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(154, 196, 255, 0.12);
}

.history-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

.history-item + .history-item {
  margin-top: 10px;
}

.history-item p,
.empty-text,
.alert-card small {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
