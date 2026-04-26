<template>
  <DeviceFrame>
    <div class="shell" :class="{ 'is-portal-home': isPortalHome, 'is-agent-screen': isAgentScreen }">
      <AppDrawer
        :open="appState.drawerOpen"
        :user="appState.user"
        :unread-count="unreadAlertCount"
        @close="closeDrawer"
        @logout="handleLogout"
      />

      <header v-if="!isPortalHome" class="app-bar">
        <button class="icon-button menu-button" type="button" @click="toggleDrawer">
          菜单
          <span v-if="unreadAlertCount" class="menu-badge">{{ unreadAlertCount > 9 ? "9+" : unreadAlertCount }}</span>
        </button>
        <div class="bar-title">
          <div class="page-kicker">Workspace</div>
          <strong>{{ routeTitle }}</strong>
        </div>
        <button class="icon-button" type="button" @click="handleHeaderAction">{{ headerActionLabel }}</button>
      </header>

      <main class="shell-body">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <transition name="page-slide" mode="out-in">
            <component :is="Component" :key="currentRoute.fullPath" />
          </transition>
        </RouterView>
      </main>

      <footer class="bottom-dock">
        <button class="dock-item" type="button" :class="{ active: route.path === '/app/home' }" @click="router.push('/app/home')">
          <span class="dock-icon">⌂</span>
          <small>首页</small>
        </button>
        <button class="dock-item" type="button" :class="{ active: route.path === '/app/plaza' }" @click="router.push('/app/plaza')">
          <span class="dock-icon">▦</span>
          <small>广场</small>
        </button>
        <button class="dock-item" type="button" @click="router.push('/app/my-rules')">
          <span class="dock-icon">♙</span>
          <small>我的</small>
        </button>
      </footer>

      <transition name="toast-slide">
        <button
          v-if="notificationVisible && activeBanner"
          class="alert-toast"
          type="button"
          @click="openMessageCenter"
        >
          <strong>消息中心</strong>
          <p>{{ activeBanner.ruleName }}</p>
          <small>{{ activeBanner.reason }}</small>
        </button>
      </transition>
    </div>
  </DeviceFrame>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import AppDrawer from "../components/shell/AppDrawer.vue";
import DeviceFrame from "../components/shell/DeviceFrame.vue";
import { appState, closeDrawer, logoutDemo, toggleDrawer } from "../stores/appState";
import { ruleCenter, unreadAlertCount } from "../stores/ruleCenter";
import type { RuleAlertRecord } from "../types/agent";

const route = useRoute();
const router = useRouter();

const routeTitle = computed(() => String(route.meta.title ?? "智能体广场"));
const isPortalHome = computed(() => route.path === "/app/home");
const onPlaza = computed(() => route.path === "/app/plaza");
const isAgentScreen = computed(() => route.path.startsWith("/app/agents/"));
const headerActionLabel = computed(() => (onPlaza.value ? "首页" : "广场"));
const activeBanner = ref<RuleAlertRecord | null>(null);
const notificationVisible = ref(false);
const seenAlertIds = new Set<string>();
let bannerTimer = 0;

function handleHeaderAction() {
  router.push(onPlaza.value ? "/app/home" : "/app/plaza");
}

function openMessageCenter() {
  notificationVisible.value = false;
  closeDrawer();
  router.push("/app/message-center");
}

function handleLogout() {
  logoutDemo();
  router.push("/login");
}

watch(
  () => route.path,
  () => closeDrawer(),
);

watch(
  () => ruleCenter.alerts[0]?.id,
  (latestId) => {
    if (!latestId || seenAlertIds.has(latestId)) return;
    seenAlertIds.add(latestId);
    const latest = ruleCenter.alerts[0];
    if (!latest) return;
    activeBanner.value = latest;
    notificationVisible.value = true;
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(() => {
      notificationVisible.value = false;
    }, 3600);
  },
);

onMounted(() => {
  ruleCenter.alerts.forEach((item) => seenAlertIds.add(item.id));
});

onBeforeUnmount(() => {
  window.clearTimeout(bannerTimer);
});
</script>

<style scoped>
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - 38px);
}

.app-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 16px 16px;
}

.bar-title {
  flex: 1;
  min-width: 0;
}

.bar-title strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
}

.icon-button {
  min-width: 58px;
  height: 40px;
  padding: 0 12px;
  border-radius: 16px;
  border: 1px solid rgba(154, 196, 255, 0.18);
  background: rgba(10, 32, 63, 0.62);
  color: var(--text-main);
}

.menu-button {
  position: relative;
}

.menu-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #67d6ff, #2b82ff);
  color: #f7fbff;
  font-size: 10px;
  font-weight: 700;
}

.shell-body {
  flex: 1;
  overflow: auto;
  padding: 0 16px 12px;
}

.is-agent-screen .shell-body {
  overflow: hidden;
}

.is-portal-home {
  height: calc(100% - 38px);
  background: #f5f7fb;
}

.is-portal-home .shell-body {
  padding: 0;
}

.bottom-dock {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 16px 18px;
}

.dock-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  border-radius: 18px;
  border: 1px solid rgba(153, 192, 255, 0.14);
  background: rgba(10, 31, 59, 0.6);
  color: var(--text-main);
}

.dock-icon {
  display: block;
  height: 24px;
  font-size: 24px;
  line-height: 1;
}

.dock-item small {
  color: var(--text-secondary);
}

.dock-item.active {
  border-color: rgba(103, 189, 255, 0.34);
  background: rgba(19, 63, 122, 0.64);
}

.is-portal-home .bottom-dock {
  gap: 0;
  padding: 8px 10px max(10px, env(safe-area-inset-bottom));
  border-top: 1px solid #edf0f5;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 18px rgba(20, 44, 80, 0.05);
}

.is-portal-home .dock-item {
  min-height: 54px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #596372;
}

.is-portal-home .dock-item small {
  color: inherit;
  font-size: 14px;
}

.is-portal-home .dock-item.active {
  color: #168fe8;
  background: transparent;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.page-slide-enter-from,
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.alert-toast {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 92px;
  z-index: 18;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid rgba(129, 196, 255, 0.24);
  background:
    linear-gradient(135deg, rgba(34, 86, 153, 0.98), rgba(16, 41, 78, 0.96)),
    rgba(8, 24, 46, 0.94);
  color: var(--text-main);
  text-align: left;
  box-shadow: 0 18px 38px rgba(0, 10, 24, 0.34);
}

.alert-toast strong {
  display: block;
  font-size: 13px;
  color: #9ddcff;
}

.alert-toast p {
  margin: 6px 0 4px;
  font-size: 15px;
  font-weight: 700;
}

.alert-toast small {
  display: block;
  color: var(--text-secondary);
  line-height: 1.5;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
