<template>
  <ElAffix :offset="120" target="body">
    <ElButton type="primary" :icon="Promotion" circle @click="showDrawer"/>
  </ElAffix>

  <ElDrawer v-model="drawerVisible" :direction="direction" :with-header="false" size="50%" :append-to-body="true">
    <component ref="componentRef" :is="componentName"/>
  </ElDrawer>

  </template>

<script setup>
import $ from "jquery"
import { ref, onMounted,markRaw } from "vue";
import { ElAffix, ElButton, ElDrawer } from 'element-plus'
import { Promotion,Switch} from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import Account from './components/Account.vue';
import Network from './components/Network.vue';

const drawerVisible = ref(false)
const direction = ref('rtl')

const componentRef = ref()
const componentName = ref(null)

onMounted(() => {
   componentName.value = markRaw(Account)
})

const showDrawer = () => {
    drawerVisible.value = true
}

</script>