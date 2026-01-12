<script setup>
import Home from './views/Home.vue';
</script>

<template>
  <div class="k-affix">
    <Home/>
  </div>
</template>


<style scoped>
    .k-affix {
        position: fixed;
        bottom: 55px;
        padding-left: 15px;
        width: 36px;
        z-index: 99999;
    }
</style>
