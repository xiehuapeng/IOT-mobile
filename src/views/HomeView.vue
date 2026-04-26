<template>
  <div class="portal-page">
    <section class="portal-hero">
      <div class="portal-toolbar">
        <button class="user-switch" type="button" aria-label="当前账号">
          <span>谢 (xieh********c_gd)</span>
          <span class="chevron">⌄</span>
        </button>
        <label class="search-pill" aria-label="搜索集团">
          <span class="search-icon">⌕</span>
          <input type="text" placeholder="请输入集团名称" />
        </label>
        <button class="filter-button" type="button" aria-label="筛选">▽</button>
      </div>

      <div class="banner">
        <div class="banner-art" aria-hidden="true">
          <div class="phone-card">
            <span class="phone-mic">●</span>
          </div>
          <span class="voice-wave wave-a"></span>
          <span class="voice-wave wave-b"></span>
        </div>
        <div class="banner-copy">
          <strong>定向语音白名单</strong>
          <span>变更申请流程</span>
          <button type="button">查看详情</button>
        </div>
      </div>

      <div class="carousel-dots" aria-hidden="true">
        <span></span>
        <span class="active"></span>
        <span></span>
      </div>
    </section>

    <main class="portal-content">
      <section class="quick-grid" aria-label="常用功能">
        <button v-for="item in quickActions" :key="item.label" class="quick-item" type="button">
          <span class="quick-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </section>

      <section class="business-section">
        <h2>业务专区</h2>
        <div class="section-title-row">
          <h3>热门商品</h3>
          <button type="button">更多 ›</button>
        </div>
        <div class="product-grid">
          <article v-for="product in products" :key="product.title" class="product-card">
            <strong>{{ product.title }}</strong>
            <span>{{ product.desc }}</span>
            <i aria-hidden="true"></i>
          </article>
        </div>
      </section>
    </main>

    <div class="xiaoyi-entry" :class="{ collapsed: xiaoyiCollapsed }">
      <button
        v-if="xiaoyiCollapsed"
        class="xiaoyi-tab"
        type="button"
        aria-label="展开你的小移"
        @click="xiaoyiCollapsed = false"
      >
        小移
      </button>
      <template v-else>
        <button class="xiaoyi-collapse" type="button" aria-label="收起你的小移" @click="xiaoyiCollapsed = true">›</button>
        <RouterLink class="xiaoyi-card" to="/app/plaza" aria-label="你的小移，进入智能体广场">
          <span class="xiaoyi-bubble">你的小移</span>
          <span class="xiaoyi-avatar">
            <span class="avatar-face">
              <i></i>
              <i></i>
            </span>
          </span>
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

const xiaoyiCollapsed = ref(false);

function handlePageScroll(event: Event) {
  const target = event.target as HTMLElement;
  if (target.scrollTop > 160) {
    xiaoyiCollapsed.value = true;
  }
}

onMounted(() => {
  const shellBody = document.querySelector<HTMLElement>(".is-portal-home .shell-body");
  shellBody?.addEventListener("scroll", handlePageScroll, { passive: true });
});

onBeforeUnmount(() => {
  const shellBody = document.querySelector<HTMLElement>(".is-portal-home .shell-body");
  shellBody?.removeEventListener("scroll", handlePageScroll);
});

const quickActions = [
  { label: "预受理审批", icon: "印" },
  { label: "预受理管理", icon: "✓" },
  { label: "智能诊断", icon: "+" },
  { label: "收藏集团", icon: "★" },
  { label: "批量办理", icon: "▤" },
  { label: "批量管理", icon: "▣" },
  { label: "新车卡实名", icon: "证" },
  { label: "报障提单", icon: "!" },
  { label: "我的报障", icon: "文" },
  { label: "报障单查询", icon: "查" },
  { label: "白名单列表", icon: "☑" },
];

const products = [
  { title: "全国通用流量30G", desc: "5G SA全国通用流量120元畅联套餐" },
  { title: "全国通用流量50G", desc: "5G SA全国通用流量150元畅联套餐" },
  { title: "全国通用流量100G", desc: "5G SA全国通用流量200元畅联套餐" },
  { title: "全国通用流量150G", desc: "5G SA全国通用流量300元畅联套餐" },
];
</script>

<style scoped>
.portal-page {
  position: relative;
  min-height: 100%;
  background: #f5f7fb;
  color: #222;
}

.portal-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #3fb0ff 0%, #46a7f6 42%, #7584ff 42%, #7584ff 100%);
}

.portal-toolbar {
  display: grid;
  grid-template-columns: minmax(118px, 1fr) minmax(0, 1.28fr) 38px;
  gap: 10px;
  align-items: center;
  min-height: 74px;
  padding: 10px 18px 12px;
  color: #fff;
}

.user-switch,
.filter-button {
  border: 0;
  background: transparent;
  color: #fff;
}

.user-switch {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 4px;
  padding: 0;
  font-size: 14px;
}

.user-switch span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  font-size: 20px;
  line-height: 1;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  color: #9aa7b8;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.search-pill input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #4b5664;
  font-size: 14px;
}

.search-icon {
  font-size: 23px;
  line-height: 1;
}

.filter-button {
  width: 38px;
  height: 38px;
  font-size: 29px;
  transform: rotate(90deg);
}

.banner {
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  align-items: center;
  min-height: 178px;
  padding: 10px 26px 20px;
  color: #fff;
}

.banner-art {
  position: relative;
  height: 138px;
}

.phone-card {
  position: absolute;
  left: 54px;
  top: 10px;
  display: grid;
  place-items: center;
  width: 74px;
  height: 118px;
  border-radius: 22px;
  background: linear-gradient(150deg, #f8fbff, #cdd9ff);
  box-shadow: 0 18px 34px rgba(44, 54, 132, 0.26);
}

.phone-card::before {
  content: "";
  position: absolute;
  top: 10px;
  width: 28px;
  height: 4px;
  border-radius: 999px;
  background: #7b88e8;
}

.phone-mic {
  width: 34px;
  height: 54px;
  border-radius: 999px;
  background: #6f65df;
  color: transparent;
}

.voice-wave {
  position: absolute;
  border: 2px solid rgba(224, 244, 255, 0.48);
  border-radius: 50%;
}

.wave-a {
  left: 18px;
  top: 44px;
  width: 142px;
  height: 62px;
}

.wave-b {
  left: 40px;
  top: 26px;
  width: 106px;
  height: 88px;
}

.banner-copy {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
}

.banner-copy strong,
.banner-copy span {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.24;
}

.banner-copy button {
  margin-top: 10px;
  min-width: 88px;
  height: 38px;
  border: 0;
  border-radius: 2px;
  background: #fff;
  color: #5461a5;
  font-weight: 700;
}

.carousel-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.carousel-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

.carousel-dots .active {
  background: #fff;
}

.portal-content {
  padding-bottom: 18px;
  background: #f5f7fb;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  row-gap: 22px;
  column-gap: 8px;
  padding: 24px 14px 28px;
  background: #fff;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #5e6672;
  font-size: 14px;
  line-height: 1.2;
}

.quick-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10c7ed 0%, #258df2 100%);
  color: #fff;
  font-size: 24px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(19, 154, 230, 0.18);
}

.business-section {
  margin-top: 12px;
  padding: 22px 16px 24px;
  background: #fff;
}

.business-section h2,
.section-title-row h3 {
  margin: 0;
}

.business-section h2 {
  font-size: 21px;
  color: #1d2734;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
}

.section-title-row h3 {
  color: #c31622;
  font-size: 22px;
}

.section-title-row button {
  border: 0;
  background: transparent;
  color: #9a9fa8;
  font-size: 16px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.product-card {
  position: relative;
  min-height: 92px;
  overflow: hidden;
  padding: 14px 12px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 88% 80%, rgba(255, 255, 255, 0.8) 0 7px, transparent 8px),
    linear-gradient(135deg, #ffb23d 0%, #ff7d2f 100%);
  color: #fff;
}

.product-card strong,
.product-card span {
  position: relative;
  z-index: 1;
  display: block;
}

.product-card strong {
  font-size: 17px;
  line-height: 1.25;
}

.product-card span {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.35;
  opacity: 0.95;
}

.product-card i {
  position: absolute;
  right: -10px;
  bottom: -16px;
  width: 74px;
  height: 58px;
  border-radius: 20px 20px 0 0;
  background: rgba(255, 72, 72, 0.36);
  transform: rotate(-18deg);
}

.xiaoyi-entry {
  position: fixed;
  right: max(0px, calc((100vw - 420px) / 2));
  top: clamp(316px, 42vh, 392px);
  z-index: 8;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  filter: drop-shadow(0 12px 20px rgba(30, 95, 170, 0.28));
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}

.xiaoyi-entry.collapsed {
  top: clamp(330px, 48vh, 470px);
  filter: drop-shadow(0 8px 14px rgba(30, 95, 170, 0.18));
}

.xiaoyi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.xiaoyi-collapse,
.xiaoyi-tab {
  border: 0;
  color: #fff;
  box-shadow: 0 8px 18px rgba(30, 95, 170, 0.18);
}

.xiaoyi-collapse {
  display: grid;
  place-items: center;
  width: 22px;
  height: 42px;
  border-radius: 14px 0 0 14px;
  background: rgba(37, 136, 235, 0.88);
  font-size: 18px;
  line-height: 1;
}

.xiaoyi-tab {
  width: 28px;
  min-height: 82px;
  padding: 8px 4px;
  border-radius: 16px 0 0 16px;
  background: linear-gradient(180deg, #4bd3ff 0%, #2b80ff 100%);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.15;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.xiaoyi-bubble {
  position: relative;
  padding: 6px 9px;
  border-radius: 14px 14px 4px 14px;
  background: #fff;
  color: #2489e8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 8px 18px rgba(30, 95, 170, 0.16);
}

.xiaoyi-bubble::after {
  content: "";
  position: absolute;
  right: 10px;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: #fff;
  transform: rotate(45deg);
}

.xiaoyi-avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: linear-gradient(145deg, #53d7ff 0%, #277dff 58%, #7f72ff 100%);
}

.avatar-face {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 7px;
  width: 30px;
  height: 22px;
  padding-top: 7px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.avatar-face::before {
  content: "";
  position: absolute;
  left: 50%;
  top: -9px;
  width: 2px;
  height: 9px;
  background: #fff;
  transform: translateX(-50%);
}

.avatar-face::after {
  content: "";
  position: absolute;
  left: 50%;
  top: -13px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff;
  transform: translateX(-50%);
}

.avatar-face i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #2388ea;
}

@media (max-width: 380px) {
  .portal-toolbar {
    grid-template-columns: minmax(96px, 0.85fr) minmax(0, 1.15fr) 34px;
    gap: 7px;
    padding-inline: 14px;
  }

  .banner {
    grid-template-columns: 0.95fr 1.05fr;
    padding-inline: 18px;
  }

  .banner-copy strong,
  .banner-copy span {
    font-size: 19px;
  }

  .quick-grid {
    padding-inline: 10px;
    column-gap: 4px;
  }

  .quick-item {
    font-size: 12px;
  }

  .quick-icon {
    width: 48px;
    height: 48px;
    font-size: 21px;
  }
}
</style>
