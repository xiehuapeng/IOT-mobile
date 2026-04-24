<template>
  <section class="entry-panel">
    <div class="assistant-note">
      <span class="note-tag">快捷场景</span>
      <p>我可以直接带你进入对应配置，你也可以继续在下方输入自然语言。</p>
    </div>

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
      <textarea
        ref="textareaRef"
        :value="request"
        rows="1"
        class="composer-input"
        :disabled="disabled"
        placeholder="直接输入你的诉求，按 Enter 发送，Shift + Enter 换行"
        @input="handleInput"
        @keydown="handleKeydown"
      ></textarea>
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
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function resizeTextarea() {
  const node = textareaRef.value;
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
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
  gap: 14px;
}

.assistant-note,
.composer-shell {
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(153, 192, 255, 0.14);
  background: rgba(9, 31, 61, 0.44);
}

.note-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(92, 201, 255, 0.12);
  color: #8bdcff;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.assistant-note p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.scenario-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.scenario-card {
  padding: 16px;
  border-radius: 22px;
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
  margin: 12px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.composer-shell {
  padding: 10px 14px;
}

.composer-input {
  width: 100%;
  min-height: 28px;
  max-height: 140px;
  border: 0;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--text-main);
  line-height: 1.7;
}

.composer-input:disabled {
  opacity: 0.7;
  cursor: default;
}

.composer-input::placeholder {
  color: var(--text-muted);
}

</style>
