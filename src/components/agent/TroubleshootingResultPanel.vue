<template>
  <section class="summary section-card result-card" :class="result.status">
    <div class="result-head">
      <div>
        <div class="page-kicker">Troubleshooting Result</div>
        <h3>{{ result.faultType }}</h3>
      </div>
      <span class="pill">{{ result.reference }}</span>
    </div>

    <p class="result-summary">{{ result.conclusion }}</p>

    <div class="next-actions">
      <strong>已核查项</strong>
      <ul>
        <li v-for="item in result.checkedItems" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div class="next-actions">
      <strong>明细信息</strong>
      <ul>
        <li v-for="detail in result.details" :key="detail.label">{{ detail.label }}：{{ detail.value }}</li>
      </ul>
    </div>

    <div class="next-actions">
      <strong>建议动作</strong>
      <ul>
        <li v-for="item in result.suggestedActions" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div v-if="executionTrace" class="next-actions">
      <strong>执行留痕</strong>
      <ul>
        <li>操作人：{{ executionTrace.operator }}</li>
        <li>操作时间：{{ executionTrace.operatedAt }}</li>
        <li>操作对象：{{ executionTrace.target }}</li>
        <li>执行动作：{{ executionTrace.action }}</li>
        <li>执行结果：{{ executionTrace.result }}</li>
      </ul>
    </div>

    <div v-if="handoffSummary" class="next-actions">
      <strong>转人工摘要</strong>
      <ul>
        <li>原始问题：{{ handoffSummary.originalQuestion }}</li>
        <li>对象信息：{{ handoffSummary.objectInfo.join("；") }}</li>
        <li>关键结果：{{ handoffSummary.keyResults.join("；") }}</li>
        <li>当前未解决点：{{ handoffSummary.unresolvedPoint }}</li>
      </ul>
    </div>

    <div class="result-foot">
      <div>
        <strong>客户经理后续操作</strong>
        <p>可选择转人工处理，或在具备自动动作时执行处理。</p>
      </div>
    </div>

    <div class="chip-grid result-actions">
      <button class="ghost-button action-button" type="button" @click="$emit('action', 'handoff')">人工处理</button>
      <button
        v-if="!executionTrace"
        class="accent-button action-button"
        type="button"
        @click="$emit('action', 'execute')"
      >
        执行处理
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  TroubleshootingActionId,
  TroubleshootingExecutionTrace,
  TroubleshootingHandoffSummary,
  TroubleshootingResult,
} from "../../types/agent";

defineProps<{
  result: TroubleshootingResult;
  executionTrace?: TroubleshootingExecutionTrace | null;
  handoffSummary?: TroubleshootingHandoffSummary | null;
}>();

defineEmits<{
  action: [action: TroubleshootingActionId];
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

.result-head > div,
.result-foot > div {
  min-width: 0;
}

.result-head h3 {
  margin: 6px 0 0;
  line-height: 1.35;
}

.result-head .pill {
  flex-shrink: 0;
}

.result-summary {
  margin: 18px 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.next-actions {
  margin-top: 18px;
}

.next-actions strong,
.result-foot strong {
  display: block;
  margin-bottom: 8px;
}

.next-actions ul {
  margin: 0;
  padding-left: 20px;
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

.result-actions {
  justify-content: center;
  margin-top: 18px;
}

.action-button {
  min-width: 112px;
  padding: 12px 14px;
}

</style>
