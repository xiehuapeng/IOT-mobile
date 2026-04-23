<template>
  <section class="section-card config-panel">
    <div class="section-heading">
      <div>
        <div class="page-kicker">Structured Card</div>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
      </div>
      <span class="pill">{{ fields.length }} 项配置</span>
    </div>

    <div class="field-list">
      <label v-for="field in fields" :key="field.id" class="field-block">
        <span class="field-label">{{ field.label }}<em v-if="field.required">*</em></span>

        <input
          v-if="field.type === 'text' || field.type === 'number' || field.type === 'date'"
          :value="stringValue(field.id)"
          class="text-input"
          :type="field.type === 'number' ? 'number' : field.type"
          :min="field.min"
          :max="field.max"
          :placeholder="field.placeholder"
          @input="setValue(field.id, ($event.target as HTMLInputElement).value)"
        />

        <textarea
          v-else-if="field.type === 'textarea'"
          :value="stringValue(field.id)"
          class="text-area"
          rows="4"
          :placeholder="field.placeholder"
          @input="setValue(field.id, ($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <select
          v-else-if="field.type === 'select'"
          :value="stringValue(field.id)"
          class="text-input"
          @change="setValue(field.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">请选择</option>
          <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>

        <div v-else-if="field.type === 'radio'" class="option-stack">
          <button
            v-for="option in field.options"
            :key="option.value"
            type="button"
            class="option-card"
            :class="{ selected: stringValue(field.id) === option.value }"
            @click="setValue(field.id, option.value)"
          >
            <strong>{{ option.label }}</strong>
            <small v-if="option.hint">{{ option.hint }}</small>
          </button>
        </div>

        <div v-else-if="field.type === 'chips'" class="chip-grid">
          <button
            v-for="option in field.options"
            :key="option.value"
            type="button"
            class="chip-button"
            :class="{ selected: arrayValue(field.id).includes(option.value) }"
            @click="toggleArrayValue(field.id, option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <small v-if="field.helper" class="field-helper">{{ field.helper }}</small>
      </label>
    </div>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <div class="action-row">
      <button v-if="showBack" class="ghost-button action-button" type="button" @click="$emit('back')">返回上一步</button>
      <button class="accent-button action-button" type="button" @click="submit">确认并校验</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";

import type { RuleField, RuleFormValues } from "../../types/agent";

const props = defineProps<{
  title: string;
  description: string;
  fields: RuleField[];
  values: RuleFormValues;
  errorMessage?: string;
  showBack?: boolean;
}>();

const emit = defineEmits<{
  submit: [values: RuleFormValues];
  back: [];
}>();

const localValues = reactive<RuleFormValues>({});

function cloneValues(source: RuleFormValues): RuleFormValues {
  const next: RuleFormValues = {};
  Object.entries(source).forEach(([key, value]) => {
    next[key as keyof RuleFormValues] = (Array.isArray(value) ? [...value] : value) as never;
  });
  return next;
}

watch(
  () => props.values,
  (next) => {
    Object.keys(localValues).forEach((key) => delete localValues[key as keyof RuleFormValues]);
    Object.assign(localValues, cloneValues(next));
  },
  { immediate: true, deep: true },
);

function stringValue(key: string) {
  return String(localValues[key as keyof RuleFormValues] ?? "");
}

function arrayValue(key: string) {
  const value = localValues[key as keyof RuleFormValues];
  return Array.isArray(value) ? value : [];
}

function setValue(key: string, value: string) {
  localValues[key as keyof RuleFormValues] = value as never;
}

function toggleArrayValue(key: string, value: string) {
  const current = arrayValue(key);
  localValues[key as keyof RuleFormValues] = (
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  ) as never;
}

function submit() {
  emit("submit", cloneValues(localValues));
}
</script>

<style scoped>
.config-panel {
  padding: 18px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
}

.field-label em {
  margin-left: 4px;
  color: #8ddaff;
  font-style: normal;
}

.text-input,
.text-area {
  width: 100%;
  padding: 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(155, 196, 255, 0.18);
  background: rgba(7, 24, 46, 0.72);
  color: var(--text-main);
  outline: none;
}

.text-area {
  resize: vertical;
  min-height: 104px;
}

.option-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-card,
.chip-button {
  border: 1px solid rgba(147, 189, 255, 0.14);
  background: rgba(10, 32, 63, 0.5);
  color: var(--text-main);
}

.option-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  text-align: left;
}

.option-card small {
  color: var(--text-secondary);
}

.chip-button {
  padding: 10px 12px;
  border-radius: 999px;
}

.option-card.selected,
.chip-button.selected {
  border-color: rgba(109, 198, 255, 0.45);
  background: rgba(23, 74, 141, 0.64);
}

.field-helper {
  color: var(--text-muted);
  line-height: 1.5;
}

.error-banner {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 181, 77, 0.28);
  background: rgba(99, 62, 16, 0.34);
  color: #ffd08a;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.action-button {
  flex: 1;
  padding: 14px 16px;
}
</style>
