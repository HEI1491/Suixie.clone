<template>
  <footer class="beian-footer">
    <div class="footer-content">
      <a
        class="beian-link"
        href="https://beian.mps.gov.cn/#/query/webSearch?code=32058302005589"
        rel="noreferrer"
        target="_blank"
        aria-label="公安备案查询"
      >
        <img
          class="beian-img"
          src="/beian.png"
          width="18"
          height="18"
          alt="公安备案图标"
          aria-hidden="true"
        />
        <span>苏公网安备32058302005589号</span>
      </a>
      <span class="divider">|</span>
      <a
        class="icp-link"
        href="https://beian.miit.gov.cn/#/Integrated/index"
        rel="noreferrer"
        target="_blank"
        aria-label="ICP备案查询"
      >
        <span class="icp-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M6 2h9l3 3v15a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm9 3h3l-3-3v3zM8 9h8v2H8V9zm0 4h8v2H8v-2z"/>
          </svg>
        </span>
        <span>苏ICP备2025219581号-1</span>
      </a>
    </div>
  </footer>
</template>

<script setup>
// 此组件为纯展示组件，无逻辑
</script>

<style scoped>
.beian-footer {
  padding: 16px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  background: var(--body-bg);
  border-top: 1px solid var(--border-color);
  margin-top: 40px;
}

.footer-content {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.beian-link,
.icp-link {
  color: var(--text-muted);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.beian-link:hover,
.icp-link:hover {
  color: var(--link-color);
}

.divider {
  color: var(--text-muted);
}

.beian-img {
  vertical-align: middle;
}

.icp-icon {
  display: inline-flex;
  align-items: center;
  color: #4a90e2;
}
</style>