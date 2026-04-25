export const agentIds = [
  "troubleshoot",
  "service",
  "card-query",
  "knowledge-qa",
  "data-query",
  "rule-config",
] as const;

export type AgentId = (typeof agentIds)[number];

export type AgentStatus = "featured" | "preview";
export type MessageRole = "assistant" | "user" | "system";
export type FlowStatus = "success" | "warning" | "info";
export type DecisionFieldType = "text" | "textarea" | "chips" | "select" | "radio" | "checklist";

export interface AppUser {
  name: string;
  organization: string;
  role: string;
}

export interface AgentMeta {
  id: AgentId;
  name: string;
  shortName: string;
  description: string;
  capability: string;
  category: string;
  functionIntro: string;
  domainIntro: string;
  tags: string[];
  route: string;
  status: AgentStatus;
  featured: boolean;
  accent: string;
}

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  stepId?: string;
  tone?: FlowStatus;
}

export interface DecisionOption {
  label: string;
  value: string;
  hint?: string;
}

export interface DecisionField {
  id: string;
  label: string;
  type: DecisionFieldType;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: DecisionOption[];
}

export interface DecisionCard {
  id: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: DecisionField[];
}

export interface AgentFlowStep {
  id: string;
  title: string;
  description: string;
  assistantPrompt: string;
  decisionCard?: DecisionCard;
}

export interface FlowResult {
  title: string;
  summary: string;
  nextActions: string[];
  ctaLabel: string;
  ctaHint: string;
  status: FlowStatus;
  reference?: string;
}

export type RuleIntent = "alert" | "order-monitor" | "unsupported";
export type RuleEntryMode = "quick-alert" | "quick-order" | "natural-language" | "edit";
export type RuleObjectType = "group" | "account" | "customer" | "order";
export type RuleAlertType = "red-list-expiry" | "arrears-risk" | "plan-expiry" | "contract-renewal";
export type RuleAlertTimingMode = "days-before" | "condition-hit";
export type RuleMonitorCondition = "in-progress" | "failed" | "timeout" | "status-change";
export type RuleMonitorTimingMode = "hours-timeout" | "days-timeout" | "status-change" | "scheduled-summary";
export type RuleMonitorScope = "all-orders" | "specific-order";
export type RuleFrequency = "once" | "daily" | "weekly" | "until-handled" | "instant" | "summary-daily" | "scheduled-window";
export type RuleNotificationChannel = "notification-center" | "message";
export type RuleEffectivePeriod = "long-term" | "time-range" | "one-time" | "until-complete";
export type RuleStatus =
  | "draft"
  | "pending-confirmation"
  | "creating"
  | "create-failed"
  | "pending"
  | "active"
  | "paused"
  | "error"
  | "completed"
  | "expired"
  | "terminated";
export type RuleExecutionMode = "event-trigger" | "scheduled-scan" | "status-event" | "async-scan" | "summary-check";
export type RuleIssueType = "object" | "rule" | "duplicate" | "capacity";
export type RuleIssueSeverity = "error" | "warning" | "info";
export type RuleAlertStatus = "new" | "tracking" | "resolved" | "paused" | "snoozed" | "ignored";
export type RuleRiskLevel = "high" | "medium" | "low";

export interface RuleStatusHistoryItem {
  status: RuleStatus;
  timestamp: string;
  note: string;
}

export interface RuleFieldOption {
  label: string;
  value: string;
  hint?: string;
}

export interface RuleField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "radio" | "chips" | "select" | "date";
  required?: boolean;
  placeholder?: string;
  helper?: string;
  min?: number;
  max?: number;
  options?: RuleFieldOption[];
}

export interface RuleQuickEntry {
  id: RuleEntryMode;
  title: string;
  description: string;
  tag: string;
}

export interface RuleIntentMatch {
  intent: RuleIntent;
  reason: string;
  suggestedAgentId?: AgentId;
}

export interface RuleFormValues {
  naturalRequest?: string;
  ruleName?: string;
  objectType?: RuleObjectType;
  objectValue?: string;
  alertType?: RuleAlertType;
  alertTimingMode?: RuleAlertTimingMode;
  alertOffset?: string;
  alertFrequency?: RuleFrequency;
  notifyChannels?: string[];
  effectivePeriod?: RuleEffectivePeriod;
  effectiveStart?: string;
  effectiveEnd?: string;
  monitorCondition?: RuleMonitorCondition;
  monitorScope?: RuleMonitorScope;
  monitorSpecificOrder?: string;
  monitorTimingMode?: RuleMonitorTimingMode;
  monitorThreshold?: string;
  monitorSummaryTime?: string;
  monitorFrequency?: RuleFrequency;
}

export interface RuleIssue {
  type: RuleIssueType;
  severity: RuleIssueSeverity;
  title: string;
  detail: string;
}

export interface RuleValidationGroup {
  key: RuleIssueType;
  title: string;
  issues: RuleIssue[];
}

export interface RuleValidationResult {
  passed: boolean;
  groups: RuleValidationGroup[];
  summary: string;
  duplicateRuleId?: string;
  allowDuplicateContinue?: boolean;
}

export interface RuleSummaryItem {
  label: string;
  value: string;
}

export type TroubleshootingEntryId = "communication" | "order" | "realname";
export type TroubleshootingActionId =
  | "continue"
  | "execute"
  | "handoff"
  | "finish"
  | "continue-wait"
  | "realname-reauth"
  | "complete-realname-info";

export interface TroubleshootingIntake {
  entryId: TroubleshootingEntryId;
  originalQuestion: string;
  sourceScene: string;
  serviceNo?: string;
  iccid?: string;
  imsi?: string;
  orderNo?: string;
  batchTaskNo?: string;
  errorText?: string;
}

export interface TroubleshootingRecognition {
  inScope: boolean;
  entryId: TroubleshootingEntryId;
  entryLabel: string;
  missingFields: string[];
  extracted: TroubleshootingIntake;
  outOfScopeMessage?: string;
  followupSuggestion?: string;
  redirectAgents?: string[];
}

export interface TroubleshootingDetail {
  label: string;
  value: string;
}

export interface RuleSummary {
  title: string;
  description: string;
  items: RuleSummaryItem[];
  executionMode: RuleExecutionMode;
  executionLabel: string;
  note: string;
}

export interface ManagedRule {
  id: string;
  name: string;
  intent: Exclude<RuleIntent, "unsupported">;
  objectType: RuleObjectType;
  objectValue: string;
  scopeLabel?: string;
  primaryCondition: string;
  frequencyLabel: string;
  notifyChannels: RuleNotificationChannel[];
  effectiveLabel: string;
  executionMode: RuleExecutionMode;
  executionLabel: string;
  status: RuleStatus;
  createdAt: string;
  createdBy: string;
  values: RuleFormValues;
  summary: RuleSummary;
  bindingLabel?: string;
  latestFailureReason?: string;
  statusHistory: RuleStatusHistoryItem[];
}

export interface RuleAlertRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleTypeLabel: string;
  objectValue: string;
  currentStatus: string;
  reason: string;
  triggeredAt: string;
  recommendation: string;
  notificationChannels: RuleNotificationChannel[];
  followUpStatus: RuleAlertStatus;
  riskLevel: RuleRiskLevel;
  handlingStatus: string;
  secondaryReminderHint?: string;
  suggestedAgentId?: AgentId;
  suggestedRoute?: string;
}

export interface TroubleshootingExecutableAction {
  id: string;
  label: string;
  description: string;
}

export interface TroubleshootingResult {
  faultType: string;
  checkedItems: string[];
  conclusion: string;
  details: TroubleshootingDetail[];
  suggestedActions: string[];
  status: FlowStatus;
  reference: string;
  executableActions: TroubleshootingExecutableAction[];
  unresolvedPoint?: string;
}

export interface TroubleshootingExecutionTrace {
  operator: string;
  operatedAt: string;
  target: string;
  action: string;
  result: string;
  contextRef: string;
}

export interface TroubleshootingHandoffSummary {
  originalQuestion: string;
  objectInfo: string[];
  checkedItems: string[];
  keyResults: string[];
  conclusion: string;
  suggestedActions: string[];
  unresolvedPoint: string;
}

export function isAgentId(value: string): value is AgentId {
  return agentIds.includes(value as AgentId);
}
