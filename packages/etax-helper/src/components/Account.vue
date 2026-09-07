<template>
  <section class="workspace">
    <template v-if="!manual">
      <div class="toolbar"><ElInput v-model="search" clearable placeholder="搜索税号、企业名称、Cookie ID" :prefix-icon="Search"/><ElButton :icon="Refresh" :loading="loading" aria-label="刷新账户" @click="refresh"/><ElButton type="primary" @click="manual=true">手动登录</ElButton></div>
      <div v-if="!config.apiKey" class="empty-state"><span class="empty-icon"><User/></span><h3>连接你的账户</h3><p>配置 API Key 后查看账户，或直接使用手动登录。</p><ElButton type="primary" plain @click="emit('settings')">去配置</ElButton></div>
      <template v-else>
        <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
        <ElTable :data="filtered" height="100%" class="data-table" empty-text="暂无匹配账户" size="small">
          <ElTableColumn prop="company" label="企业名称" min-width="180"/>
          <ElTableColumn prop="taxNo" label="税号" min-width="170"/>
          <ElTableColumn prop="user" label="用户" min-width="90"/>
          <ElTableColumn label="状态" width="90"><template #default="{row}"><span class="neutral-status">{{row.statusText}}</span></template></ElTableColumn>
        </ElTable>
      </template>
    </template>
    <template v-else>
      <div class="subheading"><button class="back-button" @click="manual=false;reset()"><ArrowLeft/>返回账户</button></div>
      <div class="form-page"><div class="page-heading"><h2>手动登录</h2><p>选择业务平台，填写对应的登录凭据。</p></div>
      <ElForm label-position="top" @submit.prevent="login">
        <ElFormItem label="业务平台"><ElRadioGroup v-model="form.platform"><ElRadioButton v-for="item in platforms" :key="item.value" :label="item.value">{{item.label}}</ElRadioButton></ElRadioGroup></ElFormItem>
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
import { openInTab } from '../core/userscript';
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElAlert, ElInput, ElButton, ElTable, ElTableColumn, ElForm, ElFormItem, ElRadioGroup, ElRadioButton } from 'element-plus';
import { config } from '../stores/config';
import support from '../services/support';
import { getRegion, getPlatformUrl, platforms } from '../config/platforms';
import { writeLoginCookies } from '../core/cookies';
import { showError } from '../utils/notice';
const emit = defineEmits(['settings']);
const manual = ref(false);
const area = getRegion(location.href), search = ref(''), rows = ref([]), loading = ref(false), error = ref(''), submitting = ref(false), loginMessage = ref('');
const form = reactive({platform: 'home', tpassToken: '', checkToken: '', dzfpToken: ''});
let active = true;
onBeforeUnmount(() => { active = false; reset(); });
const filtered = computed(() => rows.value.filter(row => [row.taxNo, row.company, row.cookieId].some(value => String(value ?? '').toLowerCase().includes(search.value.trim().toLowerCase()))));
async function refresh() {
  if (loading.value) return;
  error.value = ''; rows.value = [];
  if (!config.apiKey) return;
  if (!area) { error.value = '无法识别地区，请在电局、Tpass 或发票平台页面查询账户'; return; }
  loading.value = true;
  try {
    const data = await support.getAccount({areaName: area});
    if (!Array.isArray(data?.workspaces)) throw new Error('账户数据格式不符合预期，请检查服务返回值');
    if (active) rows.value = data.workspaces.map(row => ({...row, taxNo: row.nsrsbh ?? row.name ?? '', company: row.nsrmc ?? row.name2 ?? '', user: row.username ?? row.name3 ?? '', statusText: row.status ?? '未校验'}));
  } catch (e) { if (active) error.value = e.message; } finally { loading.value = false; }
}
function reset() { form.tpassToken = ''; form.checkToken = ''; form.dzfpToken = ''; loginMessage.value = ''; }
function login() {
  if (submitting.value) return;
  submitting.value = true; loginMessage.value = '';
  try {
    const url = getPlatformUrl(area, form.platform);
    writeLoginCookies(form, {document, clientId: localStorage.getItem('clientId') || ''});
    if (config.newTab) openInTab(url, {active: true}); else location.assign(url);
    reset(); loginMessage.value = 'Cookie 已写入并通过读取检查。登录是否有效，请以目标页面结果为准。';
  } catch (e) { showError(e.message); } finally { submitting.value = false; }
}
onMounted(refresh);
</script>
