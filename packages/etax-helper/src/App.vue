<template>
  <ElButton class="launcher" type="primary" @click="visible = !visible">ETax</ElButton>
  <ElDrawer v-model="visible" :append-to="overlay" :size="`min(${config.width}px, 96vw)`" title="ETax 助手" :destroy-on-close="false">
    <div class="tabs"><ElRadioGroup v-model="tab" @change="changeTab"><ElRadioButton label="account">账户</ElRadioButton><ElRadioButton label="network">请求</ElRadioButton><ElRadioButton label="settings">设置</ElRadioButton></ElRadioGroup><span>v{{ version }}</span></div>
    <Account v-if="tab === 'account'"/><Network v-else-if="tab === 'network'"/><Config v-else/>
  </ElDrawer>
</template>
<script setup>
import { inject, ref } from 'vue';
import { ElButton, ElDrawer, ElRadioGroup, ElRadioButton } from 'element-plus';
import Account from './components/Account.vue';
import Network from './components/Network.vue';
import Config from './components/Config.vue';
import {config, saveConfig} from './stores/config';
import {showError} from './utils/notice';
const version = __ETAX_VERSION__, overlay = inject('overlay'), visible = ref(false);
const tab = ref(['account','network','settings'].includes(config.tab) ? config.tab : /^(tpass|etax)\./.test(location.hostname) ? 'account' : 'network');
function changeTab(value) { try { saveConfig({tab:value}); } catch { showError('无法保存面板偏好'); } }
</script>
