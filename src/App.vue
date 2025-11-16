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
</template>

<style scoped>
/* 根组件样式 - 目前为空，样式主要由子组件控制 */

</style>
