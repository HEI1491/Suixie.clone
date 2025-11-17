<script>
// 根组件 - 应用程序的入口组件
//import debug from './components/debug.vue';
export default {
  name: 'App',  // 组件名称
  data(){
    return {

    }
  },
  mounted(){
    console.log('应用初始化完成')  // 输出初始化完成信息到控制台
  },
  components: {
    //debug  // 调试用组件（当前已注释）
  },
}
</script>
<template>
  <!-- 路由视图容器 - 根据当前路由显示对应组件 -->
  <RouterView id="view"></RouterView>
  <!-- 调试用组件（当前已注释） -->
  <!--<div><debug></debug></div>-->
  <footer class="site-footer">
    <div class="footer-content">
      <a class="beian-link" href="https://beian.mps.gov.cn/#/query/webSearch?code=32058302005589" rel="noreferrer" target="_blank" aria-label="公安备案查询">
        <img class="beian-img" src="/beian.svg" width="18" height="18" alt="公安备案图标" aria-hidden="true" />
        <span>苏公网安备32058302005589号</span>
      </a>
      <span class="divider">|</span>
      <a class="icp-link" href="https://beian.miit.gov.cn/#/Integrated/index" rel="noreferrer" target="_blank" aria-label="ICP备案查询">
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

<style scoped>
/* 根组件样式 - 目前为空，样式主要由子组件控制 */
 .site-footer { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: center; padding: 8px 12px; font-size: 12px; color: var(--text-muted); background: var(--header-bg); backdrop-filter: blur(6px); box-shadow: var(--shadow-md); z-index: 900; }
 .footer-content { display: flex; align-items: center; gap: 10px; }
 .beian-link, .icp-link { color: var(--text-muted); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
 .beian-link:hover, .icp-link:hover { color: var(--link-color); }
 .divider { color: var(--text-muted); }
 .beian-img { display: inline-block; vertical-align: middle; }
 .icp-icon { display: inline-flex; align-items: center; justify-content: center; color: #4A90E2; }
</style>
