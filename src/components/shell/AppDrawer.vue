<template>
  <div class="drawer-shell" :class="{ open }">
    <button class="overlay" type="button" @click="$emit('close')"></button>
    <aside class="drawer section-card">
      <div class="drawer-head">
        <div>
          <div class="page-kicker">Navigation</div>
          <h3>功能入口</h3>
        </div>
        <button class="close-button" type="button" @click="$emit('close')">关闭</button>
      </div>

      <div class="drawer-content">
        <div class="profile-card">
          <div class="profile-avatar">{{ avatarText }}</div>
          <div>
            <strong>{{ user?.name ?? "当前账号" }}</strong>
            <p>{{ user?.organization ?? "省级运营中心" }}</p>
          </div>
        </div>

        <div class="nav-group">
          <div class="group-title">主导航</div>
          <RouterLink
            v-for="item in primaryItems"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: route.path === item.to }"
            @click="$emit('close')"
          >
            <span>
              {{ item.label }}
              <em v-if="item.badge" class="item-badge">{{ item.badge }}</em>
            </span>
            <small>{{ item.hint }}</small>
          </RouterLink>
        </div>

        <div class="nav-group">
          <div class="group-title">常用助手</div>
          <RouterLink
            v-for="agent in featuredAgents"
            :key="agent.id"
            :to="agent.route"
            class="nav-item"
            :class="{ active: route.path === agent.route }"
            @click="$emit('close')"
          >
            <span>{{ agent.name }}</span>
            <small>{{ agent.shortName }} / {{ agent.category }}</small>
          </RouterLink>
        </div>

        <button class="logout-button" type="button" @click="$emit('logout')">退出当前账号</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";

import { featuredAgents } from "../../mock/agents";
import type { AppUser } from "../../types/agent";

const props = defineProps<{
  open: boolean;
  user: AppUser | null;
  unreadCount?: number;
}>();

defineEmits<{
  close: [];
  logout: [];
}>();

const route = useRoute();

const primaryItems = computed(() => [
  { label: "移动工作台", to: "/app/home", hint: "首页与最近访问" },
  { label: "智能体广场", to: "/app/plaza", hint: "查看全部助手" },
  {
    label: "消息中心",
    to: "/app/message-center",
    hint: "接收规则提醒与处理动态",
    badge: props.unreadCount && props.unreadCount > 0 ? props.unreadCount : undefined,
  },
  { label: "我的规则", to: "/app/my-rules", hint: "查看规则、提醒与历史记录" },
]);

const avatarText = computed(() => "账号");
</script>

<style scoped>
.drawer-shell {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}

.drawer-shell.open {
  pointer-events: auto;
}

.overlay {
  position: absolute;
  inset: 0;
  border: 0;
  opacity: 0;
  background: rgba(3, 10, 22, 0.58);
  transition: opacity 0.28s ease;
}

.drawer-shell.open .overlay {
  opacity: 1;
}

.drawer {
  position: absolute;
  top: 14px;
  left: 14px;
  bottom: 14px;
  display: flex;
  flex-direction: column;
  width: min(290px, calc(100% - 28px));
  padding: 18px;
  transform: translateX(-108%);
  transition: transform 0.28s ease;
  overflow: hidden;
}

.drawer-shell.open .drawer {
  transform: translateX(0);
}

.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.drawer-head h3 {
  margin: 4px 0 0;
}

.drawer-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.close-button,
.logout-button {
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid var(--line-strong);
  background: rgba(10, 32, 63, 0.58);
  color: var(--text-main);
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(9, 36, 72, 0.66);
  border: 1px solid rgba(150, 196, 255, 0.15);
}

.profile-avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: linear-gradient(135deg, #56d1ff, #2c85ff);
  font-weight: 700;
  color: #f5fbff;
}

.profile-card p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 22px;
}

.group-title {
  color: var(--text-muted);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.nav-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 15px;
  border-radius: 18px;
  border: 1px solid rgba(151, 194, 255, 0.1);
  background: rgba(10, 32, 63, 0.44);
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.nav-item.active {
  border-color: rgba(115, 192, 255, 0.36);
  background: rgba(18, 56, 110, 0.58);
}

.nav-item span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.nav-item small {
  color: var(--text-secondary);
}

.item-badge {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: linear-gradient(135deg, #5fc9ff, #2e83ff);
  color: #eff9ff;
  font-size: 11px;
  font-style: normal;
  line-height: 1;
}

.logout-button {
  width: 100%;
  margin-top: 22px;
}
</style>
