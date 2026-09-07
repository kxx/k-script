import { GM_xmlhttpRequest } from '$';
import { config } from '../stores/config';
import { createRequest } from './request';
const request = createRequest(GM_xmlhttpRequest, () => config);
export default {
  getAccount: params => request('getAccount', params),
  getCookie: cookieId => request('getCookie', cookieId),
  // Preserve the existing server authentication contract.
  decryptJmbw: params => request('decryptJmbw', params, { auth: false })
};
