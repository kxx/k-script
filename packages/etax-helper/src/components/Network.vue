<template>
  <section class="workspace">
    <template v-if="!visible">
      <div class="toolbar request-toolbar"><ElInput v-model="query" placeholder="搜索接口路径" clearable :prefix-icon="Search"/><ElSelect :teleported="false" v-model="filter" class="request-filter" aria-label="请求筛选"><ElOption label="全部请求" value="all"/><ElOption label="失败请求" value="error"/><ElOption label="GET" value="GET"/><ElOption label="POST" value="POST"/></ElSelect><ElButton :icon="paused?VideoPlay:VideoPause" :title="paused?'继续记录':'暂停记录'" :aria-label="paused?'继续记录':'暂停记录'" @click="toggle"/><ElButton :icon="Delete" title="清空未固定请求" aria-label="清空请求" @click="collector.clear"/></div>
      <div class="request-views"><div class="detail-tabs"><button :class="{active:!grouped}" :aria-pressed="!grouped" @click="setGrouping(false)">逐条</button><button :class="{active:grouped}" :aria-pressed="grouped" @click="setGrouping(true)">按路径</button></div><button class="pin-filter" :aria-pressed="onlyPinned" @click="onlyPinned=!onlyPinned">仅固定 · {{pinCount}} / 10</button><ElButton v-if="pinCount" size="small" @click="clearAll">清空全部</ElButton></div>
      <div v-if="groupKey" class="group-heading"><button class="back-button" @click="groupKey=''">返回路径分组</button><span>{{groupKey}}</span></div>
      <ElTable v-if="grouped && !groupKey" :data="groups" height="100%" class="data-table request-table" size="small" empty-text="暂无匹配请求" @row-click="row=>groupKey=row.key">
        <ElTableColumn label="域名与路径" min-width="240"><template #default="{row}"><button class="request-path" :title="row.address" @click.stop="groupKey=row.key">{{row.address}}</button></template></ElTableColumn>
        <ElTableColumn prop="method" label="方法" width="85"/>
        <ElTableColumn label="次数" width="70"><template #default="{row}">{{row.records.length}}</template></ElTableColumn>
        <ElTableColumn prop="failures" label="失败" width="70"/>
      </ElTable>
      <ElTable v-else :data="displayed" height="100%" class="data-table request-table" size="small" empty-text="等待请求，业务操作后将在这里显示" @row-click="row=>view(row,'request')">
        <ElTableColumn label="固定" width="48"><template #default="{row}"><button class="pin-button" :class="{active:row.pinned}" :aria-label="row.pinned?'取消固定请求':'固定请求'" :aria-pressed="row.pinned" @click.stop="pin(row)"><StarFilled v-if="row.pinned"/><Star v-else/></button></template></ElTableColumn>
        <ElTableColumn label="接口路径" min-width="250"><template #default="{row}"><button class="request-path" :title="row.url" @click.stop="view(row,'request')">{{pathOf(row.url)}}</button><span v-if="incomplete(row)" class="capture-badge">内容不完整</span></template></ElTableColumn>
        <ElTableColumn label="方法" width="85"><template #default="{row}"><span class="method" :class="{post:row.method==='POST'}">{{row.method}}</span></template></ElTableColumn>
        <ElTableColumn label="状态" width="90"><template #default="{row}"><span class="status" :class="{error:failed(row)}">{{row.status || row.outcome}}</span></template></ElTableColumn>
        <ElTableColumn label="耗时" width="90" align="right"><template #default="{row}"><span class="duration">{{row.duration}} <small>ms</small></span></template></ElTableColumn>
      </ElTable>
    </template>
    <template v-else>
      <div class="subheading"><button class="back-button" @click="visible=false;invalidate()"><ArrowLeft/>返回请求列表</button></div>
      <div class="request-summary"><span class="method" :class="{post:selected.method==='POST'}">{{selected.method}}</span><span class="status" :class="{error:failed(selected)}">{{selected.status || selected.outcome}}</span><span class="duration">{{selected.duration}} ms</span><p>{{selected.url}}</p></div>
      <div class="detail-toolbar"><div class="detail-tabs"><button :class="{active:kind==='request'}" @click="changeKind('request')">参数</button><button :class="{active:kind==='response'}" @click="changeKind('response')">响应</button></div><div class="detail-actions"><ElButton size="small" :aria-pressed="selectedPinned" @click="pin(selected)">{{selectedPinned?'取消固定':'固定请求'}}</ElButton><ElButton size="small" @click="copyCurl">复制 cURL</ElButton><ElButton v-if="encrypted" type="primary" plain size="small" :loading="decrypting" @click="decrypt">解密参数</ElButton><ElButton size="small" :icon="CopyDocument" @click="copy">复制（脱敏）</ElButton></div></div>
      <p class="curl-note">cURL 为脱敏的 Bash 模板，未包含请求头及 Cookie；不完整请求体不导出。</p>
      <ElAlert v-if="captureNotice" :title="captureNotice" type="warning" :closable="false"/>
      <p v-if="encrypted" class="decrypt-note">解密时向 skynjweb.com 发送本次请求的 Token 与密文。</p>
      <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
      <pre class="code-view"><code><span v-for="(token,index) in highlighted" :key="index" :class="token.type">{{token.text}}</span></code></pre>
    </template>
  </section>
</template>
<script setup>
import { computed, inject, onBeforeUnmount, ref, shallowRef, toRaw } from 'vue';
import { ElTable, ElTableColumn, ElButton, ElInput, ElSelect, ElOption, ElAlert } from 'element-plus';
import { Search, VideoPause, VideoPlay, Delete, ArrowLeft, CopyDocument, Star, StarFilled } from '@element-plus/icons-vue';
import {groupRequests, createCurl, bodyNotice} from '../utils/request-tools';
import { highlightJson } from '../utils/highlight';
import { setClipboard } from '../core/userscript';
import support from '../services/support';
import { format, redact } from '../utils/format';
import { showSuccess, showError } from '../utils/notice';
const collector = inject('collector'), records = inject('records'), paused = inject('paused');
const query = ref(''), filter = ref('all'), visible = ref(false), kind = ref(''), selected = shallowRef(null), content = ref(''), error = ref(''), decrypting = ref(false);
const grouped = ref(false), onlyPinned = ref(false), groupKey = ref('');
const pinCount = computed(() => records.value.filter(row => row.pinned).length);
const selectedPinned = computed(() => records.value.some(row => row.id === selected.value?.id && row.pinned));
const groups = computed(() => groupRequests(filtered.value, location.href));
const displayed = computed(() => groupKey.value ? groups.value.find(group => group.key === groupKey.value)?.records || [] : filtered.value);
const captureNotice = computed(() => selected.value ? bodyNotice(kind.value === 'request' ? selected.value.requestBodyState : selected.value.responseBodyState, kind.value === 'request') : '');
function incomplete(row) { return ['truncated','limit','unavailable'].includes(row.requestBodyState) || ['truncated','limit','unavailable'].includes(row.responseBodyState); }
function setGrouping(value) { grouped.value=value; groupKey.value=''; }
function pin(row) { try { collector.togglePin(row.id); } catch(error) { showError(error.message); } }
function clearAll() { collector.clearAll(); groupKey.value=''; }
function copyCurl() { try { setClipboard(createCurl(selected.value, location.href)); showSuccess('已复制 cURL（Bash，脱敏模板）'); } catch(error) { showError(error.message || '复制失败，请检查剪贴板权限'); } }
let revision = 0;
const filtered = computed(() => records.value.filter(row => (!onlyPinned.value || row.pinned) && row.url.toLowerCase().includes(query.value.toLowerCase()) && (filter.value === 'all' || (filter.value === 'error' ? row.status >= 400 || row.outcome !== '完成' : row.method === filter.value))).sort((a,b) => Number(b.pinned) - Number(a.pinned)));
const highlighted = computed(() => highlightJson(content.value));
function pathOf(url) { try { return new URL(url, location.href).pathname; } catch { return url.split('?')[0]; } }
function failed(row) { return row.status >= 400 || row.outcome !== '完成'; }
function changeKind(type) { view(selected.value, type); }
const encrypted = computed(() => { if (kind.value !== 'request') return ''; try { return JSON.parse(selected.value?.data).Jmbw || ''; } catch { return ''; } });
function toggle() { paused.value = !paused.value; collector.setPaused(paused.value); }
function invalidate() { revision++; decrypting.value = false; }
function view(row, type) { invalidate(); selected.value = toRaw(row); kind.value = type; error.value = ''; content.value = format(type === 'request' ? row.data : row.response); visible.value = true; }
async function decrypt() {
  if (decrypting.value) return;
  const current = ++revision, row = selected.value, token = collector.getToken(row);
  if (!token) { error.value = '采集该请求时未读取到 dzfp-ssotoken，请登录后重新发起业务请求'; return; }
  decrypting.value = true; error.value = '';
  try {
    const data = await support.decryptJmbw({url: row.url.split('?')[0], token, jmbw: encrypted.value});
    if (current === revision && visible.value) {
      if (data?.params == null) throw new Error('解密服务未返回参数');
      content.value = format(data.params);
    }
  } catch (e) { if (current === revision && visible.value) error.value = e.message; } finally { if (current === revision) decrypting.value = false; }
}
function copy() { try { setClipboard(redact(content.value)); showSuccess('已复制，常见敏感字段已脱敏'); } catch { showError('复制失败，请检查剪贴板权限'); } }
onBeforeUnmount(invalidate);
</script>
