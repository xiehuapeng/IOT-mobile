<template>
  <section class="config-panel">
    <div class="section-heading">
      <div>
        <div class="page-kicker">Assistant Card</div>
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

        <div
          v-else-if="field.type === 'textarea' && field.id === 'monitorThreshold'"
          class="static-area"
        >
          <ul class="static-list">
            <li>执行完成</li>
            <li>执行失败</li>
            <li>卡单或长时间未完成</li>
            <li>批量订单成功失败数量及失败原因</li>
          </ul>
        </div>

        <textarea
          v-else-if="field.type === 'textarea'"
          :value="stringValue(field.id)"
          class="text-area"
          rows="4"
          :placeholder="field.placeholder"
          @input="setValue(field.id, ($event.target as HTMLTextAreaElement).value)"
        ></textarea>

        <div v-else-if="field.type === 'select' || field.type === 'radio'" class="select-shell">
          <select
            :value="stringValue(field.id)"
            class="select-input"
            @change="setValue(field.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">请选择</option>
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="select-icon" aria-hidden="true">⌄</span>
        </div>

        <div v-else-if="field.type === 'chips'" class="select-shell">
          <select
            :value="arrayValue(field.id)[0] ?? ''"
            class="select-input"
            @change="setArrayValue(field.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">请选择</option>
            <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <span class="select-icon" aria-hidden="true">⌄</span>
        </div>

        <small v-if="field.helper" class="field-helper">{{ field.helper }}</small>
      </label>
    </div>

    <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

    <div class="action-row">
      <button v-if="showBack" class="ghost-button action-button" type="button" @click="$emit('back')">返回上一步</button>
      <button class="accent-button action-button" type="button" @click="submit">{{ submitLabel ?? "生成摘要" }}</button>
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
  submitLabel?: string;
}>();

const emit = defineEmits<{
  submit: [values: RuleFormValues];
  back: [];
  "update:values": [values: RuleFormValues];
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

  if (key === "alertType") {
    if (value === "arrears-risk") {
      localValues.alertTimingMode = "condition-hit";
    } else if (!localValues.alertTimingMode || localValues.alertTimingMode === "condition-hit") {
      localValues.alertTimingMode = "days-before";
    }
  }

  if (key === "objectType") {
    if (value === "group") {
      delete localValues.monitorSpecificOrder;
    } else if (value === "order") {
      delete localValues.objectValue;
    }
  }

  if (key === "monitorTimingMode") {
    if (value === "scheduled-summary") {
      delete localValues.monitorThreshold;
    } else {
      delete localValues.monitorSummaryTime;
    }
  }

  emit("update:values", cloneValues(localValues));
}

function setArrayValue(key: string, value: string) {
  localValues[key as keyof RuleFormValues] = (value ? [value] : []) as never;
  emit("update:values", cloneValues(localValues));
}

function submit() {
  emit("submit", cloneValues(localValues));
}
</script>

<style scoped>
.config-panel {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(154, 196, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(17, 46, 91, 0.86), rgba(7, 24, 46, 0.92)),
    rgba(8, 27, 56, 0.78);
  box-shadow:
    0 18px 40px rgba(2, 10, 24, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
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

.select-shell {
  position: relative;
}

.select-shell::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 15px;
  background: linear-gradient(180deg, rgba(79, 151, 255, 0.12), rgba(13, 33, 60, 0));
  pointer-events: none;
}

.select-input {
  position: relative;
  width: 100%;
  min-height: 50px;
  padding: 13px 44px 13px 14px;
  border-radius: 16px;
  border: 1px solid rgba(155, 196, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(18, 51, 98, 0.94), rgba(8, 25, 49, 0.96)),
    rgba(7, 24, 46, 0.88);
  color: var(--text-main);
  outline: none;
  appearance: none;
  box-shadow:
    0 10px 24px rgba(3, 11, 24, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.select-input:focus {
  border-color: rgba(101, 194, 255, 0.42);
  box-shadow:
    0 0 0 3px rgba(75, 170, 255, 0.12),
    0 10px 24px rgba(3, 11, 24, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.select-icon {
  position: absolute;
  top: 50%;
  right: 14px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 10px;
  background: rgba(82, 164, 255, 0.14);
  color: #9bdcff;
  font-size: 14px;
  line-height: 1;
  transform: translateY(-50%);
  pointer-events: none;
}

.text-area {
  resize: vertical;
  min-height: 104px;
}

.static-area {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(155, 196, 255, 0.18);
  background:
    linear-gradient(180deg, rgba(14, 40, 77, 0.9), rgba(7, 24, 46, 0.9)),
    rgba(7, 24, 46, 0.72);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 10px 24px rgba(3, 11, 24, 0.14);
}

.static-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-main);
  line-height: 1.7;
}

.static-list li + li {
  margin-top: 4px;
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
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
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
