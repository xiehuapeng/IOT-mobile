<template>
  <article class="agent-card" :class="{ compact }">
    <AgentAvatar :agent="agent" />

    <div class="agent-content">
      <h3>{{ agent.name }}</h3>
      <p>{{ shortPitch }}</p>
      <div class="agent-actions">
        <button class="detail-button" type="button" @click="$emit('detail', agent)">详情</button>
        <RouterLink class="enter-button" :to="agent.route">进入</RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import AgentAvatar from "./AgentAvatar.vue";
import type { AgentMeta } from "../../types/agent";

const props = defineProps<{
  agent: AgentMeta;
  compact?: boolean;
}>();

defineEmits<{
  detail: [agent: AgentMeta];
}>();

const shortCopy: Record<string, string> = {
  troubleshoot: "异常识别、定位原因，快速生成排障建议。",
  "rule-config": "用对话完成提醒、监控等规则配置。",
  service: "识别办理事项，收集参数并推进结果确认。",
  "card-query": "查询卡状态、套餐和生命周期关键信息。",
  "knowledge-qa": "制度口径、操作规范，随问随答。",
  "data-query": "业务指标、趋势和维度分析入口。",
};

const shortPitch = computed(() => shortCopy[props.agent.id] ?? props.agent.description);
</script>

<style scoped>
.agent-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  min-width: 0;
  min-height: 122px;
  padding: 14px;
  border: 1px solid rgba(226, 232, 242, 0.95);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.98);
  color: #06152b;
  box-shadow: 0 8px 22px rgba(21, 51, 93, 0.05);
}

.agent-content {
  min-width: 0;
}

.agent-content h3 {
  margin: 0;
  color: #06152b;
  font-size: 17px;
  line-height: 1.28;
  white-space: normal;
  word-break: keep-all;
}

.agent-content p {
  display: -webkit-box;
  min-height: 40px;
  margin: 8px 0 0;
  overflow: hidden;
  color: #17243a;
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.agent-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.detail-button,
.enter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  min-height: 34px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
}

.detail-button {
  border: 1px solid #d8e3f2;
  background: #fff;
  color: #3573d8;
}

.enter-button {
  border: 0;
  background: linear-gradient(135deg, #36c5ff 0%, #2e7dff 100%);
  color: #fff;
}

@media (max-width: 380px) {
  .agent-card {
    gap: 12px;
    padding: 12px;
  }

  .agent-content h3 {
    font-size: 16px;
  }
}
</style>
