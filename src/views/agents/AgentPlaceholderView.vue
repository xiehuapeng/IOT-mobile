<template>
  <div class="page">
    <section class="placeholder-hero section-card" v-if="agent">
      <div class="page-kicker">Assistant</div>
      <h2>{{ agent.name }}</h2>
      <p>{{ agent.description }}</p>
      <div class="chip-grid">
        <span class="pill">{{ agent.capability }}</span>
        <span class="pill">{{ agent.category }}</span>
      </div>
    </section>

    <section class="section-card placeholder-body" v-if="agent">
      <div class="section-heading">
        <div>
          <h3>功能建设中</h3>
          <p>该助手当前已开放入口，后续将补充完整的任务处理能力。你可以先返回广场使用其他已开放助手。</p>
        </div>
      </div>
      <ul class="preview-list">
        <li>已保留当前助手的页面入口与访问路径。</li>
        <li>已接入最近访问记录，方便后续快速返回。</li>
        <li>后续可继续扩展对话、表单和结果处理页面。</li>
      </ul>
      <RouterLink class="accent-button back-button" to="/app/plaza">返回智能体广场</RouterLink>
    </section>

    <section class="section-card placeholder-body" v-else>
      <div class="section-heading">
        <div>
          <h3>未找到对应助手</h3>
          <p>当前路径没有匹配到可访问的助手入口，请返回广场重新选择。</p>
        </div>
      </div>
      <RouterLink class="accent-button back-button" to="/app/plaza">返回智能体广场</RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { agentsById } from "../../mock/agents";
import { markAgentVisited } from "../../stores/appState";
import { isAgentId } from "../../types/agent";

const route = useRoute();

const agent = computed(() => {
  const raw = String(route.params.agentId ?? "");
  return isAgentId(raw) ? agentsById[raw] : null;
});

watch(
  () => agent.value?.id,
  (value) => {
    if (value) markAgentVisited(value);
  },
  { immediate: true },
);

onMounted(() => {
  if (agent.value) markAgentVisited(agent.value.id);
});
</script>

<style scoped>
.placeholder-hero,
.placeholder-body {
  padding: 20px;
}

.placeholder-hero p {
  margin: 10px 0 16px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.preview-list {
  margin: 16px 0 0;
  padding-left: 20px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px;
  margin-top: 18px;
}
</style>
