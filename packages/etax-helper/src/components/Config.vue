<template>
  <ElForm label-width="110px" @submit.prevent="save">
    <ElFormItem label="API Key"><ElInput v-model="form.apiKey" type="password" show-password autocomplete="off"/></ElFormItem>
    <ElFormItem label="新标签页"><ElSwitch v-model="form.newTab"/></ElFormItem>
    <ElFormItem label="面板宽度"><ElInputNumber v-model="form.width" :min="480" :max="1400" :step="40"/></ElFormItem>
    <ElFormItem><ElButton type="primary" @click="save">保存</ElButton></ElFormItem>
    <p>API Key 用于账户服务，保存在脚本管理器中。</p>
    <p>解密仅在点击“解密参数”时发送 Token 和密文至 skynjweb.com。</p>
  </ElForm>
</template>
<script setup>
import { reactive } from 'vue';
import { ElForm, ElFormItem, ElInput, ElSwitch, ElInputNumber, ElButton } from 'element-plus';
import { config, saveConfig } from '../stores/config';
import { showSuccess, showError } from '../utils/notice';
const form = reactive({apiKey: config.apiKey, newTab: config.newTab, width: config.width});
function save() { try { saveConfig({...form, apiKey: form.apiKey.trim(), width: form.width || 720}); showSuccess('配置保存成功'); } catch { showError('配置保存失败，请检查脚本管理器权限'); } }
</script>
