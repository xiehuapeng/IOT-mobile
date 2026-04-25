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

    <div class="composer-shell">
      <button class="tool-button" type="button" aria-label="上传图片" @click="$emit('utility-click')">▧</button>
      <textarea
        ref="textareaRef"
        :value="request"
        rows="1"
        class="composer-input"
        :disabled="disabled"
        placeholder="请输入规则配置诉求"
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>
      <button class="tool-button" type="button" aria-label="语音输入" @click="$emit('utility-click')">🎙</button>
      <button class="send-button" type="button" :disabled="disabled" @click="$emit('submit-request')">发送</button>
    </div>
    <p class="composer-hint">支持上传截图辅助配置</p>
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
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
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
  font-size: 20px;
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

.composer-hint {
  margin: -6px 0 0 4px;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 380px) {
  .composer-shell {
    grid-template-columns: 40px minmax(0, 1fr) 40px 56px;
    gap: 6px;
  }
}
</style>
