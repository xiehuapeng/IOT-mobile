<template>
  <section class="section-card entry-panel">
    <div class="section-heading">
      <div>
        <h3>新建规则</h3>
        <p>可直接选择常用场景，也可以输入你的实际诉求。</p>
      </div>
      <RouterLink class="ghost-link" to="/app/my-rules">我的规则</RouterLink>
    </div>

    <div class="entry-grid">
      <button
        v-for="item in entries"
        :key="item.id"
        class="entry-card"
        type="button"
        @click="$emit('quick-entry', item.id)"
      >
        <span class="pill">{{ item.tag }}</span>
        <strong>{{ item.title }}</strong>
        <p>{{ item.description }}</p>
      </button>
    </div>

    <label class="request-box">
      <span>直接描述你的诉求</span>
      <textarea
        :value="request"
        rows="4"
        placeholder="例如：帮我盯一下这个集团红名单到期；这个订单如果失败就通知我。"
        @input="$emit('update:request', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </label>

    <button class="accent-button submit-button" type="button" @click="$emit('submit-request')">开始处理</button>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";

import { ruleQuickEntries as entries } from "../../mock/ruleAssistant";
import type { RuleEntryMode } from "../../types/agent";

defineProps<{
  request: string;
}>();

defineEmits<{
  "update:request": [value: string];
  "quick-entry": [entry: RuleEntryMode];
  "submit-request": [];
}>();
</script>

<style scoped>
.entry-panel {
  padding: 18px;
}

.ghost-link {
  color: var(--accent);
  font-size: 13px;
  font-weight: 600;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(153, 192, 255, 0.15);
  background: rgba(9, 31, 61, 0.54);
  color: var(--text-main);
  text-align: left;
}

.entry-card strong {
  font-size: 16px;
}

.entry-card p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 13px;
}

.request-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.request-box span {
  font-size: 14px;
  font-weight: 600;
}

.request-box textarea {
  width: 100%;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(155, 196, 255, 0.18);
  background: rgba(7, 24, 46, 0.72);
  color: var(--text-main);
  resize: vertical;
}

.submit-button {
  width: 100%;
  margin-top: 18px;
  padding: 14px 16px;
}

@media (max-width: 380px) {
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
