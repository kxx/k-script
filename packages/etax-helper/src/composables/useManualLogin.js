import {onBeforeUnmount, reactive, ref} from 'vue';
import {config} from '../stores/config';
import {openInTab} from '../core/userscript';
import {createManualLogin} from '../services/manual-login';
import {showError} from '../utils/notice';
export function useManualLogin(area) {
  const form = reactive({platform: 'home', tpassToken: '', checkToken: '', dzfpToken: ''});
  const submitting = ref(false), loginMessage = ref('');
  const execute = createManualLogin({document, getClientId: () => localStorage.getItem('clientId'), openInTab, navigate: url => location.assign(url)});
  function reset() { form.tpassToken = ''; form.checkToken = ''; form.dzfpToken = ''; loginMessage.value = ''; }
  function login() {
    if (submitting.value) return;
    submitting.value = true; loginMessage.value = '';
    try {
      const message = execute(form, {area, newTab: config.newTab});
      reset(); loginMessage.value = message;
    } catch (error) { showError(error.message); }
    finally { submitting.value = false; }
  }
  onBeforeUnmount(reset);
  return {form, submitting, loginMessage, reset, login};
}
