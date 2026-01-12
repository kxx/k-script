class Store {
    constructor() {
        this.prefix = 'etax_helper_'
    }

    getEtax(key=''){
        let item = localStorage.getItem(key)
        if (!item) {
            return ''
        }
        try {
            return JSON.parse(item)
        } catch (e) {
            return item;
        }
    }

    getItem(key = '') {
       return this.getEtax(this.prefix +key);
    }

    setItem(key = '', value) {
        localStorage.setItem(this.prefix +key, value instanceof Object ? JSON.stringify(value) : value)
    }

    removeItem(key){
        if(key==null || key == ''){
            return
        }
        localStorage.removeItem(this.prefix +key);
    }

    getCookies() {
        var cookieObj = {};
        var cookieStr = document.cookie;
        var cookieList = cookieStr.split(';');
        for(const cookie of cookieList){
            let _c = cookie.trim().split('=')
            cookieObj[_c[0]] = _c[1];
        }
        return cookieObj;
     }

     getCookie(key = '') {
        var cookieObj = this.getCookies();
        return cookieObj[key];
     }


}

export default  new Store()
