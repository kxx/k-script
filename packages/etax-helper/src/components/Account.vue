<template>
  <section class="workspace account-workspace">
    <template v-if="!manual && !selected">
      <div class="toolbar"><ElInput v-model="search" clearable placeholder="搜索税号、企业名称、Cookie ID（空格组合）" :prefix-icon="Search"/><ElButton :icon="Refresh" :loading="loading" aria-label="刷新账户" @click="refresh"/><ElButton @click="manual=true">手动登录</ElButton></div>
      <div v-if="!config.apiKey" class="empty-state"><span class="empty-icon"><User/></span><h3>连接你的账户</h3><p>配置 API Key 后查看账户，或直接使用手动登录。</p><ElButton type="primary" @click="emit('settings')">配置账户服务</ElButton></div>
      <template v-else>
        <div class="request-views"><div class="detail-tabs"><button v-for="item in accountFilters" :key="item.value" :class="{active:preferences.view.mode===item.value}" :aria-pressed="preferences.view.mode===item.value" @click="preferences.view.mode=item.value">{{item.label}}</button></div><ElButton v-if="preferences.view.mode==='recent'" size="small" :disabled="!ready" @click="preferences.clearRecent">清空最近查看</ElButton></div>
        <p v-if="preferences.view.mode==='recent'" class="field-note">仅记录主动查看账户，不代表登录成功；最多保留 20 条。</p>
        <ElAlert v-if="warning" :title="warning" type="warning" :closable="false"/><ElButton v-if="warning" size="small" @click="preferences.reload">重试读取账户偏好</ElButton>
        <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
        <ElTable :data="filtered" height="100%" class="data-table" :empty-text="loading?'正在加载账户…':error?'账户加载失败，请点击刷新重试':'暂无匹配账户'" size="small">
          <ElTableColumn label="收藏" width="52"><template #default="{row}"><button class="pin-button" :class="{active:preferences.isFavorite(row)}" :disabled="!ready || !preferences.idOf(row)" :title="preferences.idOf(row)?'收藏账户':'Cookie ID 缺失或重复，无法可靠关联收藏'" :aria-label="preferences.isFavorite(row)?'取消收藏账户':'收藏账户'" :aria-pressed="preferences.isFavorite(row)" @click="preferences.favorite(row)"><StarFilled v-if="preferences.isFavorite(row)"/><Star v-else/></button></template></ElTableColumn>
          <ElTableColumn class-name="account-company" prop="company" label="企业名称" min-width="180"/>
          <ElTableColumn class-name="account-tax" prop="taxNo" label="税号" min-width="170"/>
          <ElTableColumn prop="user" label="用户" min-width="90"/>
          <ElTableColumn label="状态" width="90"><template #default="{row}"><span class="neutral-status">{{row.statusText}}</span></template></ElTableColumn>
          <ElTableColumn label="操作" width="70"><template #default="{row}"><ElButton link size="small" @click="viewAccount(row)">查看</ElButton></template></ElTableColumn>
        </ElTable>
      </template>
    </template>
    <template v-else-if="selected">
      <div class="subheading"><button class="back-button" @click="selected=null"><ArrowLeft/>返回账户</button></div>
      <div class="form-page"><div class="page-heading"><h2>账户信息</h2><p>查看服务返回的信息，不校验登录状态。</p></div>
        <dl class="account-details"><template v-for="(value,label) in accountDetails" :key="label"><dt>{{label}}</dt><dd>{{value || '未提供'}}</dd></template></dl>
        <p v-if="!preferences.idOf(selected)" class="field-note">Cookie ID 缺失或重复，本次查看不计入最近记录。</p>
      </div>
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
import { Search, Refresh, User, ArrowLeft, Star, StarFilled } from '@element-plus/icons-vue';
import { ref, computed, watch } from 'vue';
import { ElAlert, ElInput, ElButton, ElTable, ElTableColumn, ElForm, ElFormItem, ElRadioGroup, ElRadioButton } from 'element-plus';
import { config } from '../stores/config';
import { getRegion, platforms } from '../config/platforms';
import { useAccounts } from '../composables/useAccounts';
import { useManualLogin } from '../composables/useManualLogin';
const emit = defineEmits(['settings']);
const manual = ref(false), area = getRegion(location.href);
const {search, filtered, loading, error, refresh, preferences} = useAccounts(area);
const {ready,warning}=preferences;
const selected=ref(null);
const accountFilters=[{value:'all',label:'全部账户'},{value:'favorites',label:'我的收藏'},{value:'recent',label:'最近查看'}];
const accountDetails=computed(()=>selected.value?{'企业名称':selected.value.company,'税号':selected.value.taxNo,'用户':selected.value.user,'Cookie ID':selected.value.cookieId,'状态':selected.value.statusText}:{});
function viewAccount(row){selected.value=row;preferences.markViewed(row);}
watch(()=>config.apiKey,()=>{selected.value=null;});
const {form, submitting, loginMessage, reset, login} = useManualLogin(area);
</script>
