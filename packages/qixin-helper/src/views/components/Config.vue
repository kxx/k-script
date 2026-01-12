<template>
  <ElForm :model="configForm" label-width="auto" size="small">
    <ElFormItem label="API Key">
      <ElInput v-model="configForm.apiKey" />
    </ElFormItem>
    <ElFormItem label="新标签页">
      <ElSwitch v-model="configForm.newTab" />
    </ElFormItem>
    <ElFormItem>
      <ElButton @click="closeConfig">取消</ElButton>
      <ElButton type="primary" @click="saveConfig">确定</ElButton>
    </ElFormItem>
  </ElForm>
</template>

<script setup>
import { ref, reactive, onMounted, toRaw } from "vue";
import { ElForm, ElFormItem, ElInput, ElButton, ElSwitch } from 'element-plus'
import { showSuccess, showError } from "../../utils/notice";
import store from '../../utils/store'

const emit = defineEmits([ "close" ]);

const configForm = reactive({
  apiKey: '',
  newTab: false
})

onMounted(() => {
  initConfig()
})


async function initConfig() {
  let config = store.getItem('config');
  configForm.apiKey = config.apiKey || '';
  configForm.newTab = config.newTab || false;
}

const saveConfig = () => {
  store.setItem('config', toRaw(configForm))
  showSuccess('配置保存成功')
  closeConfig()
}

const closeConfig = () =>{
  emit('close')
}

</script>

<style scoped>
</style>
