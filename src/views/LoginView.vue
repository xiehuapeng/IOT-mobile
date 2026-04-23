<template>
  <section class="login-page">
    <div class="hero-panel section-card">
      <div class="page-kicker">Mobile Workspace</div>
      <h1 class="hero-title">智能体工作台</h1>
      <p class="hero-copy">聚合规则配置、业务排障、业务办理、查询和问答等常用助手，帮助你快速处理日常任务。</p>
      <div class="chip-grid">
        <span class="pill">统一入口</span>
        <span class="pill">常用助手</span>
        <span class="pill">移动工作台</span>
      </div>
    </div>

    <form class="login-card section-card" @submit.prevent="enterDemo">
      <div class="section-heading">
        <div>
          <h3>登录</h3>
          <p>登录后即可进入工作台并使用当前可用助手。</p>
        </div>
      </div>

      <label class="field">
        <span>账号名称</span>
        <input v-model="accountName" type="text" autocomplete="username" placeholder="请输入账号名称" />
      </label>

      <label class="field">
        <span>访问口令</span>
        <input v-model="demoCode" type="password" autocomplete="current-password" placeholder="请输入访问口令" />
      </label>

      <div class="tips-box">
        <strong>登录提示</strong>
        <p>登录后默认进入移动工作台，可通过顶部菜单、底部导航或智能体广场进入不同助手。</p>
      </div>

      <button class="accent-button submit" type="submit">进入工作台</button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import { loginAsDemo } from "../stores/appState";

const router = useRouter();
const accountName = ref("业务经理");
const demoCode = ref("demo");

function enterDemo() {
  loginAsDemo(accountName.value.trim());
  router.push("/app/home");
}
</script>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: calc(100% - 42px);
  height: auto;
  padding: 16px;
  padding-bottom: 28px;
  overflow-y: auto;
}

.hero-panel,
.login-card {
  padding: 22px 20px;
}

.hero-copy {
  margin: 14px 0 18px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.field span {
  font-size: 14px;
  font-weight: 600;
}

.field input {
  width: 100%;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(155, 196, 255, 0.18);
  background: rgba(7, 24, 46, 0.7);
  color: var(--text-main);
}

.tips-box {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(10, 32, 63, 0.48);
  color: var(--text-secondary);
}

.tips-box strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text-main);
}

.submit {
  width: 100%;
  margin-top: 18px;
  padding: 14px 16px;
  position: sticky;
  bottom: 0;
}

@media (max-height: 760px) {
  .hero-panel,
  .login-card {
    padding: 18px 16px;
  }

  .hero-copy {
    margin: 10px 0 14px;
    line-height: 1.7;
  }

  .field,
  .tips-box,
  .submit {
    margin-top: 14px;
  }
}
</style>
