<template>
  <section class="thread" :class="variant">
    <div v-if="!compact" class="section-heading">
      <div>
        <h3>对话记录</h3>
        <p>点击任意消息可快速复制内容。</p>
      </div>
    </div>
    <div class="messages" :class="{ compact }">
      <button
        v-for="message in messages"
        :key="message.id"
        type="button"
        class="message"
        :class="[message.role, message.tone ?? 'normal', { copied: copiedId === message.id }]"
        @click="copyMessage(message)"
      >
        <div class="message-meta">
          <span>{{ roleLabelMap[message.role] }}</span>
          <small>{{ copiedId === message.id ? "已复制" : message.timestamp }}</small>
        </div>
        <p>{{ message.content }}</p>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { ConversationMessage } from "../../types/agent";

const props = withDefaults(
  defineProps<{
    messages: ConversationMessage[];
    compact?: boolean;
    variant?: "panel" | "plain";
  }>(),
  {
    compact: false,
    variant: "panel",
  },
);

const copiedId = ref<string | null>(null);

const roleLabelMap = {
  assistant: "助手",
  user: "你",
  system: "系统",
};

async function copyMessage(message: ConversationMessage) {
  try {
    await navigator.clipboard.writeText(message.content);
    copiedId.value = message.id;
    window.setTimeout(() => {
      if (copiedId.value === message.id) copiedId.value = null;
    }, 1200);
  } catch {
    copiedId.value = message.id;
  }
}
</script>

<style scoped>
.thread {
  border-radius: 24px;
}

.thread.panel {
  padding: 18px;
  border: 1px solid var(--line-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04)),
    var(--bg-panel);
  box-shadow:
    0 18px 44px rgba(2, 10, 24, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(22px);
}

.thread.plain {
  padding: 0;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.messages.compact {
  margin-top: 0;
  gap: 10px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 86%;
  min-width: 0;
  padding: 14px 15px;
  border-radius: 20px;
  border: 1px solid rgba(152, 192, 255, 0.12);
  background: rgba(8, 31, 61, 0.62);
  color: var(--text-main);
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.message:hover {
  transform: translateY(-1px);
  border-color: rgba(120, 192, 255, 0.32);
}

.message.copied {
  border-color: rgba(85, 222, 156, 0.42);
}

.message.user {
  margin-left: auto;
  background: linear-gradient(135deg, rgba(44, 128, 255, 0.88), rgba(66, 206, 255, 0.72));
  color: #f5fbff;
}

.message.system {
  max-width: 100%;
  background: rgba(18, 53, 101, 0.56);
}

.messages.compact .message {
  max-width: 100%;
}

.message.success {
  border-color: rgba(85, 222, 156, 0.3);
}

.message.warning {
  border-color: rgba(255, 179, 77, 0.34);
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--text-secondary);
  font-size: 12px;
}

.message.user .message-meta {
  color: rgba(255, 255, 255, 0.82);
}

.message p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
