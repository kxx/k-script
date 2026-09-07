<template>
  <details class="diagnostics">
    <summary>运行诊断</summary>
    <p class="field-note">仅在本机查看。复制内容不包含账户配置、请求内容或登录凭据。</p>
    <dl><template v-for="(value,key) in rows" :key="key"><dt>{{key}}</dt><dd>{{value}}</dd></template></dl>
    <div class="diagnostic-actions"><ElButton size="small" @click="retryConfig">重试读取配置</ElButton><ElButton size="small" @click="retryNetwork">重试请求采集</ElButton><ElButton size="small" @click="copy">复制诊断</ElButton></div>
  </details>
</template>
<script setup>
import {computed,inject} from 'vue';
import {ElButton} from 'element-plus';
import {runtime} from '../stores/runtime';
import {reloadConfig} from '../stores/config';
import {getEnvironment,setClipboard} from '../core/userscript';
import {getRegion} from '../config/platforms';
import {showSuccess,showError} from '../utils/notice';
const emit=defineEmits(['config-reloaded']);
const retryNetwork=inject('retryNetwork');
const labels={pending:'初始化中',ready:'正常',failed:'失败',unavailable:'不可用'};
const reasons={CONFIG_READ_FAILED:'读取失败，未写入配置',CONFIG_WRITE_FAILED:'写入失败',HOOK_INSTALL_FAILED:'页面接口未能安装',NETWORK_INIT_FAILED:'采集初始化失败',UI_RENDER_FAILED:'界面渲染失败',UI_MOUNT_FAILED:'界面挂载失败'};
const rows=computed(()=>{
  const env=getEnvironment();
  return {
    '脚本版本':__ETAX_VERSION__, '脚本管理器':`${env.manager} ${env.managerVersion}`,
    '地区':getRegion(location.href)||'未知', '页面框架':window===window.top?'顶层页面':'内嵌页面',
    // Origin only: paths can also carry account IDs and secrets.
    '页面来源':location.origin,
    '接口权限':Object.entries(env.apis).map(([key,value])=>`${key}: ${value?'可用':'缺失'}`).join('；'),
    '界面':labels[runtime.ui], '配置':labels[runtime.config],
    'XHR':labels[runtime.xhr], 'Fetch':labels[runtime.fetch],
    '最近内部错误':runtime.lastError?`${runtime.lastError.module}: ${reasons[runtime.lastError.reason]||'模块运行失败'}`:'无',
  };
});
function retryConfig(){if(reloadConfig()){emit('config-reloaded');showSuccess('已重新读取原配置');}else showError('配置仍无法读取，未写入任何设置');}
function copy(){try{setClipboard(JSON.stringify(rows.value,null,2),'text');showSuccess('诊断已复制');}catch{showError('无法复制诊断，请检查剪贴板权限');}}
</script>
