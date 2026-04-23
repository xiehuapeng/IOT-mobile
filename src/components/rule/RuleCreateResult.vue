<template>
  <section class="section-card result-panel">
    <div class="section-heading">
      <div>
        <h3>规则创建成功</h3>
        <p>当前规则已保存，可继续查看管理信息或进入提醒记录。</p>
      </div>
      <span class="pill">{{ rule.status === "pending" ? "待生效" : "生效中" }}</span>
    </div>

    <div class="summary-grid">
      <div class="summary-item"><span>规则ID</span><strong>{{ rule.id }}</strong></div>
      <div class="summary-item"><span>创建人</span><strong>{{ rule.createdBy }}</strong></div>
      <div class="summary-item"><span>创建时间</span><strong>{{ rule.createdAt }}</strong></div>
      <div class="summary-item"><span>规则类型</span><strong>{{ rule.intent === "alert" ? "预警提醒类" : "订单执行监控类" }}</strong></div>
      <div class="summary-item"><span>监控对象</span><strong>{{ rule.objectValue }}</strong></div>
      <div class="summary-item"><span>执行方式</span><strong>{{ rule.executionLabel }}</strong></div>
    </div>

    <div class="action-row">
      <button class="ghost-button action-button" type="button" @click="$emit('manage')">前往规则中心</button>
      <button class="accent-button action-button" type="button" @click="$emit('preview-alerts')">查看提醒记录</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ManagedRule } from "../../types/agent";

defineProps<{
  rule: ManagedRule;
}>();

defineEmits<{
  manage: [];
  "preview-alerts": [];
}>();
</script>

<style scoped>
.result-panel {
  padding: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(9, 31, 61, 0.5);
  border: 1px solid rgba(154, 196, 255, 0.12);
}

.summary-item span {
  color: var(--text-muted);
  font-size: 12px;
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
