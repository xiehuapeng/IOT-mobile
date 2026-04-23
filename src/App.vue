<template>
  <RouterView />
  <transition name="splash-fade">
    <div v-if="appState.splashVisible" class="splash-screen">
      <div class="splash-orb splash-orb-a"></div>
      <div class="splash-orb splash-orb-b"></div>
      <div class="splash-card">
        <div class="splash-kicker">Mobile Workspace</div>
        <h1>智能体工作台</h1>
        <p>围绕常用业务场景提供统一入口与协同处理能力</p>
        <div class="splash-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";

import { appState } from "./stores/appState";

onMounted(() => {
  window.setTimeout(() => {
    appState.splashVisible = false;
  }, 1400);
});
</script>
