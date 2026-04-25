<template>
  <div class="page message-page">
    <section class="summary-card section-card">
      <div>
        <div class="page-kicker">Message Center</div>
        <h2>消息中心</h2>
        <p>接收规则配置助手生成的提醒通知，并可继续处理或跳转对应助手。</p>
      </div>
      <div class="summary-metrics">
        <div class="metric-chip">
          <strong>{{ alerts.length }}</strong>
          <span>全部消息</span>
        </div>
        <div class="metric-chip active">
          <strong>{{ unreadAlertCount }}</strong>
          <span>待处理</span>
        </div>
      </div>
    </section>

    <section class="list-card section-card">
      <article v-for="alert in alerts" :key="alert.id" class="message-card">
        <div class="message-head">
          <div>
            <strong>{{ alert.ruleName }}</strong>
            <small>{{ alert.triggeredAt }} / {{ alert.currentStatus }}</small>
          </div>
          <span class="status-pill" :class="alert.followUpStatus">{{ statusText(alert.followUpStatus) }}</span>
        </div>
        <p>{{ alert.reason }}</p>
        <div class="message-foot">
          <span class="risk-tag" :class="alert.riskLevel">{{ riskText(alert.riskLevel) }}</span>
          <span class="target-text">{{ alert.ruleTypeLabel }}</span>
        </div>
        <div class="action-row">
          <button class="ghost-button action-button" type="button" @click="markTracking(alert.id)">标记跟进</button>
          <button class="ghost-button action-button" type="button" @click="markResolved(alert.id)">已处理</button>
          <button class="accent-button action-button" type="button" @click="openAlert(alert)">查看</button>
        </div>
      </article>

      <div v-if="!alerts.length" class="empty-state">
        <strong>暂无消息</strong>
        <p>规则提醒和处理动态会显示在这里。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { markAlertStatus, ruleCenter, unreadAlertCount } from "../stores/ruleCenter";
import type { RuleAlertRecord } from "../types/agent";

const router = useRouter();
const alerts = computed(() => ruleCenter.alerts);

function statusText(status: RuleAlertRecord["followUpStatus"]) {
  if (status === "resolved") return "已处理";
  if (status === "tracking") return "跟进中";
  if (status === "snoozed") return "稍后处理";
  if (status === "ignored") return "已忽略";
  return "待处理";
}

function riskText(level: RuleAlertRecord["riskLevel"]) {
  if (level === "high") return "高风险";
  if (level === "medium") return "中风险";
  return "低风险";
}

function markTracking(alertId: string) {
  markAlertStatus(alertId, "tracking");
}

function markResolved(alertId: string) {
  markAlertStatus(alertId, "resolved");
}

function openAlert(alert: RuleAlertRecord) {
  markAlertStatus(alert.id, "tracking");
  router.push(alert.suggestedRoute ?? "/app/my-rules");
}
</script>

<style scoped>
.message-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-card,
.list-card {
  padding: 16px;
}

.summary-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.summary-card h2 {
  margin: 4px 0 0;
  font-size: 22px;
}

.summary-card p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.summary-metrics {
  display: grid;
  gap: 10px;
  min-width: 96px;
}

.metric-chip {
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(153, 192, 255, 0.16);
  background: rgba(10, 31, 59, 0.54);
  text-align: center;
}

.metric-chip strong {
  display: block;
  font-size: 22px;
}

.metric-chip span {
  display: block;
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 12px;
}

.metric-chip.active {
  border-color: rgba(101, 194, 255, 0.3);
  background: rgba(18, 56, 110, 0.66);
}

.list-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-card {
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(151, 194, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(17, 46, 91, 0.72), rgba(8, 27, 56, 0.88)),
    rgba(8, 27, 56, 0.78);
}

.message-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.message-head strong {
  display: block;
  font-size: 16px;
}

.message-head small {
  display: block;
  margin-top: 6px;
  color: var(--text-muted);
}

.message-card p {
  margin: 12px 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.message-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-pill,
.risk-tag,
.target-text {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
}

.status-pill {
  background: rgba(64, 130, 224, 0.18);
  color: #bce6ff;
}

.status-pill.new {
  background: rgba(61, 145, 255, 0.22);
  color: #d9f1ff;
}

.status-pill.tracking {
  background: rgba(79, 172, 255, 0.16);
}

.status-pill.resolved {
  background: rgba(70, 184, 140, 0.18);
  color: #c8ffe9;
}

.risk-tag {
  border: 1px solid rgba(140, 188, 255, 0.14);
  color: var(--text-main);
}

.risk-tag.high {
  border-color: rgba(255, 130, 130, 0.26);
  color: #ffd0d0;
}

.risk-tag.medium {
  border-color: rgba(255, 196, 113, 0.26);
  color: #ffe0a8;
}

.risk-tag.low {
  border-color: rgba(130, 228, 178, 0.24);
  color: #cffff0;
}

.target-text {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.action-button {
  flex: 1;
  min-height: 42px;
}

.empty-state {
  padding: 24px 16px;
  border-radius: 20px;
  text-align: center;
  background: rgba(10, 31, 59, 0.4);
}

.empty-state p {
  margin: 8px 0 0;
  color: var(--text-secondary);
}
</style>
