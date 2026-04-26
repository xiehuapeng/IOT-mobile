<template>
  <section class="entry-panel">
    <div class="scenario-grid">
      <button
        v-for="item in entries"
        :key="item.id"
        class="scenario-card"
        type="button"
        :disabled="disabled"
        @click="$emit('quick-entry', item.id)"
      >
        <div class="scenario-head">
          <strong>{{ item.title }}</strong>
          <span>{{ item.tag }}</span>
        </div>
        <p>{{ item.description }}</p>
      </button>
    </div>

    <div class="composer-area">
      <div class="composer-shell">
        <button class="tool-button" type="button" aria-label="上传图片" @click="$emit('utility-click')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 19h14V5H5v14Zm2-2 3.2-4 2.3 2.8 3-3.8L18 17H7Zm2.5-6.8a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
          </svg>
        </button>
        <textarea
          ref="textareaRef"
          :value="request"
          rows="1"
          class="composer-input"
          :disabled="disabled"
          placeholder="请输入规则配置诉求，按 Enter 发送"
          @input="handleInput"
          @keydown="handleKeydown"
        ></textarea>
        <button class="tool-button" type="button" aria-label="语音输入" @click="$emit('utility-click')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
          </svg>
        </button>
        <button class="send-button" type="button" :disabled="disabled" @click="$emit('submit-request')">发送</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";

import { ruleQuickEntries as entries } from "../../mock/ruleAssistant";
import type { RuleEntryMode } from "../../types/agent";

defineProps<{
  request: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:request": [value: string];
  "quick-entry": [entry: RuleEntryMode];
  "submit-request": [];
  "utility-click": [];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function resizeTextarea() {
  const node = textareaRef.value;
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${Math.min(node.scrollHeight, 96)}px`;
}

function handleInput(event: Event) {
  emit("update:request", (event.target as HTMLTextAreaElement).value);
  nextTick(resizeTextarea);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    emit("submit-request");
  }
}
</script>

<style scoped>
.entry-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  height: 100%;
  min-height: 0;
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  flex: 0 0 auto;
}

.scenario-card {
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(125, 188, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(16, 46, 90, 0.96), rgba(7, 23, 46, 0.92)),
    rgba(8, 30, 58, 0.72);
  color: var(--text-main);
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.scenario-card:disabled {
  opacity: 0.58;
  cursor: default;
}

.scenario-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.scenario-head strong {
  font-size: 16px;
  line-height: 1.4;
}

.scenario-head span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(92, 201, 255, 0.12);
  color: #9be4ff;
  font-size: 11px;
  white-space: nowrap;
}

.scenario-card p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.65;
}

.composer-area {
  margin-top: auto;
  flex: 0 0 auto;
}

.composer-shell {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px 62px;
  gap: 8px;
  align-items: end;
  padding: 10px;
  border-radius: 22px;
  border: 1px solid rgba(153, 192, 255, 0.18);
  background: rgba(9, 31, 61, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.tool-button,
.send-button {
  min-height: 44px;
  border-radius: 16px;
  font-weight: 800;
}

.tool-button {
  border: 1px solid rgba(142, 187, 255, 0.2);
  background: rgba(10, 32, 63, 0.58);
  color: #e9f5ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.tool-button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.send-button {
  border: 0;
  background: linear-gradient(135deg, #78dcff 0%, #3b8fff 100%);
  color: #fff;
  font-size: 16px;
}

.send-button:disabled {
  opacity: 0.58;
}

.composer-input {
  width: 100%;
  min-height: 44px;
  max-height: 96px;
  padding: 10px 2px;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-main);
  font-size: 15px;
  line-height: 1.55;
}

.composer-input:disabled {
  opacity: 0.7;
  cursor: default;
}

.composer-input::placeholder {
  color: rgba(220, 232, 247, 0.5);
}

@media (max-width: 380px) {
  .composer-shell {
    grid-template-columns: 40px minmax(0, 1fr) 40px 56px;
    gap: 6px;
  }
}
</style>
