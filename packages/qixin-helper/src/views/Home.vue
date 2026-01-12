<template>
  <ElAffix :offset="120" target="body">
    <ElButton type="primary" :icon="Promotion" circle @click="showDrawer"/>
  </ElAffix>

  <ElDrawer v-model="drawerVisible" :direction="direction" :with-header="false" size="50%" :append-to-body="true">
    <component ref="componentRef" :is="componentName"/>
    <template #footer>
      <div style="flex: auto">
        <ElButton type="info" :icon="Switch" size="small" plain @click="changeMode">模式</ElButton>
      </div>
    </template>
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
    if (window.location.href.startsWith('https://tpass.') || window.location.href.startsWith('https://etax.')) {
    componentName.value = markRaw(Account)
  }else{
    componentName.value = markRaw(Network)
  }
})

const showDrawer = () => {
    drawerVisible.value = true
}

//切换模式
const changeMode = () => {
    if (componentName.value == markRaw(Account)) {
        componentName.value = markRaw(Network)
    } else if (componentName.value == markRaw(Network)) {
        componentName.value = markRaw(Account)
    }
}


</script>