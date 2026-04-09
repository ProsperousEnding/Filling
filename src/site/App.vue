<template>
  <BlogContainer>
    <router-view />
  </BlogContainer>
  <CustomStyle />
  <CustomScript />
</template>

<script setup>
import BlogContainer from '@framework/components/core/BlogContainer.vue'
import CustomStyle from '@framework/components/theme/CustomStyle.vue'
import CustomScript from '@framework/components/theme/CustomScript.vue'
</script>
