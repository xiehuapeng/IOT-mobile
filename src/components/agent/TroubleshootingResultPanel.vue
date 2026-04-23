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
        <p>可继续补充信息、执行轻量动作、转人工坐席，或结束本次处理。</p>
      </div>
    </div>

    <div class="chip-grid">
      <button class="ghost-button action-button" type="button" @click="$emit('action', 'continue')">继续排查</button>
      <button
        class="accent-button action-button"
        type="button"
        :disabled="!result.executableActions.length"
        @click="$emit('action', 'execute')"
      >
        执行处理
      </button>
      <button class="ghost-button action-button" type="button" @click="$emit('action', 'handoff')">转人工客服</button>
      <button class="ghost-button action-button" type="button" @click="$emit('action', 'finish')">结束</button>
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
