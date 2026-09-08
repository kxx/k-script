<template>
  <section class="workspace"><div class="subheading"><button class="back-button" @click="$emit('back')"><ArrowLeft/>返回</button></div>
    <div class="form-page"><div class="page-heading"><h2>设置</h2><p>管理账户连接和面板偏好。</p></div>
      <ElAlert v-if="storageWarning" :title="storageWarning" type="warning" :closable="false"/>
      <ElForm label-position="top" @submit.prevent="save">
        <ElFormItem label="API Key"><ElInput v-model="form.apiKey" type="password" show-password clearable autocomplete="off" placeholder="填写账户服务的 API Key"/><p class="field-note">仅保存在脚本管理器中。</p></ElFormItem>
        <div class="setting-row"><div><strong>在新标签页打开</strong><p>手动登录时保留当前页面</p></div><ElSwitch v-model="form.newTab" aria-label="在新标签页打开"/></div>
        <div class="setting-row"><div><strong>面板宽度</strong><p>也可以拖动面板左边缘调整</p></div><ElInputNumber v-model="form.width" :min="480" :max="1400" :step="40" aria-label="面板宽度"/></div>
        <div class="form-actions"><ElButton type="primary" @click="save">保存设置</ElButton></div>
      </ElForm>
      <section class="release-info" aria-label="版本与更新">
        <div class="setting-row"><strong>版本与更新</strong><span>v{{version}}</span></div>
        <div class="release-links"><a :href="installUrl" target="_blank" rel="noopener noreferrer">检查更新</a><a :href="changelogUrl" target="_blank" rel="noopener noreferrer">更新说明</a><a :href="historyUrl" target="_blank" rel="noopener noreferrer">历史版本</a></div>
        <p class="field-note">检查更新将打开安装页，由油猴比较版本并确认安装；安装后请刷新电局页面。</p>
        <p class="field-note">回退前保留配置备份，并在油猴中暂停此脚本的自动更新。旧版提示配置不兼容时，请恢复新版，勿重置配置。</p>
      </section>
      <Diagnostics @config-reloaded="syncForm"/>
    </div>
  </section>
</template>
<script setup>
import Diagnostics from './Diagnostics.vue';
import {installUrl,changelogUrl,historyUrl} from '../config/release';
const version=__ETAX_VERSION__;
import {reactive} from 'vue';
import {ArrowLeft} from '@element-plus/icons-vue';
import {ElAlert,ElForm,ElFormItem,ElInput,ElSwitch,ElInputNumber,ElButton} from 'element-plus';
import {config,saveConfig,storageWarning} from '../stores/config';
import {showSuccess,showError} from '../utils/notice';
defineEmits(['back']);
const form=reactive({apiKey:config.apiKey,newTab:config.newTab,width:config.width});
function syncForm(){Object.assign(form,{apiKey:config.apiKey,newTab:config.newTab,width:config.width});}
function save(){try{saveConfig({...form,apiKey:form.apiKey.trim(),width:form.width||720});showSuccess('设置已保存');}catch{showError(storageWarning.value || '设置保存失败，请重试');}}
</script>
