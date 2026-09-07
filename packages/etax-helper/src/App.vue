<template>
  <button ref="launcher" class="launcher" aria-label="打开 ETax 助手" :aria-expanded="visible" title="ETax 助手" @click="open"><Promotion/></button>
  <template v-if="visible">
    <div class="backdrop" @click="close"/>
    <aside ref="panel" class="panel" :style="{width: `${width}px`}" role="dialog" aria-modal="true" aria-label="ETax 助手" @keydown="onKeydown">
      <div class="resize-handle" role="separator" aria-label="调整面板宽度" aria-orientation="vertical" :aria-valuenow="width" :aria-valuemin="480" :aria-valuemax="1400" tabindex="0" @pointerdown="startResize" @keydown.left.prevent="resizeBy(40)" @keydown.right.prevent="resizeBy(-40)"/>
      <header class="panel-header">
        <div class="brand"><span class="brand-icon"><Promotion/></span><strong>ETax 助手</strong><span class="version">v{{ version }}</span></div>
        <div class="header-actions"><button class="icon-button" aria-label="设置" title="设置" @click="settings = !settings"><Setting/></button><button class="icon-button" aria-label="关闭助手" title="关闭" @click="close"><Close/></button></div>
      </header>
      <nav v-if="!settings" class="nav-tabs" aria-label="功能导航"><button v-for="item in tabs" :key="item.value" :class="{active:tab===item.value}" :aria-current="tab===item.value ? 'page' : undefined" @click="changeTab(item.value)">{{item.label}}</button></nav>
      <div class="panel-content"><Config v-if="settings" @back="settings=false"/><Account v-else-if="tab==='account'" @settings="settings=true"/><Network v-else/></div>
      <footer class="panel-footer"><span>{{region ? `当前地区 · ${getRegionLabel(region)}` : '当前页面'}}</span><span class="capture-state"><i :class="{paused:paused || runtime.xhr!=='ready' || runtime.fetch!=='ready'}"/>{{paused ? '采集已暂停' : captureLabel}}<span class="count">{{records.length}} / 50</span></span></footer>
    </aside>
  </template>
</template>
<script setup>
import { inject, ref, watch, nextTick, onBeforeUnmount } from 'vue';
import { Promotion, Setting, Close } from '@element-plus/icons-vue';
import Account from './components/Account.vue';
import Network from './components/Network.vue';
import Config from './components/Config.vue';
import { config, saveConfig } from './stores/config';
import { showError } from './utils/notice';
import { runtime, captureLabel } from './stores/runtime';
import { getRegion, getRegionLabel } from './config/platforms';
const version=__ETAX_VERSION__, region=getRegion(location.href), records=inject('records'), paused=inject('paused');
const visible=ref(false), settings=ref(false), launcher=ref(), panel=ref(), width=ref(Number(config.width)||720);
const tabs=[{value:'account',label:'账户'},{value:'network',label:'请求'}];
const tab=ref(['account','network'].includes(config.tab)?config.tab:/^(tpass|etax)\./.test(location.hostname)?'account':'network');
watch(()=>config.width,value=>width.value=Math.max(480,Math.min(1400,Number(value)||720)));
let previousFocus, stopResize=()=>{};
async function open(){previousFocus=document.activeElement;visible.value=true;await nextTick();panel.value?.querySelector('button')?.focus();}
function close(){stopResize();visible.value=false;settings.value=false;(previousFocus && previousFocus!==document.getElementById('etax-helper') ? previousFocus : launcher.value)?.focus();}
function changeTab(value){tab.value=value;try{saveConfig({tab:value});}catch{showError('无法保存面板偏好');}}
function persistWidth(){try{saveConfig({width:width.value});}catch{showError('无法保存面板宽度');}}
function resizeBy(amount){width.value=Math.max(480,Math.min(1400,width.value+amount));persistWidth();}
function startResize(event){
  if(event.button!==0)return;event.preventDefault();stopResize();
  const startX=event.clientX,startWidth=width.value,target=event.currentTarget;target.setPointerCapture(event.pointerId);
  const move=e=>{width.value=Math.max(480,Math.min(1400,startWidth+startX-e.clientX));};
  const end=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',end);if(target.hasPointerCapture(event.pointerId))target.releasePointerCapture(event.pointerId);persistWidth();stopResize=()=>{};};
  stopResize=end;target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);
}
function onKeydown(event){
  if(event.key==='Escape'){event.stopPropagation();close();return;}
  if(event.key!=='Tab')return;
  const nodes=[...panel.value.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
  const first=nodes[0],last=nodes.at(-1),current=panel.value.getRootNode().activeElement;
  if(event.shiftKey&&current===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&current===last){event.preventDefault();first?.focus();}
}
onBeforeUnmount(()=>stopResize());
</script>
