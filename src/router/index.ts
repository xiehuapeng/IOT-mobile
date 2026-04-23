import { createRouter, createWebHistory } from "vue-router";

import AuthShell from "../layouts/AuthShell.vue";
import MobileShell from "../layouts/MobileShell.vue";
import { isAuthenticated } from "../stores/appState";
import AgentPlazaView from "../views/AgentPlazaView.vue";
import HomeView from "../views/HomeView.vue";
import LoginView from "../views/LoginView.vue";
import MyRulesView from "../views/MyRulesView.vue";
import AgentPlaceholderView from "../views/agents/AgentPlaceholderView.vue";
import RuleConfigView from "../views/agents/RuleConfigView.vue";
import ServiceHandlingView from "../views/agents/ServiceHandlingView.vue";
import TroubleshootingView from "../views/agents/TroubleshootingView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/login",
    },
    {
      path: "/login",
      component: AuthShell,
      children: [
        {
          path: "",
          component: LoginView,
          meta: { title: "欢迎登录" },
        },
      ],
    },
    {
      path: "/app",
      component: MobileShell,
      children: [
        {
          path: "",
          redirect: "/app/home",
        },
        {
          path: "home",
          component: HomeView,
          meta: { title: "移动工作台" },
        },
        {
          path: "plaza",
          component: AgentPlazaView,
          meta: { title: "智能体广场" },
        },
        {
          path: "my-rules",
          component: MyRulesView,
          meta: { title: "我的规则" },
        },
        {
          path: "agents/troubleshoot",
          component: TroubleshootingView,
          meta: { title: "业务排障助手" },
        },
        {
          path: "agents/rule-config",
          component: RuleConfigView,
          meta: { title: "规则配置类助手" },
        },
        {
          path: "agents/service",
          component: ServiceHandlingView,
          meta: { title: "业务办理助手" },
        },
        {
          path: "agents/:agentId",
          component: AgentPlaceholderView,
          meta: { title: "智能体详情" },
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.path.startsWith("/app") && !isAuthenticated.value) {
    return "/login";
  }
  if (to.path === "/login" && isAuthenticated.value) {
    return "/app/home";
  }
  return true;
});

export default router;
