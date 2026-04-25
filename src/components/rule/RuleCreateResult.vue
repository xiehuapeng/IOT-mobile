<template>
  <section class="result-panel">
    <div class="section-heading">
      <div>
        <h3>{{ panelTitle }}</h3>
        <p>{{ panelDesc }}</p>
      </div>
      <span class="pill">{{ statusLabel }}</span>
    </div>

    <div class="summary-grid">
      <div class="summary-item"><span>规则ID</span><strong>{{ rule.id }}</strong></div>
      <div class="summary-item"><span>创建人</span><strong>{{ rule.createdBy }}</strong></div>
      <div class="summary-item"><span>创建时间</span><strong>{{ rule.createdAt }}</strong></div>
      <div class="summary-item"><span>规则类型</span><strong>{{ rule.intent === "alert" ? "预警提醒类" : "订单执行监控类" }}</strong></div>
      <div class="summary-item"><span>监控对象</span><strong>{{ rule.objectValue }}</strong></div>
      <div v-if="rule.intent === 'order-monitor'" class="summary-item"><span>监控范围</span><strong>{{ rule.scopeLabel }}</strong></div>
      <div class="summary-item"><span>执行方式</span><strong>{{ rule.executionLabel }}</strong></div>
      <div class="summary-item"><span>处理策略</span><strong>{{ rule.bindingLabel ?? rule.executionLabel }}</strong></div>
    </div>

    <div v-if="rule.latestFailureReason" class="failure-box">
      <strong>失败兜底</strong>
      <p>{{ rule.latestFailureReason }}</p>
      <p>已保留当前配置，可重新提交、保存为草稿，或回到配置卡片继续调整。</p>
    </div>

    <div class="history-box">
      <strong>生命周期</strong>
      <div class="history-list">
        <div v-for="item in rule.statusHistory" :key="`${item.status}-${item.timestamp}`" class="history-item">
          <span>{{ item.timestamp }}</span>
          <strong>{{ statusText(item.status) }}</strong>
          <p>{{ item.note }}</p>
        </div>
      </div>
    </div>

    <div class="action-row">
      <button class="ghost-button action-button" type="button" @click="$emit('manage')">前往规则中心</button>
      <button v-if="rule.status === 'create-failed'" class="ghost-button action-button" type="button" @click="$emit('save-draft')">
        保存为草稿
      </button>
      <button v-if="rule.status === 'create-failed'" class="accent-button action-button" type="button" @click="$emit('retry')">
        重新提交
      </button>
      <button
        v-else
        class="accent-button action-button"
        type="button"
        @click="$emit('preview-alerts')"
      >
        查看提醒记录
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ruleStatusLabels } from "../../mock/ruleAssistant";
import type { ManagedRule } from "../../types/agent";

const props = defineProps<{
  rule: ManagedRule;
}>();

defineEmits<{
  manage: [];
  "preview-alerts": [];
  retry: [];
  "save-draft": [];
}>();

const statusLabel = computed(() => ruleStatusLabels[props.rule.status]);
const panelTitle = computed(() => (props.rule.status === "create-failed" ? "规则创建未完成" : "规则创建成功"));
const panelDesc = computed(() =>
  props.rule.status === "create-failed"
    ? "当前规则在绑定执行链路时遇到异常，已保留配置，方便你继续处理。"
    : "当前规则已保存，可继续查看生命周期、管理信息和提醒记录。",
);

function statusText(status: ManagedRule["status"]) {
  return ruleStatusLabels[status];
}
</script>

<style scoped>
.result-panel {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.summary-item,
.history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(9, 31, 61, 0.5);
  border: 1px solid rgba(154, 196, 255, 0.12);
}

.summary-item span,
.history-item span {
  color: var(--text-muted);
  font-size: 12px;
}

.failure-box,
.history-box {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 183, 82, 0.2);
  background: rgba(53, 43, 20, 0.34);
}

.failure-box p,
.history-item p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.history-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.action-button {
  flex: 1;
  padding: 14px 16px;
}

@media (max-width: 380px) {
  .summary-grid,
  .action-row {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
