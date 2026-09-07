import {computed, onMounted, onBeforeUnmount, reactive, ref, toRefs, watch} from 'vue';
import {config} from '../stores/config';
import support from '../services/support';
import {createAccountQuery, filterAccounts} from '../services/accounts';
export function useAccounts(area) {
  const search = ref(''), state = reactive({rows: [], loading: false, error: ''});
  const query = createAccountQuery({state, load: support.getAccount, getContext: () => ({area, apiKey: config.apiKey})});
  onMounted(query.refresh);
  watch(() => config.apiKey, () => { query.invalidate(); query.refresh(); });
  onBeforeUnmount(query.dispose);
  return {...toRefs(state), search, filtered: computed(() => filterAccounts(state.rows, search.value)), refresh: query.refresh};
}
