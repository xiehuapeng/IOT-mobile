<template>
  <section class="section-card decision-card">
    <div class="section-heading">
      <div>
        <h3>{{ card.title }}</h3>
        <p>{{ card.description }}</p>
      </div>
      <span class="pill">{{ card.fields.length }} 项</span>
    </div>

    <div class="field-list">
      <label v-for="field in card.fields" :key="field.id" class="field-block">
        <span class="field-label">{{ field.label }}<em v-if="field.required">*</em></span>

        <input
          v-if="field.type === 'text'"
          v-model="stringValues[field.id]"
          class="text-input"
          type="text"
          :placeholder="field.placeholder"
        />

        <textarea
          v-else-if="field.type === 'textarea'"
          v-model="stringValues[field.id]"
          class="text-area"
          rows="4"
          :placeholder="field.placeholder"
        ></textarea>

        <select v-else-if="field.type === 'select'" v-model="stringValues[field.id]" class="text-input">
          <option value="">请选择</option>
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <div v-else-if="field.type === 'radio'" class="option-stack">
          <button
            v-for="option in field.options"
            :key="option.value"
            type="button"
            class="option-card"
            :class="{ selected: stringValues[field.id] === option.value }"
            @click="stringValues[field.id] = option.value"
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
            :class="{ selected: stringValues[field.id] === option.value }"
            @click="stringValues[field.id] = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div v-else-if="field.type === 'checklist'" class="option-stack">
          <button
            v-for="option in field.options"
            :key="option.value"
            type="button"
            class="option-card"
            :class="{ selected: arrayValues[field.id]?.includes(option.value) }"
            @click="toggleValue(field.id, option.value)"
          >
            <strong>{{ option.label }}</strong>
          </button>
        </div>

        <small v-if="field.helper" class="field-helper">{{ field.helper }}</small>
      </label>
    </div>

    <div v-if="mergedError" class="error-banner">{{ mergedError }}</div>

    <button class="accent-button submit-button" type="button" @click="handleSubmit">
      {{ card.submitLabel }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";

import type { DecisionCard } from "../../types/agent";

const props = defineProps<{
  card: DecisionCard;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  submit: [values: Record<string, string | string[]>];
}>();

const stringValues = reactive<Record<string, string>>({});
const arrayValues = reactive<Record<string, string[]>>({});
const localError = computed(() => validationError.value);
const validationError = computed(() => errorState.value);
const errorState = reactive<{ value: string }>({ value: "" });

function resetValues() {
  errorState.value = "";
  for (const key of Object.keys(stringValues)) delete stringValues[key];
  for (const key of Object.keys(arrayValues)) delete arrayValues[key];

  props.card.fields.forEach((field) => {
    if (field.type === "checklist") {
      arrayValues[field.id] = [];
    } else {
      stringValues[field.id] = "";
    }
  });
}

watch(
  () => props.card,
  () => resetValues(),
  { immediate: true },
);

function toggleValue(fieldId: string, value: string) {
  const values = arrayValues[fieldId] ?? [];
  arrayValues[fieldId] = values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function handleSubmit() {
  errorState.value = "";
  for (const field of props.card.fields) {
    if (!field.required) continue;
    if (field.type === "checklist") {
      if (!arrayValues[field.id] || arrayValues[field.id].length === 0) {
        errorState.value = `请完善“${field.label}”。`;
        return;
      }
    } else if (!stringValues[field.id]?.trim()) {
      errorState.value = `请完善“${field.label}”。`;
      return;
    }
  }

  const payload: Record<string, string | string[]> = {};
  props.card.fields.forEach((field) => {
    payload[field.id] = field.type === "checklist" ? arrayValues[field.id] ?? [] : stringValues[field.id] ?? "";
  });
  emit("submit", payload);
}

const mergedError = computed(() => props.errorMessage || localError.value);
</script>

<style scoped>
.decision-card {
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
  background: rgba(7, 24, 46, 0.7);
  color: var(--text-main);
  outline: none;
}

.text-area {
  resize: vertical;
  min-height: 104px;
}

.text-input::placeholder,
.text-area::placeholder {
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.55;
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

.submit-button {
  width: 100%;
  margin-top: 18px;
  padding: 14px 16px;
}
</style>
