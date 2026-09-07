<template>
  <section class="account">
    <div class="toolbar"><ElInput v-model="search" clearable placeholder="搜索税号、企业名称、Cookie ID"/><ElButton :loading="loading" @click="refresh">刷新</ElButton></div>
    <ElAlert v-if="!config.apiKey" title="请先在设置中填写 API Key，再刷新账户列表。手动登录无需 API Key。" type="info" :closable="false"/>
    <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
    <ElTable :data="filtered" max-height="300" size="small" empty-text="暂无账户">
      <ElTableColumn prop="taxNo" label="税号" min-width="160"/>
      <ElTableColumn prop="company" label="名称" min-width="140"/>
      <ElTableColumn prop="user" label="用户" min-width="90"/>
      <ElTableColumn prop="statusText" label="状态" min-width="90"/>
      <ElTableColumn label="操作" width="190"><template #default><ElButton size="small" disabled>校验</ElButton><ElButton size="small" disabled>DTA / BIM / RIM</ElButton></template></ElTableColumn>
    </ElTable>
    <p class="hint">自动校验及 DTA / BIM / RIM 授权尚未接通，请使用下方手动登录。</p>
    <h3>手动登录 <small>{{ area || '未识别地区' }}</small></h3>
    <ElForm label-width="110px" size="small" @submit.prevent="login">
      <ElFormItem label="平台"><ElRadioGroup v-model="form.platform"><ElRadioButton v-for="item in platforms" :key="item.value" :label="item.value">{{ item.label }}</ElRadioButton></ElRadioGroup></ElFormItem>
      <template v-if="form.platform === 'dppt'">
        <ElFormItem label="CheckToken"><ElInput v-model="form.checkToken" type="password" show-password autocomplete="off"/></ElFormItem>
        <ElFormItem label="DzfpToken"><ElInput v-model="form.dzfpToken" type="password" show-password autocomplete="off"/></ElFormItem>
      </template>
      <ElFormItem v-else label="TpassToken"><ElInput v-model="form.tpassToken" type="password" show-password autocomplete="off"/></ElFormItem>
      <p v-if="['zhcx','ckts'].includes(form.platform)" class="hint">沿用统一登录入口，登录后请在电局中进入对应业务。</p>
      <ElFormItem><ElButton type="primary" :loading="submitting" :disabled="!area" @click="login">写入并打开</ElButton><ElButton @click="reset">重置</ElButton></ElFormItem>
    </ElForm>
    <ElAlert v-if="loginMessage" :title="loginMessage" type="info" :closable="false"/>
  </section>
</template>
<script setup>
import { GM_openInTab } from '$';
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElAlert, ElInput, ElButton, ElTable, ElTableColumn, ElForm, ElFormItem, ElRadioGroup, ElRadioButton } from 'element-plus';
import { config } from '../stores/config';
import support from '../services/support';
import { getRegion, getPlatformUrl, platforms } from '../config/platforms';
import { writeLoginCookies } from '../core/cookies';
import { showError } from '../utils/notice';
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
    if (config.newTab) GM_openInTab(url, {active: true}); else location.assign(url);
    reset(); loginMessage.value = 'Cookie 已写入并通过读取检查。登录是否有效，请以目标页面结果为准。';
  } catch (e) { showError(e.message); } finally { submitting.value = false; }
}
onMounted(refresh);
</script>
