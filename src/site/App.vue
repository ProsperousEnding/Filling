<template>
  <router-view v-slot="{ Component, route }">
    <component v-if="route.meta.standalone" :is="Component" />
    <BlogContainer v-else>
      <component :is="Component" />
    </BlogContainer>

    <template v-if="!route.meta.standalone">
      <CustomStyle />
      <CustomScript />
    </template>
  </router-view>
</template>

<script setup>
import BlogContainer from '@framework/components/core/BlogContainer.vue'
import CustomStyle from '@framework/components/theme/CustomStyle.vue'
import CustomScript from '@framework/components/theme/CustomScript.vue'
</script>
