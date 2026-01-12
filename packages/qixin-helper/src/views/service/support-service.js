import { GM_xmlhttpRequest } from '$';
import store from '../../utils/store'

const supportService = {
    baseUrl: "https://skynjweb.com:7443/dppt/ac-api/support",

    async getAccount(params) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url:`${this.baseUrl}/getAccount`,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-API-Key': store.getItem('config').apiKey||''
                },
                data: JSON.stringify(params),
                onload: function(response) {
                    resolve(response.responseText);
                  },
                  onerror: function(response) {
                    reject(response.statusText)  
                  }
            });
        })
    },

    async getCookie(params) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url:`${this.baseUrl}/getCookie`,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-API-Key': store.getItem('config').apiKey||''
                },
                data: JSON.stringify(params),
                onload: function(response) {
                    resolve(response.responseText);
                  },
                  onerror: function(response) {
                    reject(response.statusText)  
                  }
            });
        })
    },
   
     async decryptJmbw(params) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url:`${this.baseUrl}/decryptJmbw`,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8'
                },
                data: JSON.stringify(params),
                onload: function(response) {
                    resolve(response.responseText);
                  },
                  onerror: function(response) {
                    reject(response.statusText)  
                  }
            });
        })
    },
}

export default supportService;