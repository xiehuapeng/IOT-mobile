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
        <img v-if="message.role === 'assistant'" class="message-avatar" :src="assistantAvatarSrc" alt="助手头像" />
        <div class="message-bubble">
          <div class="message-meta">
            <span>{{ roleLabelMap[message.role] }}</span>
            <small>{{ copiedId === message.id ? "已复制" : message.timestamp }}</small>
          </div>
          <p>{{ visibleContent(message) }}<span v-if="isTyping(message)" class="typing-caret"></span></p>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

import type { ConversationMessage } from "../../types/agent";

const props = withDefaults(
  defineProps<{
    messages: ConversationMessage[];
    compact?: boolean;
    variant?: "panel" | "plain";
    typewriter?: boolean;
  }>(),
  {
    compact: false,
    variant: "panel",
    typewriter: false,
  },
);

const copiedId = ref<string | null>(null);
const typingMessageId = ref<string | null>(null);
const typingLength = ref(0);
let typingTimer = 0;

const assistantAvatarSrc = computed(() => `${import.meta.env.BASE_URL}agent-avatars/rule-config.png`);

const roleLabelMap = {
  assistant: "助手",
  user: "你",
  system: "系统",
};

watch(
  () => props.messages.at(-1),
  (message) => {
    window.clearInterval(typingTimer);
    typingMessageId.value = null;
    typingLength.value = 0;
    if (!props.typewriter || !message || message.role !== "assistant") return;

    typingMessageId.value = message.id;
    typingLength.value = Math.min(2, message.content.length);
    typingTimer = window.setInterval(() => {
      typingLength.value += 2;
      if (typingLength.value >= message.content.length) {
        typingLength.value = message.content.length;
        typingMessageId.value = null;
        window.clearInterval(typingTimer);
      }
    }, 28);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.clearInterval(typingTimer);
});

function visibleContent(message: ConversationMessage) {
  if (message.id !== typingMessageId.value) return message.content;
  return message.content.slice(0, typingLength.value);
}

function isTyping(message: ConversationMessage) {
  return message.id === typingMessageId.value;
}

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
  align-items: flex-start;
  gap: 8px;
  max-width: 86%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-main);
  text-align: left;
  transition: transform 0.18s ease;
}

.message:hover {
  transform: translateY(-1px);
}

.message.user {
  margin-left: auto;
  color: #f5fbff;
}

.message.system {
  max-width: 100%;
}

.messages.compact .message {
  max-width: 100%;
}

.message-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.86);
}

.message-bubble {
  min-width: 0;
  padding: 14px 15px;
  border-radius: 20px;
  border: 1px solid rgba(152, 192, 255, 0.12);
  background: rgba(8, 31, 61, 0.62);
}

.message.user .message-bubble {
  background: linear-gradient(135deg, rgba(44, 128, 255, 0.88), rgba(66, 206, 255, 0.72));
}

.message.system .message-bubble {
  background: rgba(18, 53, 101, 0.56);
}

.message.copied .message-bubble {
  border-color: rgba(85, 222, 156, 0.42);
}

.message.success .message-bubble {
  border-color: rgba(85, 222, 156, 0.3);
}

.message.warning .message-bubble {
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

.typing-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -0.16em;
  background: currentColor;
  animation: caret-blink 0.8s steps(1) infinite;
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}
</style>
