import { computed, reactive } from "vue";

import { buildAlertPreview, starterAlerts, starterRules } from "../mock/ruleAssistant";
import type { ManagedRule, RuleAlertRecord } from "../types/agent";

export const ruleCenter = reactive({
  rules: [...starterRules] as ManagedRule[],
  alerts: [...starterAlerts] as RuleAlertRecord[],
});

export function addRule(rule: ManagedRule) {
  ruleCenter.rules.unshift(rule);
  const previews = buildAlertPreview(rule);
  ruleCenter.alerts.unshift(...previews);
}

export function updateRule(ruleId: string, next: ManagedRule) {
  const index = ruleCenter.rules.findIndex((item) => item.id === ruleId);
  if (index >= 0) {
    ruleCenter.rules[index] = next;
  }
}

export function removeRule(ruleId: string) {
  ruleCenter.rules = ruleCenter.rules.filter((item) => item.id !== ruleId);
  ruleCenter.alerts = ruleCenter.alerts.filter((item) => item.ruleId !== ruleId);
}

export function pauseRule(ruleId: string) {
  const target = ruleCenter.rules.find((item) => item.id === ruleId);
  if (target) target.status = "paused";
}

export function resumeRule(ruleId: string) {
  const target = ruleCenter.rules.find((item) => item.id === ruleId);
  if (target) target.status = "active";
}

export function markAlertStatus(alertId: string, status: RuleAlertRecord["followUpStatus"]) {
  const target = ruleCenter.alerts.find((item) => item.id === alertId);
  if (target) target.followUpStatus = status;
}

export function getRuleById(ruleId: string) {
  return ruleCenter.rules.find((item) => item.id === ruleId) ?? null;
}

export const activeRules = computed(() => ruleCenter.rules.filter((item) => item.status === "active"));
export const pausedRules = computed(() => ruleCenter.rules.filter((item) => item.status === "paused"));
export const expiredRules = computed(() => ruleCenter.rules.filter((item) => item.status === "expired"));
export const recentAlerts = computed(() => ruleCenter.alerts.slice(0, 5));
