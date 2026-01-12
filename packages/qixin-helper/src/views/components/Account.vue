<template>
    <div class="table-container">
        <ElTable ref="tableRef" :data="tableData" height="100%" size="small">
            <ElTableColumn prop="name" label="税号" />
            <ElTableColumn prop="name2" label="名称" />
            <ElTableColumn prop="name3" label="用户" />
            <ElTableColumn prop="name3" label="状态" />
            <ElTableColumn prop="op" width="100px">
                <template #header>
                    <ElInput v-model="search" size="small" placeholder="nsrsbh、cookieId" />
                </template>
                <template #default="scope">
                    <ElButton size="small" text>校验</ElButton>
                    <ElButton size="small" text type="danger" @click.prevent="handleAuth(scope.row, 'dta')">DTA</ElButton>
                    <ElButton size="small" text type="danger" @click.prevent="handleAuth(scope.row, 'bim')">BIM</ElButton>
                    <ElButton size="small" text type="danger" @click.prevent="handleAuth(scope.row, 'rim')">RIM</ElButton>
                </template>
            </ElTableColumn>
        </ElTable>

        <ElPopover placement="top" :width="600" trigger="click">
            <template #reference>
                <ElButton class="mt-1" style="margin-top: 6px;">手动登录</ElButton>
            </template>
            <ElForm ref="formRef" :model="cookieForm" :rules="rules" label-width="100px" size="small">
                <ElFormItem v-if="['home','zhcx','ckts'].includes(cookieForm.platform)" label="TpassToken" prop="tpassToken">
                    <ElInput v-model="cookieForm.tpassToken"/>
                </ElFormItem>
                <ElFormItem v-if="['dppt'].includes(cookieForm.platform)" label="CheckToken" prop="checkToken">
                    <ElInput v-model="cookieForm.checkToken"/>
                </ElFormItem>
                <ElFormItem v-if="['dppt'].includes(cookieForm.platform)" label="DzfpToken" prop="dzfpToken">
                    <ElInput v-model="cookieForm.dzfpToken"/>
                </ElFormItem>
                <ElFormItem label="Platform" prop="platform">
                    <ElRadioGroup radio-group v-model="cookieForm.platform">
                        <ElRadioButton label="home">新版首页</ElRadioButton>
                        <ElRadioButton label="dppt">发票业务</ElRadioButton>
                        <ElRadioButton label="zhcx">账户查询</ElRadioButton>
                        <ElRadioButton label="ckts">退税管理</ElRadioButton>
                    </ElRadioGroup>
                </ElFormItem>
                <ElFormItem>
                    <ElButton type="primary" @click="onSubmit">确定</ElButton>
                    <ElButton @click="resetForm">重置</ElButton>
                </ElFormItem>
            </ElForm>
        </ElPopover>
    </div>
</template>

<script setup>
import { GM_openInTab } from '$';
import { ref, onMounted, reactive, toRaw } from "vue";
//import 'element-plus/dist/index.css'
import { ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElPopover, ElRadioGroup, ElRadioButton } from 'element-plus'
import supportService from '../service/support-service'
//import { showSuccess, showError } from "../../utils/notice";
import { setEtaxCookie, setDpptCookie } from "../../utils/cookie";
import store from '../../utils/store'


const search = ref('')

const areaName = ref('')

const tableRef = ref(null)

const tableData = ref([]);

const formRef = ref(null)

const cookieForm = reactive({
    area: '',
    tpassToken: '',
    checkToken: '',
    dzfpToken: '',
    platform: 'home'
})

const rules = {
    tpassToken: [{ required: true, message: "TpassToken不能为空", trigger: "blur" }],
    checkToken: [{ required: true, message: "CheckToken不能为空", trigger: "blur" }],
    dzfpToken: [{ required: true, message: "DzfpToken不能为空", trigger: "blur" }],
}


onMounted(() => {
    initParams()
    handleFilter()
})

const initParams = () => {
    let url = window.location.href || '';
    areaName.value = (url.match(/\.(.*?)\./) || [])[1] || '';
    cookieForm.area = areaName.value
}

async function handleFilter() {
    const apiKey = store.getItem('config').apiKey || ''
    if (apiKey === '') {
        return
    }

    const result = JSON.parse(await supportService.getAccount({ areaName: areaName.value }));

    if (result.code == 0) {
        tableData.value = result.data.workspaces;
    } else {
        console.log(result.msg || result.error)
    }
}

async function onSubmit() {
    formRef.value.validate((valid) => {
        if (!valid) {
            return;
        }
        switch (cookieForm.platform) {
            case 'home':
            case 'zhcx':
            case 'ckts':
                setEtaxCookie(toRaw(cookieForm))
                openEtaxPage(cookieForm.platform);
                break;
            case 'dppt':
                setDpptCookie(toRaw(cookieForm))
                openDpptPage(cookieForm.platform)
                break;
        }
    })
}
const resetForm = () => {
    formRef.value.resetFields()
}

async function handleAuth(row, ptdm) {
    const result = JSON.parse(await supportService.getCookie(row.cookieId));

    if (result.code == 0) {
        // setCookies(result.data);
        // openDpptPage(ptdm);
    } else {
        console.log(result.msg || result.error)
    }
}

//打开页面
const openEtaxPage = (ptdm) => {
    let url = 'https://etax.' + areaName.value + '.chinatax.gov.cn:8443/loginb/'
    GM_openInTab(url, { active: true });
}

const openDpptPage = (ptdm) => {
    let url = 'https://dppt.' + areaName.value + '.chinatax.gov.cn:8443/invoice-business'
    GM_openInTab(url, { active: true });
}

</script>

<style scoped>
.table-container {
display: flex;
flex-direction: column;
height: 100%;
}
</style>