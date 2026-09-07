import { xmlHttpRequest } from '../core/userscript';
import { config } from '../stores/config';
import { createRequest } from './request';
const request = createRequest(xmlHttpRequest, () => config);
export default {
  getAccount: params => request('getAccount', params),
  getCookie: cookieId => request('getCookie', cookieId),
  // Preserve the existing server authentication contract.
  decryptJmbw: params => request('decryptJmbw', params, { auth: false })
};
