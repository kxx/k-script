<template>
    <div class="table-container">
        <ElTable ref="netWorkRef" :data="tableData" highlight-current-row height="100%" size="small">
            <ElTableColumn type="index" width="50" />
            <ElTableColumn prop="url" label="接口" :formatter="urlFormatter" />
            <ElTableColumn prop="method" label="方法" width="70" />
            <ElTableColumn prop="status" label="状态" width="60" />
            <ElTableColumn fixed="right" label="操作" width="100">
                <template #default="scope">
                    <ElButton link type="primary" size="small" @click="viewRequest(scope.row)">参数</ElButton>
                    <ElButton link type="primary" size="small" @click="viewResponse(scope.row)">响应</ElButton>
                </template>
            </ElTableColumn>
        </ElTable>
        <ElButton class="mt-4" style="margin-top: 6px;" @click="handleClear">清空</ElButton>

        <ElDialog v-model="dialogVisible" :title="viewTitle" :close-on-click-modal="false" width="35%" class="viewDialog">
            <span>{{ viewContent }}</span>
        </ElDialog>
    </div>
</template>

<script setup>
import { monkeyWindow } from '$';
import {ref, onMounted, toRaw, defineExpose } from "vue";
//import 'element-plus/dist/index.css'
import { ElTable, ElTableColumn, ElButton, ElDialog } from 'element-plus'
import supportService from '../service/support-service'
import { showSuccess, showError } from "../../utils/notice";
import store from '../../utils/store'

const tableData = ref([])

const dialogVisible = ref(false)

const viewTitle = ref('')
const viewContent = ref('')
const dzfpSsotoken = ref('')

onMounted(() => {
    xhrListener()

    dzfpSsotoken.value = store.getCookie('dzfp-ssotoken')
})

//请求监听
function xhrListener() {
  monkeyWindow.m_log = monkeyWindow.console.log;
  monkeyWindow.m_log('开启请求监听');

  const originalXhrOpen = monkeyWindow.XMLHttpRequest.prototype.open;

  monkeyWindow.XMLHttpRequest.prototype.open = function (method, url) {
    const xhr = this;
    const originalXhrSend = xhr.send;
    xhr.send = function (data) {
      const requestData = {
        method,
        url,
        data,
        date:new Date().toLocaleTimeString()
      };

      xhr.addEventListener('load', function () {
        const responseData = {
          status: xhr.status,
          response: xhr.responseText,
        };
        insertRequest(Object.assign({},requestData,responseData))
      });

      originalXhrSend.call(xhr, data);
    };
    originalXhrOpen.apply(this, arguments);
  };
}

function insertRequest(request) {
      
  if (!request || request.url.includes('/v1/report')) return;

  tableData.value.unshift(request);

  // 控制数组长度不超过50
  if (tableData.value.length > 50) {
    tableData.value.pop(); // 移除末尾元素
  }
}

function urlFormatter(row, column, cellValue, index) {
    return cellValue.split('?')[0];
}

async function viewRequest(row) {
    
    viewTitle.value = '负载'
    viewContent.value = ''
    dialogVisible.value = true

    let rowObj = toRaw(row);

    if (rowObj && rowObj.deData) {
        viewContent.value = rowObj.deData
        return
    }
    if (rowObj && rowObj.data && rowObj.data.includes('Jmbw')) {
        let params = {}
        params.url = row.url.split('?')[0]
        params.token = dzfpSsotoken.value
        params.jmbw = JSON.parse(row.data)['Jmbw']

        let res = await supportService.decryptJmbw(params);
    
        const result = JSON.parse(res)
        if (result.code == 0) {
            viewContent.value = result.data.params
            row.deData = result.data.params
        } else {
            showError(result.msg || result.error)
        }
    } else {
        viewContent.value = row.data
    }
}

function viewResponse(row) {
    viewTitle.value = '响应'
    viewContent.value = JSON.parse(row.response)
    dialogVisible.value = true
}

function handleClear() {
    tableData.value = []
}

</script>

<style scoped>

.table-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    }

.viewDialog span {
    word-break: normal;
    width: auto;
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: hidden;
}
</style>