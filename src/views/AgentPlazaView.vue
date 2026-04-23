<template>
  <div class="page">
    <section class="plaza-hero section-card">
      <div class="page-kicker">Assistant Hub</div>
      <h2>智能体广场</h2>
      <p>面向移动端场景集中展示各类助手，可根据当前任务快速选择合适入口。</p>
    </section>

    <section class="page-section">
      <div class="section-heading">
        <div>
          <h3>常用助手</h3>
          <p>优先展示当前高频使用的助手。</p>
        </div>
        <span class="pill">{{ featuredAgents.length }} 个</span>
      </div>
      <div class="grid">
        <AgentCard v-for="agent in featuredAgents" :key="agent.id" :agent="agent" />
      </div>
    </section>

    <section class="page-section">
      <div class="section-heading">
        <div>
          <h3>更多助手</h3>
          <p>可根据后续需求继续扩展。</p>
        </div>
        <span class="pill">{{ previewAgents.length }} 个</span>
      </div>
      <div class="grid">
        <AgentCard v-for="agent in previewAgents" :key="agent.id" :agent="agent" compact />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AgentCard from "../components/agent/AgentCard.vue";
import { featuredAgents, previewAgents } from "../mock/agents";
</script>

<style scoped>
.plaza-hero {
  padding: 20px;
}

.plaza-hero p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 360px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
