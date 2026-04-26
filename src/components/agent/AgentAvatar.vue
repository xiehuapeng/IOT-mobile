<template>
  <img class="agent-avatar" :src="avatarSrc" :alt="`${agent.name}头像`" />
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { AgentMeta } from "../../types/agent";

const props = defineProps<{
  agent: AgentMeta;
}>();

const avatarSrc = computed(() => `${import.meta.env.BASE_URL}agent-avatars/${props.agent.id}.png`);
</script>

<style scoped>
.agent-avatar {
  display: block;
  width: 74px;
  height: 74px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
  background: #eef5ff;
  box-shadow:
    0 12px 24px rgba(11, 67, 130, 0.2),
    0 0 0 3px rgba(255, 255, 255, 0.95);
}

@media (max-width: 380px) {
  .agent-avatar {
    width: 68px;
    height: 68px;
  }
}
</style>
