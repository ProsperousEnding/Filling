<template>
  <main class="flex-1 py-8">
    <div class="blog-container">
      <slot></slot>
    </div>
  </main>
</template>

<script setup>
// 主内容区域组件，接收子组件通过插槽传入
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
}
</style> 