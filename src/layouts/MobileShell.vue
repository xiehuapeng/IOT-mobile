<template>
  <DeviceFrame>
    <div class="shell">
      <AppDrawer :open="appState.drawerOpen" :user="appState.user" @close="closeDrawer" @logout="handleLogout" />

      <header class="app-bar">
        <button class="icon-button" type="button" @click="toggleDrawer">菜单</button>
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
          <span>首页</span>
          <small>工作台</small>
        </button>
        <button class="dock-item" type="button" :class="{ active: route.path === '/app/plaza' }" @click="router.push('/app/plaza')">
          <span>广场</span>
          <small>助手入口</small>
        </button>
        <button class="dock-item" type="button" @click="openRecentAgent">
          <span>最近</span>
          <small>{{ recentShortcutLabel }}</small>
        </button>
      </footer>
    </div>
  </DeviceFrame>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

import AppDrawer from "../components/shell/AppDrawer.vue";
import DeviceFrame from "../components/shell/DeviceFrame.vue";
import { appState, closeDrawer, logoutDemo, recentAgents, toggleDrawer } from "../stores/appState";

const route = useRoute();
const router = useRouter();

const routeTitle = computed(() => String(route.meta.title ?? "智能体广场"));
const onPlaza = computed(() => route.path === "/app/plaza");
const headerActionLabel = computed(() => (onPlaza.value ? "首页" : "广场"));
const recentShortcutLabel = computed(() => recentAgents.value[0]?.shortName ?? "排障");

function handleHeaderAction() {
  router.push(onPlaza.value ? "/app/home" : "/app/plaza");
}

function handleLogout() {
  logoutDemo();
  router.push("/login");
}

function openRecentAgent() {
  router.push(recentAgents.value[0]?.route ?? "/app/agents/troubleshoot");
}

watch(
  () => route.path,
  () => closeDrawer(),
);
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

.shell-body {
  flex: 1;
  overflow: auto;
  padding: 0 16px 12px;
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

.dock-item small {
  color: var(--text-secondary);
}

.dock-item.active {
  border-color: rgba(103, 189, 255, 0.34);
  background: rgba(19, 63, 122, 0.64);
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
</style>
