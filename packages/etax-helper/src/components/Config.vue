<template>
  <section class="workspace"><div class="subheading"><button class="back-button" @click="$emit('back')"><ArrowLeft/>返回</button></div>
    <div class="form-page"><div class="page-heading"><h2>设置</h2><p>管理账户连接和面板偏好。</p></div>
      <ElForm label-position="top" @submit.prevent="save">
        <ElFormItem label="API Key"><ElInput v-model="form.apiKey" type="password" show-password clearable autocomplete="off" placeholder="填写账户服务的 API Key"/><p class="field-note">仅保存在脚本管理器中。</p></ElFormItem>
        <div class="setting-row"><div><strong>在新标签页打开</strong><p>手动登录时保留当前页面</p></div><ElSwitch v-model="form.newTab" aria-label="在新标签页打开"/></div>
        <div class="setting-row"><div><strong>面板宽度</strong><p>也可以拖动面板左边缘调整</p></div><ElInputNumber v-model="form.width" :min="480" :max="1400" :step="40" aria-label="面板宽度"/></div>
        <div class="form-actions"><ElButton type="primary" @click="save">保存设置</ElButton></div>
      </ElForm>
    </div>
  </section>
</template>
<script setup>
import {reactive} from 'vue';
import {ArrowLeft} from '@element-plus/icons-vue';
import {ElForm,ElFormItem,ElInput,ElSwitch,ElInputNumber,ElButton} from 'element-plus';
import {config,saveConfig} from '../stores/config';
import {showSuccess,showError} from '../utils/notice';
defineEmits(['back']);
const form=reactive({apiKey:config.apiKey,newTab:config.newTab,width:config.width});
function save(){try{saveConfig({...form,apiKey:form.apiKey.trim(),width:form.width||720});showSuccess('设置已保存');}catch{showError('设置保存失败，请检查脚本管理器权限');}}
</script>
