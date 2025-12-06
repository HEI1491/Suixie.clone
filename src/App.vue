<script>
// 根组件 - 应用程序的入口组件
//import debug from './components/debug.vue';
import BeianFooter from './components/BeianFooter.vue';

export default {
  name: 'App',  // 组件名称
  data(){
    return {
      beianImg: '/beian.png'
    }
  },
  mounted(){
    console.log('应用初始化完成')  // 输出初始化完成信息到控制台
  },
  components: {
    //debug  // 调试用组件（当前已注释）
    BeianFooter
  },
}
</script>
<template>
  <!-- 路由视图容器 - 根据当前路由显示对应组件 -->
  <RouterView id="view"></RouterView>
  <button class="back-home-btn" v-if="$route.path !== '/'" @click="$router.push('/')">返回主页</button>
  <div class="disclaimer" v-if="$route.path.startsWith('/court')">《娱乐项目 | 请勿模仿》</div>
  
  <!-- 全局备案信息（文档流内，非fixed） -->
  <BeianFooter />
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
 .back-home-btn { position: fixed; top: 12px; left: 12px; z-index: 1100; padding: 8px 12px; border: none; border-radius: 8px; background: var(--card-bg); color: var(--text-primary); box-shadow: var(--shadow-md); cursor: pointer; }
 .back-home-btn:hover { box-shadow: var(--shadow-lg); }
  .disclaimer { position: fixed; bottom: 44px; left: 0; width: 100%; text-align: center; padding: 6px 10px; font-size: 12px; color: var(--text-muted); background: var(--btn-secondary-bg); z-index: 900; }
</style>
