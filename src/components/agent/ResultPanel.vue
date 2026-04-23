<template>
  <section class="section-card result-card" :class="result.status">
    <div class="result-head">
      <div>
        <div class="page-kicker">Result</div>
        <h3>{{ result.title }}</h3>
      </div>
      <span class="pill">{{ result.reference ?? "已生成" }}</span>
    </div>

    <p class="result-summary">{{ result.summary }}</p>

    <div class="next-actions">
      <strong>后续处理</strong>
      <ul>
        <li v-for="item in result.nextActions" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div class="result-foot">
      <div>
        <strong>{{ result.ctaLabel }}</strong>
        <p>{{ result.ctaHint }}</p>
      </div>
      <button class="accent-button action-button" type="button" :disabled="actionDone" @click="$emit('action')">
        {{ actionDone ? "已完成" : result.ctaLabel }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FlowResult } from "../../types/agent";

defineProps<{
  result: FlowResult;
  actionDone: boolean;
}>();

defineEmits<{
  action: [];
}>();
</script>

<style scoped>
.result-card {
  padding: 18px;
}

.result-card.success {
  border-color: rgba(84, 213, 145, 0.34);
}

.result-card.warning {
  border-color: rgba(255, 185, 92, 0.32);
}

.result-head,
.result-foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.result-head h3 {
  margin: 6px 0 0;
}

.result-summary {
  margin: 18px 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.next-actions strong,
.result-foot strong {
  display: block;
  margin-bottom: 8px;
}

.next-actions ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.result-foot {
  margin-top: 18px;
}

.result-foot p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 13px;
}

.action-button {
  min-width: 132px;
  padding: 12px 14px;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
