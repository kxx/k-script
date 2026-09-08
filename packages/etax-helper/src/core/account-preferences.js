const KEY='etax_helper_account_preferences';
const MAX_FAVORITES=200, MAX_RECENT=20, MAX_SCOPES=20;
const identifier=value=>typeof value==='string' && value.length>0 && value.length<=256;
export function accountId(row) {
  const value=row.cookieId;
  return typeof value==='string' && identifier(value) ? value : typeof value==='number' && Number.isSafeInteger(value) ? String(value) : '';
}
export function uniqueAccountIds(rows) {
  const counts=new Map();
  for(const row of rows){const id=accountId(row);if(id)counts.set(id,(counts.get(id)||0)+1);}
  return new Set([...counts].filter(([,count])=>count===1).map(([id])=>id));
}
export async function accountScope(area,apiKey,crypto) {
  const bytes=new TextEncoder().encode(JSON.stringify([area,apiKey]));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export function createAccountPreferences({getValue,setValue,now=Date.now}) {
  function read() {
    const value=getValue(KEY,null);
    if(value==null)return {schemaVersion:1,scopes:{}};
    const invalid=()=>{throw Error('账户偏好格式不兼容，已保留原数据，请恢复兼容版本后重试');};
    if(value.schemaVersion!==1 || !value.scopes || typeof value.scopes!=='object' || Array.isArray(value.scopes) || Object.keys(value.scopes).length>MAX_SCOPES)invalid();
    for(const [key,scope] of Object.entries(value.scopes)) {
      if(!/^[a-f0-9]{64}$/.test(key)|| !scope || !Array.isArray(scope.favorites)||scope.favorites.length>MAX_FAVORITES||!scope.favorites.every(identifier)||new Set(scope.favorites).size!==scope.favorites.length||!Array.isArray(scope.recent)||scope.recent.length>MAX_RECENT||!scope.recent.every(r=>r&&identifier(r.id)&&Number.isFinite(r.at)&&r.at>=0)||new Set(scope.recent.map(r=>r.id)).size!==scope.recent.length)invalid();
    }
    return value;
  }
  function scopeOf(data,key){if(!/^[a-f0-9]{64}$/.test(key))throw Error('账户上下文不可用');return data.scopes[key]||{favorites:[],recent:[]};}
  return {
    load(key){return scopeOf(read(),key);},
    change(key,action,id){
      const data=read(),previous=scopeOf(data,key);
      if(!data.scopes[key] && Object.keys(data.scopes).length>=MAX_SCOPES)throw Error('账户偏好空间已达上限，未写入新账户来源');
      const scope={...previous,favorites:[...previous.favorites],recent:[...previous.recent]};
      if(action==='clearRecent')scope.recent=[];
      else {
        if(!identifier(id))throw Error('缺少稳定账户标识');
        if(action==='favorite'){
          const index=scope.favorites.indexOf(id);
          if(index>=0)scope.favorites.splice(index,1);
          else {if(scope.favorites.length>=MAX_FAVORITES)throw Error('最多收藏 200 个账户，请先取消其他收藏');scope.favorites.push(id);}
        } else if(action==='view')scope.recent=[{id,at:now()},...scope.recent.filter(item=>item.id!==id)].slice(0,MAX_RECENT);
        else throw Error('未知账户偏好操作');
      }
      setValue(KEY,{...data,scopes:{...data.scopes,[key]:scope}});
      return scope;
    },
  };
}
export function arrangeAccounts(rows,scope,mode) {
  const unique=uniqueAccountIds(rows), favorites=new Set(scope.favorites);
  const recent=new Map(scope.recent.map((item,index)=>[item.id,index]));
  const validId=row=>unique.has(accountId(row))?accountId(row):'';
  return rows.filter(row=>mode==='favorites'?favorites.has(validId(row)):mode==='recent'?recent.has(validId(row)):true)
    .sort((a,b)=>mode==='recent'?recent.get(validId(a))-recent.get(validId(b)):Number(favorites.has(validId(b)))-Number(favorites.has(validId(a))));
}
