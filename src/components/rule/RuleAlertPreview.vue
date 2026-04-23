<template>
  <section class="alert-panel">
    <div class="section-heading">
      <div>
        <h3>提醒记录</h3>
        <p>可查看触发原因、时间和建议动作，并继续执行后续处理。</p>
      </div>
      <button class="ghost-inline" type="button" @click="$emit('manage')">规则中心</button>
    </div>

    <article v-for="alert in alerts" :key="alert.id" class="alert-card">
      <div class="alert-head">
        <div>
          <strong>{{ alert.ruleName }}</strong>
          <p>{{ alert.ruleTypeLabel }} / {{ alert.objectValue }}</p>
        </div>
        <span class="pill">{{ alert.currentStatus }}</span>
      </div>

      <div class="alert-body">
        <div><span>触发原因</span><strong>{{ alert.reason }}</strong></div>
        <div><span>触发时间</span><strong>{{ alert.triggeredAt }}</strong></div>
        <div><span>建议动作</span><strong>{{ alert.recommendation }}</strong></div>
        <div><span>通知方式</span><strong>{{ channelText(alert.notificationChannels) }}</strong></div>
      </div>

      <div class="action-grid">
        <button class="accent-button small-action" type="button" @click="$emit('jump', alert)">去排障</button>
        <button class="ghost-button small-action" type="button" @click="$emit('view-detail', alert.ruleId)">查看详情</button>
        <button class="ghost-button small-action" type="button" @click="$emit('edit', alert.ruleId)">调整规则</button>
        <button class="ghost-button small-action danger-action" type="button" @click="$emit('stop', alert.ruleId)">终止规则</button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { RuleAlertRecord } from "../../types/agent";

defineProps<{
  alerts: RuleAlertRecord[];
}>();

defineEmits<{
  manage: [];
  "view-detail": [ruleId: string];
  edit: [ruleId: string];
  stop: [ruleId: string];
  jump: [alert: RuleAlertRecord];
}>();

function channelText(channels: RuleAlertRecord["notificationChannels"]) {
  return channels.map((item) => (item === "message" ? "消息通知" : "通知中心")).join(" + ");
}
</script>

<style scoped>
.alert-panel {
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

.ghost-inline {
  border: 0;
  background: transparent;
  color: var(--accent);
  font-weight: 600;
}

.alert-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(153, 192, 255, 0.14);
  background: rgba(9, 31, 61, 0.52);
}

.alert-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.alert-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.alert-body {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.alert-body div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

.alert-body span {
  color: var(--text-muted);
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.small-action {
  min-height: 44px;
  padding: 10px 12px;
}

.danger-action {
  color: #ffd0c6;
  border-color: rgba(255, 120, 96, 0.28);
}
</style>
