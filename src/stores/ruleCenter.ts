import { computed, reactive } from "vue";

import { buildAlertPreview, ruleStatusLabels, starterAlerts, starterRules } from "../mock/ruleAssistant";
import type { ManagedRule, RuleAlertRecord, RuleStatus } from "../types/agent";

export const ruleCenter = reactive({
  rules: [...starterRules] as ManagedRule[],
  alerts: [...starterAlerts] as RuleAlertRecord[],
});

function nowText() {
  return "2026-04-24 11:30";
}

export function appendRuleStatus(ruleId: string, status: RuleStatus, note: string) {
  const target = ruleCenter.rules.find((item) => item.id === ruleId);
  if (!target) return;
  target.status = status;
  target.statusHistory.unshift({
    status,
    timestamp: nowText(),
    note,
  });
}

export function addRule(rule: ManagedRule) {
  ruleCenter.rules.unshift(rule);
  if (rule.status !== "create-failed" && rule.status !== "draft") {
    const previews = buildAlertPreview(rule);
    ruleCenter.alerts.unshift(...previews);
  }
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
  appendRuleStatus(ruleId, "paused", "用户手动暂停了当前规则。");
}

export function resumeRule(ruleId: string) {
  appendRuleStatus(ruleId, "active", "规则已恢复执行。");
}

export function terminateRule(ruleId: string) {
  appendRuleStatus(ruleId, "terminated", "用户主动终止了当前规则。");
}

export function failRule(ruleId: string, reason: string) {
  const target = ruleCenter.rules.find((item) => item.id === ruleId);
  if (!target) return;
  target.latestFailureReason = reason;
  appendRuleStatus(ruleId, "create-failed", reason);
}

export function markRuleExecutionError(ruleId: string, reason: string) {
  const target = ruleCenter.rules.find((item) => item.id === ruleId);
  if (!target) return;
  target.latestFailureReason = reason;
  appendRuleStatus(ruleId, "error", reason);
}

export function completeRule(ruleId: string, note = "规则目标已完成，后续不再继续提醒。") {
  appendRuleStatus(ruleId, "completed", note);
}

export function expireRule(ruleId: string) {
  appendRuleStatus(ruleId, "expired", "规则超出生效周期，已自动失效。");
}

export function markAlertStatus(alertId: string, status: RuleAlertRecord["followUpStatus"]) {
  const target = ruleCenter.alerts.find((item) => item.id === alertId);
  if (!target) return;

  target.followUpStatus = status;
  target.handlingStatus =
    status === "resolved"
      ? "已处理"
      : status === "snoozed"
        ? "暂不提醒"
        : status === "tracking"
          ? "跟进中"
          : status === "ignored"
            ? "已忽略"
            : "待处理";

  if (status === "resolved") {
    const rule = ruleCenter.rules.find((item) => item.id === target.ruleId);
    if (rule?.values.effectivePeriod === "one-time" || rule?.values.effectivePeriod === "until-complete") {
      completeRule(target.ruleId);
    }
  }
}

export function getRuleById(ruleId: string) {
  return ruleCenter.rules.find((item) => item.id === ruleId) ?? null;
}

export function getStatusLabel(status: RuleStatus) {
  return ruleStatusLabels[status];
}

export const activeRules = computed(() => ruleCenter.rules.filter((item) => item.status === "active"));
export const pausedRules = computed(() => ruleCenter.rules.filter((item) => item.status === "paused"));
export const expiredRules = computed(() => ruleCenter.rules.filter((item) => item.status === "expired"));
export const pendingRules = computed(() => ruleCenter.rules.filter((item) => item.status === "pending"));
export const errorRules = computed(() => ruleCenter.rules.filter((item) => item.status === "error" || item.status === "create-failed"));
export const completedRules = computed(() => ruleCenter.rules.filter((item) => item.status === "completed"));
export const terminatedRules = computed(() => ruleCenter.rules.filter((item) => item.status === "terminated"));
export const recentAlerts = computed(() => ruleCenter.alerts.slice(0, 5));
export const unreadAlerts = computed(() => ruleCenter.alerts.filter((item) => item.followUpStatus === "new"));
export const unreadAlertCount = computed(() => unreadAlerts.value.length);
