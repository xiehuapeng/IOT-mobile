<template>
  <section class="validation-panel">
    <div class="section-heading">
      <div>
        <h3>校验结果</h3>
        <p>{{ result.summary }}</p>
      </div>
      <span class="pill" :class="{ pass: result.passed }">{{ result.passed ? "通过" : "未通过" }}</span>
    </div>

    <div class="group-list">
      <article v-for="group in result.groups" :key="group.key" class="group-card">
        <div class="group-head">
          <strong>{{ group.title }}</strong>
          <span>{{ group.issues.length }} 项</span>
        </div>
        <div v-if="group.issues.length" class="issue-list">
          <div v-for="issue in group.issues" :key="`${group.key}-${issue.title}`" class="issue-item" :class="issue.severity">
            <strong>{{ issue.title }}</strong>
            <p>{{ issue.detail }}</p>
          </div>
        </div>
        <p v-else class="group-pass">当前项校验通过。</p>
      </article>
    </div>

    <div class="action-row">
      <button class="ghost-button action-button" type="button" @click="$emit('back')">返回修改</button>
      <button
        v-if="result.duplicateRuleId"
        class="ghost-button action-button"
        type="button"
        @click="$emit('view-existing', result.duplicateRuleId)"
      >
        查看已有规则
      </button>
      <button
        class="accent-button action-button"
        type="button"
        :disabled="!result.passed && !result.allowDuplicateContinue"
        @click="$emit('next')"
      >
        {{ result.allowDuplicateContinue ? "继续创建" : "继续" }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { RuleValidationResult } from "../../types/agent";

defineProps<{
  result: RuleValidationResult;
}>();

defineEmits<{
  back: [];
  next: [];
  "view-existing": [ruleId: string];
}>();
</script>

<style scoped>
.validation-panel {
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

.pill.pass {
  color: #c7ffe0;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.group-card {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(154, 196, 255, 0.14);
  background: rgba(10, 32, 63, 0.44);
}

.group-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.issue-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(7, 24, 46, 0.62);
}

.issue-item.error {
  border: 1px solid rgba(255, 136, 102, 0.28);
}

.issue-item.warning {
  border: 1px solid rgba(255, 188, 88, 0.28);
}

.issue-item.info {
  border: 1px solid rgba(108, 192, 255, 0.26);
}

.issue-item p,
.group-pass {
  margin: 8px 0 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 13px;
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

.action-button:disabled {
  opacity: 0.55;
  cursor: default;
}
</style>
