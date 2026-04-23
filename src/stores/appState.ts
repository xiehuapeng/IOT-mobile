import { computed, reactive } from "vue";

import { agentsById } from "../mock/agents";
import type { AgentId, AppUser } from "../types/agent";

const USER_KEY = "agent-plaza-user";
const RECENT_KEY = "agent-plaza-recent";

function loadUser(): AppUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

function loadRecent(): AgentId[] {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AgentId[];
  } catch {
    return [];
  }
}

export const appState = reactive({
  splashVisible: true,
  drawerOpen: false,
  user: loadUser(),
  recentAgentIds: loadRecent(),
});

function persistUser(user: AppUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

function persistRecent(agentIds: AgentId[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(agentIds));
}

export function loginAsDemo(name: string) {
  appState.user = {
    name: name || "当前账号",
    organization: "省级运营中心",
    role: "客户经理",
  };
  persistUser(appState.user);
}

export function logoutDemo() {
  appState.user = null;
  appState.drawerOpen = false;
  persistUser(null);
}

export function openDrawer() {
  appState.drawerOpen = true;
}

export function closeDrawer() {
  appState.drawerOpen = false;
}

export function toggleDrawer() {
  appState.drawerOpen = !appState.drawerOpen;
}

export function markAgentVisited(agentId: AgentId) {
  const next = [agentId, ...appState.recentAgentIds.filter((item) => item !== agentId)].slice(0, 4);
  appState.recentAgentIds = next;
  persistRecent(next);
}

export const isAuthenticated = computed(() => Boolean(appState.user));
export const recentAgents = computed(() =>
  appState.recentAgentIds.map((id) => agentsById[id]).filter(Boolean),
);
