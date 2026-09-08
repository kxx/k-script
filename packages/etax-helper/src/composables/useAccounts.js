import {computed, onMounted, onBeforeUnmount, reactive, toRefs, watch} from 'vue';
import {config} from '../stores/config';
import support from '../services/support';
import {useAccountPreferences} from './useAccountPreferences';
import {createAccountQuery, filterAccounts} from '../services/accounts';
export function useAccounts(area) {
  const state = reactive({rows: [], loading: false, error: ''});
  const preferences=useAccountPreferences(area,toRefs(state).rows);
  const search=computed({get:()=>preferences.view.search,set:value=>preferences.view.search=value});
  const query = createAccountQuery({state, load: support.getAccount, getContext: () => ({area, apiKey: config.apiKey})});
  onMounted(query.refresh);
  watch(() => config.apiKey, () => { query.invalidate(); query.refresh(); });
  onBeforeUnmount(query.dispose);
  return {...toRefs(state), search, preferences, filtered: computed(() => filterAccounts(preferences.arranged.value, search.value)), refresh: query.refresh};
}
