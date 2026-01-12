import { GM_cookie } from '$';

const etaxDomain = 'etax.$area.chinatax.gov.cn';
const initPath = '/';
const initDomain = '.chinatax.gov.cn';


let setDpptCookie = (params) => {
  try {
    setCookieByDocument('SSO_SECURITY_CHECK_TOKEN', params.checkToken, '', initPath, initDomain, true)
    setCookieByDocument('dzfp-ssotoken', params.dzfpToken, '', initPath, initDomain, true)
    setCookieByDocument('security-token-key', 'dzfp-ssotoken', '', initPath, initDomain, false)
  } catch {

  }
}

let setEtaxCookie = (params) => {
  let clientId = localStorage.clientId || '';
  let name = 'tpass_'+ clientId;
  setCookieByDocument(name, params.tpassToken, '', initPath, initDomain, false)
}

let setCookieByDocument = (name, value, expires, path, domain, secure) => {
  var cookieText = encodeURIComponent(name) + '=' + encodeURIComponent(value);
  if (expires instanceof Date) {
    cookieText += '; expires=' + expires;
  }
  if (path) {
    cookieText += '; path=' + path;
  }
  if (domain) {
    cookieText += '; domain=' + domain;
  }
  if (secure) {
    cookieText += '; secure';
  }
  document.cookie = cookieText;
  console.log('Cookie set successfully : ' + name);
}

let setCookiesByGm = (name, value, expires, path, domain, secure) => {
  cookies.forEach((item) => {
    GM_cookie.set({
      url: "etax.jiangsu.chinatax.gov.cn",
      name: name,
      value: value,
      domain: domain,
      path: path,
      secure: secure
    }, function (error) {
      if (error) {
        console.error(error);
      } else {
        console.log('Cookie set successfully : ' + item.name);
      }
    })

  })
}

export {
  setEtaxCookie,
  setDpptCookie
}
