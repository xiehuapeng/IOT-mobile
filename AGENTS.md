# AGENTS.md

本项目是 Vue 项目。

除非用户在当前对话中明确要求修改样式或 UI，否则 Codex 必须遵守以下规则：

1. 禁止修改任何视觉样式。
2. 禁止修改页面布局、颜色、字体、间距、圆角、阴影、动画、响应式断点。
3. 禁止修改任何 `.css`、`.scss`、`.less`、`.sass` 文件。
4. 禁止修改 Vue 单文件组件中的 `<style>` 区域。
5. 禁止新增或删除 Tailwind / UnoCSS / class 样式类。
6. 禁止修改组件库主题配置，如 Element Plus、Naive UI、Ant Design Vue、Vuetify 等。
7. 禁止调整 DOM 结构来改变视觉呈现。
8. 如功能实现不可避免涉及 UI 或样式，必须先向用户说明影响范围并等待确认。
