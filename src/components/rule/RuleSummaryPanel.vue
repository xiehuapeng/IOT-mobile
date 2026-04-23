<template>
  <section class="summary-panel">
    <div class="section-heading">
      <div>
        <h3>规则确认</h3>
        <p>{{ summary.description }}</p>
      </div>
      <span class="pill">{{ summary.executionLabel }}</span>
    </div>

    <div class="summary-grid">
      <div v-for="item in summary.items" :key="item.label" class="summary-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <div class="note-box">
      <strong>执行说明</strong>
      <p>{{ summary.note }}</p>
    </div>

    <div class="action-row">
      <button class="ghost-button action-button" type="button" @click="$emit('back')">返回修改</button>
      <button class="accent-button action-button" type="button" @click="$emit('confirm')">确认创建</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RuleSummary } from "../../types/agent";

defineProps<{
  summary: RuleSummary;
}>();

defineEmits<{
  back: [];
  confirm: [];
}>();
</script>

<style scoped>
.summary-panel {
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

.summary-item strong {
  line-height: 1.6;
}

.note-box {
  margin-top: 16px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(255, 183, 82, 0.2);
  background: rgba(53, 43, 20, 0.34);
}

.note-box p {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
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
</style>
