<template>
  <section>
    <div class="toolbar"><ElInput v-model="query" placeholder="搜索接口 URL" clearable/><ElSelect :teleported="false" v-model="filter" style="width:130px"><ElOption label="全部请求" value="all"/><ElOption label="失败请求" value="error"/><ElOption label="GET" value="GET"/><ElOption label="POST" value="POST"/></ElSelect></div>
    <div class="toolbar"><ElButton @click="toggle">{{ paused ? '继续记录' : '暂停记录' }}</ElButton><ElButton @click="collector.clear">清空</ElButton><span>{{ paused ? '已暂停' : '正在记录' }} · {{ records.length }}/50 条</span></div>
    <ElTable :data="filtered" max-height="500" size="small" empty-text="暂无请求；打开面板前已完成的采集也会显示">
      <ElTableColumn prop="url" label="接口" min-width="220"/>
      <ElTableColumn prop="method" label="方法" width="75"/>
      <ElTableColumn label="状态" width="100"><template #default="{row}">{{ row.status || row.outcome }}</template></ElTableColumn>
      <ElTableColumn label="耗时" width="90"><template #default="{row}">{{ row.duration }} ms</template></ElTableColumn>
      <ElTableColumn label="操作" width="120"><template #default="{row}"><ElButton link type="primary" @click="view(row,'request')">参数</ElButton><ElButton link type="primary" @click="view(row,'response')">响应</ElButton></template></ElTableColumn>
    </ElTable>
    <ElDialog v-model="visible" :append-to="overlay" width="min(850px, 94vw)" :title="kind === 'request' ? '请求参数' : '响应内容'" @closed="invalidate">
      <div class="toolbar"><ElButton @click="copy">复制（脱敏）</ElButton><ElButton v-if="encrypted" type="primary" :loading="decrypting" @click="decrypt">解密参数</ElButton></div>
      <p v-if="encrypted" class="hint">解密会向 skynjweb.com 发送该请求的 Token 与密文。</p>
      <ElAlert v-if="error" :title="error" type="error" :closable="false"/>
      <pre>{{ content }}</pre>
    </ElDialog>
  </section>
</template>
<script setup>
import { computed, inject, onBeforeUnmount, ref, shallowRef } from 'vue';
import { ElTable, ElTableColumn, ElButton, ElDialog, ElInput, ElSelect, ElOption, ElAlert } from 'element-plus';
import { GM_setClipboard } from '$';
import support from '../services/support';
import { format, redact } from '../utils/format';
import { showSuccess, showError } from '../utils/notice';
const collector = inject('collector'), overlay = inject('overlay'), records = inject('records'), paused = inject('paused');
const query = ref(''), filter = ref('all'), visible = ref(false), kind = ref(''), selected = shallowRef(null), content = ref(''), error = ref(''), decrypting = ref(false);
let revision = 0;
const filtered = computed(() => records.value.filter(row => row.url.toLowerCase().includes(query.value.toLowerCase()) && (filter.value === 'all' || (filter.value === 'error' ? row.status >= 400 || row.outcome !== '完成' : row.method === filter.value))));
const encrypted = computed(() => { if (kind.value !== 'request') return ''; try { return JSON.parse(selected.value?.data).Jmbw || ''; } catch { return ''; } });
function toggle() { paused.value = !paused.value; collector.setPaused(paused.value); }
function invalidate() { revision++; decrypting.value = false; }
function view(row, type) { invalidate(); selected.value = row; kind.value = type; error.value = ''; content.value = format(type === 'request' ? row.data : row.response); visible.value = true; }
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
function copy() { try { GM_setClipboard(redact(content.value)); showSuccess('已复制，常见敏感字段已脱敏'); } catch { showError('复制失败，请检查剪贴板权限'); } }
onBeforeUnmount(invalidate);
</script>
