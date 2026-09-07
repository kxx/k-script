<template>
  <section class="workspace account-workspace">
    <template v-if="!manual">
      <div class="toolbar"><ElInput v-model="search" clearable placeholder="搜索税号、企业名称、Cookie ID" :prefix-icon="Search"/><ElButton :icon="Refresh" :loading="loading" aria-label="刷新账户" @click="refresh"/><ElButton @click="manual=true">手动登录</ElButton></div>
      <div v-if="!config.apiKey" class="empty-state"><span class="empty-icon"><User/></span><h3>连接你的账户</h3><p>配置 API Key 后查看账户，或直接使用手动登录。</p><ElButton type="primary" @click="emit('settings')">配置账户服务</ElButton></div>
      <template v-else>
        <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
        <ElTable :data="filtered" height="100%" class="data-table" empty-text="暂无匹配账户" size="small">
          <ElTableColumn class-name="account-company" prop="company" label="企业名称" min-width="180"/>
          <ElTableColumn class-name="account-tax" prop="taxNo" label="税号" min-width="170"/>
          <ElTableColumn prop="user" label="用户" min-width="90"/>
          <ElTableColumn label="状态" width="90"><template #default="{row}"><span class="neutral-status">{{row.statusText}}</span></template></ElTableColumn>
        </ElTable>
      </template>
    </template>
    <template v-else>
      <div class="subheading"><button class="back-button" @click="manual=false;reset()"><ArrowLeft/>返回账户</button></div>
      <div class="form-page"><div class="page-heading"><h2>手动登录</h2><p>选择业务平台，填写对应的登录凭据。</p></div>
      <ElForm label-position="top" @submit.prevent="login">
        <ElFormItem label="业务平台"><ElRadioGroup v-model="form.platform" class="platform-switch"><ElRadioButton v-for="item in platforms" :key="item.value" :label="item.value">{{item.label}}</ElRadioButton></ElRadioGroup></ElFormItem>
        <template v-if="form.platform==='dppt'"><ElFormItem label="CheckToken"><ElInput v-model="form.checkToken" type="password" show-password clearable autocomplete="off" placeholder="输入 CheckToken"/></ElFormItem><ElFormItem label="DzfpToken"><ElInput v-model="form.dzfpToken" type="password" show-password clearable autocomplete="off" placeholder="输入 DzfpToken"/></ElFormItem></template>
        <ElFormItem v-else label="TpassToken"><ElInput v-model="form.tpassToken" type="password" show-password clearable autocomplete="off" placeholder="输入 TpassToken"/></ElFormItem>
        <p v-if="['zhcx','ckts'].includes(form.platform)" class="hint">登录后，请在电局统一入口进入对应业务。</p>
        <div class="form-actions"><ElButton type="primary" :loading="submitting" :disabled="!area" @click="login">写入并打开</ElButton><ElButton @click="reset">清空</ElButton></div>
      </ElForm><ElAlert v-if="loginMessage" :title="loginMessage" type="info" :closable="false"/></div>
    </template>
  </section>
</template>
<script setup>
import { Search, Refresh, User, ArrowLeft } from '@element-plus/icons-vue';
import { ref } from 'vue';
import { ElAlert, ElInput, ElButton, ElTable, ElTableColumn, ElForm, ElFormItem, ElRadioGroup, ElRadioButton } from 'element-plus';
import { config } from '../stores/config';
import { getRegion, platforms } from '../config/platforms';
import { useAccounts } from '../composables/useAccounts';
import { useManualLogin } from '../composables/useManualLogin';
const emit = defineEmits(['settings']);
const manual = ref(false), area = getRegion(location.href);
const {search, filtered, loading, error, refresh} = useAccounts(area);
const {form, submitting, loginMessage, reset, login} = useManualLogin(area);
</script>
