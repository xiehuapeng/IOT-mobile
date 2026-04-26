<template>
  <div class="plaza-page">
    <section class="plaza-tabs" aria-label="智能体分类">
      <button type="button" class="active">推荐</button>
      <button type="button">最近</button>
    </section>

    <section class="agent-list" aria-label="推荐智能体">
      <AgentCard v-for="agent in agentList" :key="agent.id" :agent="agent" @detail="openDetail" />
    </section>

    <transition name="sheet-fade">
      <div v-if="selectedAgent" class="detail-mask" @click.self="closeDetail">
        <section class="detail-sheet" role="dialog" aria-modal="true" aria-label="智能体详情">
          <button class="close-button" type="button" aria-label="关闭详情" @click="closeDetail">×</button>

          <div class="detail-head">
            <AgentAvatar :agent="selectedAgent" />
            <div>
              <div class="detail-kicker">智能体详情</div>
              <h2>{{ selectedAgent.name }}</h2>
              <p>{{ selectedAgent.capability }}</p>
            </div>
          </div>

          <div class="detail-block">
            <h3>能做什么</h3>
            <p>{{ selectedAgent.functionIntro }}</p>
          </div>

          <div class="detail-block">
            <h3>适用场景</h3>
            <p>{{ selectedAgent.domainIntro }}</p>
          </div>

          <div class="detail-tags">
            <span v-for="tag in selectedAgent.tags" :key="tag">{{ tag }}</span>
          </div>

          <RouterLink class="detail-enter" :to="selectedAgent.route" @click="closeDetail">进入智能体</RouterLink>
        </section>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";

import AgentAvatar from "../components/agent/AgentAvatar.vue";
import AgentCard from "../components/agent/AgentCard.vue";
import { agentList } from "../mock/agents";
import type { AgentMeta } from "../types/agent";

const selectedAgent = ref<AgentMeta | null>(null);

function openDetail(agent: AgentMeta) {
  selectedAgent.value = agent;
}

function closeDetail() {
  selectedAgent.value = null;
}
</script>

<style scoped>
.plaza-page {
  min-height: 100%;
  padding: 4px 0 16px;
}

.plaza-tabs {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 24px;
  padding: 4px 2px 14px;
  background: linear-gradient(180deg, #0d2242 0%, rgba(13, 34, 66, 0.92) 75%, rgba(13, 34, 66, 0));
}

.plaza-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: rgba(235, 244, 255, 0.58);
  font-size: 16px;
  font-weight: 600;
}

.plaza-tabs .active {
  color: #f7fbff;
  font-weight: 800;
}

.plaza-tabs .active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 3px;
  border-radius: 999px;
  background: #f7fbff;
}

.agent-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.detail-mask {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 12px 12px;
  background: rgba(3, 12, 26, 0.5);
}

.detail-sheet {
  position: relative;
  width: min(396px, 100%);
  max-height: min(78vh, 620px);
  overflow: auto;
  padding: 20px;
  border-radius: 24px;
  background: #fff;
  color: #0d1d35;
  box-shadow: 0 -18px 44px rgba(0, 9, 24, 0.32);
}

.close-button {
  position: absolute;
  right: 14px;
  top: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #f0f4f9;
  color: #627086;
  font-size: 22px;
  line-height: 1;
}

.detail-head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-right: 34px;
}

.detail-kicker {
  color: #2b83eb;
  font-size: 12px;
  font-weight: 800;
}

.detail-head h2 {
  margin: 4px 0 6px;
  font-size: 21px;
  line-height: 1.2;
}

.detail-head p,
.detail-block p {
  margin: 0;
  color: #5e6a7b;
  font-size: 14px;
  line-height: 1.65;
}

.detail-block {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf1f6;
}

.detail-block h3 {
  margin: 0 0 8px;
  color: #101d31;
  font-size: 15px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.detail-tags span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef5ff;
  color: #2b6ed2;
  font-size: 12px;
  font-weight: 700;
}

.detail-enter {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin-top: 18px;
  border-radius: 14px;
  background: linear-gradient(135deg, #36c5ff 0%, #2e7dff 100%);
  color: #fff;
  font-weight: 800;
}

.sheet-fade-enter-active,
.sheet-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-fade-enter-active .detail-sheet,
.sheet-fade-leave-active .detail-sheet {
  transition: transform 0.2s ease;
}

.sheet-fade-enter-from,
.sheet-fade-leave-to {
  opacity: 0;
}

.sheet-fade-enter-from .detail-sheet,
.sheet-fade-leave-to .detail-sheet {
  transform: translateY(24px);
}

</style>
