<template>
  <div class="copyright-footer">
    <div class="copyright-divider"></div>
    <p class="copyright-text">© 2026 AI Agent Platform. All rights reserved.</p>
    <p class="copyright-icp">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        皖ICP备2026011051号-1
      </a>
    </p>
  </div>
</template>

<script setup name="CopyrightFooter">
// 公共版权信息组件
</script>

<style>
/* ✅ 白色卡片风格，两侧留灰色背景 */
.copyright-footer {
  text-align: center;
  font-size: 12px;
  line-height: 2;
  border-radius: 4px; /* 圆角 */
  margin: 20px 0 0; /* 上方灰色间隔 */
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  color: #9ca3af;
  padding: 10px 0;
  clear: both;
}

.copyright-footer p {
  margin: 0;
}
.copyright-footer a {
  color: #409eff;
  text-decoration: none;
  transition: color 0.3s;
}

.copyright-footer a:hover {
  color: #0c5196;
}
</style>
