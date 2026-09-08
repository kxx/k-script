import {computed,onBeforeUnmount,reactive,ref,watch} from 'vue';
import {config} from '../stores/config';
import {getValue,setValue} from '../core/userscript';
import {accountScope,accountId,uniqueAccountIds,arrangeAccounts,createAccountPreferences} from '../core/account-preferences';
import {showError} from '../utils/notice';
// Search and filter survive tab remounts only; never persist search text or API keys.
const view=reactive({apiKey:'',area:'',search:'',mode:'all'});
const repository=createAccountPreferences({getValue,setValue});
export function useAccountPreferences(area,rows) {
  const preferences=ref({favorites:[],recent:[]}),warning=ref(''),ready=ref(false);
  let scope='',revision=0;
  async function reload(){
    const id=++revision;scope='';ready.value=false;preferences.value={favorites:[],recent:[]};warning.value='';
    const apiKey=config.apiKey;
    if(view.apiKey!==apiKey || view.area!==area)Object.assign(view,{apiKey,area,search:'',mode:'all'});
    if(!apiKey||!area)return;
    try {
      const key=await accountScope(area,apiKey,crypto);
      if(id!==revision)return;
      const loaded=repository.load(key);scope=key;preferences.value=loaded;ready.value=true;
    }catch{if(id===revision)warning.value='账户偏好读取失败或格式不兼容，已保留原数据。可重试读取，账户查询仍可使用。';}
  }
  watch(()=>config.apiKey,reload,{immediate:true});
  onBeforeUnmount(()=>revision++);
  const unique=computed(()=>uniqueAccountIds(rows.value));
  const idOf=row=>unique.value.has(accountId(row))?accountId(row):'';
  function change(action,row){
    if(!ready.value)return;
    try{preferences.value=repository.change(scope,action,row?idOf(row):undefined);warning.value='';}
    catch(error){showError(error.message || '账户偏好保存失败，请重试');}
  }
  return {view,warning,ready,reload,idOf,preferences,
    favorite:row=>change('favorite',row),markViewed:row=>{if(idOf(row))change('view',row);},clearRecent:()=>change('clearRecent'),
    isFavorite:row=>preferences.value.favorites.includes(idOf(row)),
    arranged:computed(()=>arrangeAccounts(rows.value,preferences.value,view.mode)),
  };
}
