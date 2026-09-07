<template>
  <section class="workspace">
    <template v-if="!visible">
      <div class="toolbar request-toolbar"><ElInput v-model="query" placeholder="搜索接口路径" clearable :prefix-icon="Search"/><ElSelect :teleported="false" v-model="filter" class="request-filter" aria-label="请求筛选"><ElOption label="全部请求" value="all"/><ElOption label="失败请求" value="error"/><ElOption label="GET" value="GET"/><ElOption label="POST" value="POST"/></ElSelect><ElButton :icon="paused?VideoPlay:VideoPause" :title="paused?'继续记录':'暂停记录'" :aria-label="paused?'继续记录':'暂停记录'" @click="toggle"/><ElButton :icon="Delete" title="清空请求" aria-label="清空请求" @click="collector.clear"/></div>
      <ElTable :data="filtered" height="100%" class="data-table request-table" size="small" empty-text="等待请求，业务操作后将在这里显示" @row-click="row=>view(row,'request')">
        <ElTableColumn label="接口路径" min-width="250"><template #default="{row}"><button class="request-path" :title="row.url" @click.stop="view(row,'request')">{{pathOf(row.url)}}</button></template></ElTableColumn>
        <ElTableColumn label="方法" width="85"><template #default="{row}"><span class="method" :class="{post:row.method==='POST'}">{{row.method}}</span></template></ElTableColumn>
        <ElTableColumn label="状态" width="90"><template #default="{row}"><span class="status" :class="{error:failed(row)}">{{row.status || row.outcome}}</span></template></ElTableColumn>
        <ElTableColumn label="耗时" width="90" align="right"><template #default="{row}"><span class="duration">{{row.duration}} <small>ms</small></span></template></ElTableColumn>
      </ElTable>
    </template>
    <template v-else>
      <div class="subheading"><button class="back-button" @click="visible=false;invalidate()"><ArrowLeft/>返回请求列表</button></div>
      <div class="request-summary"><span class="method" :class="{post:selected.method==='POST'}">{{selected.method}}</span><span class="status" :class="{error:failed(selected)}">{{selected.status || selected.outcome}}</span><span class="duration">{{selected.duration}} ms</span><p>{{selected.url}}</p></div>
      <div class="detail-toolbar"><div class="detail-tabs"><button :class="{active:kind==='request'}" @click="changeKind('request')">参数</button><button :class="{active:kind==='response'}" @click="changeKind('response')">响应</button></div><div class="detail-actions"><ElButton v-if="encrypted" type="primary" plain size="small" :loading="decrypting" @click="decrypt">解密参数</ElButton><ElButton size="small" :icon="CopyDocument" @click="copy">复制（脱敏）</ElButton></div></div>
      <p v-if="encrypted" class="decrypt-note">解密时向 skynjweb.com 发送本次请求的 Token 与密文。</p>
      <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
      <pre class="code-view"><code><span v-for="(token,index) in highlighted" :key="index" :class="token.type">{{token.text}}</span></code></pre>
    </template>
  </section>
</template>
<script setup>
import { computed, inject, onBeforeUnmount, ref, shallowRef, toRaw } from 'vue';
import { ElTable, ElTableColumn, ElButton, ElInput, ElSelect, ElOption, ElAlert } from 'element-plus';
import { Search, VideoPause, VideoPlay, Delete, ArrowLeft, CopyDocument } from '@element-plus/icons-vue';
import { highlightJson } from '../utils/highlight';
import { setClipboard } from '../core/userscript';
import support from '../services/support';
import { format, redact } from '../utils/format';
import { showSuccess, showError } from '../utils/notice';
const collector = inject('collector'), records = inject('records'), paused = inject('paused');
const query = ref(''), filter = ref('all'), visible = ref(false), kind = ref(''), selected = shallowRef(null), content = ref(''), error = ref(''), decrypting = ref(false);
let revision = 0;
const filtered = computed(() => records.value.filter(row => row.url.toLowerCase().includes(query.value.toLowerCase()) && (filter.value === 'all' || (filter.value === 'error' ? row.status >= 400 || row.outcome !== '完成' : row.method === filter.value))));
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
