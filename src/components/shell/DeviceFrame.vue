<template>
  <div class="stage">
    <div class="stage-grid"></div>
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>
    <div class="device-shadow"></div>
    <div class="device">
      <div class="device-topline"></div>
      <div class="device-screen">
        <header class="status-bar">
          <span>{{ timeText }}</span>
          <div class="status-icons">
            <span>5G</span>
            <span>WiFi</span>
            <span>89%</span>
          </div>
        </header>
        <slot />
      </div>
      <div class="device-home-indicator"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const timeText = ref("09:41");
let timer = 0;

function updateTime() {
  const now = new Date();
  timeText.value = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

onMounted(() => {
  updateTime();
  timer = window.setInterval(updateTime, 60_000);
});

onBeforeUnmount(() => {
  window.clearInterval(timer);
});
</script>

<style scoped>
.stage {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 28px 18px;
  overflow: hidden;
}

.stage-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(circle at center, black 35%, transparent 88%);
  pointer-events: none;
}

.ambient {
  position: absolute;
  border-radius: 999px;
  filter: blur(36px);
  pointer-events: none;
}

.ambient-left {
  width: 240px;
  height: 240px;
  left: calc(50% - 320px);
  top: 18%;
  background: rgba(73, 150, 255, 0.22);
}

.ambient-right {
  width: 220px;
  height: 220px;
  right: calc(50% - 310px);
  bottom: 16%;
  background: rgba(37, 215, 255, 0.18);
}

.device-shadow {
  position: absolute;
  width: min(420px, calc(100vw - 24px));
  height: 760px;
  border-radius: 58px;
  background: radial-gradient(circle at center, rgba(22, 121, 255, 0.28), transparent 62%);
  filter: blur(34px);
}

.device {
  position: relative;
  width: min(420px, calc(100vw - 24px));
  height: min(860px, calc(100vh - 32px));
  height: min(860px, calc(100dvh - 32px));
  padding: 10px;
  border-radius: 48px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.06)),
    linear-gradient(145deg, #17365b, #09172b);
  box-shadow:
    0 40px 80px rgba(0, 7, 20, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 -1px 0 rgba(255, 255, 255, 0.08);
}

.device-topline {
  position: absolute;
  left: 50%;
  top: 14px;
  width: 120px;
  height: 26px;
  transform: translateX(-50%);
  border-radius: 0 0 20px 20px;
  background: linear-gradient(180deg, rgba(4, 12, 24, 0.95), rgba(10, 24, 48, 0.9));
  z-index: 2;
}

.device-screen {
  height: 100%;
  overflow: hidden;
  border-radius: 38px;
  border: 1px solid rgba(201, 223, 255, 0.12);
  background:
    radial-gradient(circle at top, rgba(93, 198, 255, 0.15), transparent 32%),
    linear-gradient(180deg, #0d2242 0%, #07182c 100%);
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px 10px;
  color: rgba(235, 245, 255, 0.82);
  font-size: 12px;
  letter-spacing: 0.05em;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-home-indicator {
  position: absolute;
  left: 50%;
  bottom: 14px;
  width: 120px;
  height: 5px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.54);
}

@media (max-width: 560px) {
  .stage {
    padding: 0;
  }

  .device,
  .device-shadow {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
  }

  .device {
    padding: 0;
    box-shadow: none;
  }

  .device-screen {
    height: 100dvh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 0;
    border: 0;
  }

  .device-topline,
  .device-home-indicator {
    display: none;
  }
}
</style>
