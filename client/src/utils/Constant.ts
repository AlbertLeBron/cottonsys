import store from '../store/index';
import router from '../router/index';
import { EventBus } from '../EventBus';
import { isObj, isJSON, sortByStr, RegExpTest } from './Tools';
import api from '../api';

export const reloadGoods = (fn?: Function) => {
    api.goods.list().then((response) => {
        if(isObj(response)) {
            const data: any = response.data;
            if(Array.isArray(data)) {
                const goodsTypes = store.state.goodsTypes;
                if(Array.isArray(goodsTypes)) {
                    (goodsTypes as any[]).splice(0, (goodsTypes as any[]).length, ...sortByStr(data.map((item: any) => {return {id: item.id, name: item.name}})));
                } else store.commit('setGoodsTypes', sortByStr(data.map((item: any) => {return {id: item.id, name: item.name}})));
            }
        }
        fn && fn();
    }, () => {
        fn && fn();
    });
}

export const reloadParty = (fn?: Function) => {
    api.party.list().then((response) => {
        if(isObj(response)) {
            const data: any = response.data;
            if(Array.isArray(data)) {
                const parties = store.state.parties;
                if(Array.isArray(parties)) {
                    (parties as any[]).splice(0, (parties as any).length, ...sortByStr(data.map((item: any) => {return {id: item.id, name: item.name}})));
                } else store.commit('setParties', sortByStr(data.map((item: any) => {return {id: item.id, name: item.name}})));
            }
        }
        fn && fn();
    }, () => {
        fn && fn();
    });
}

export const loginState = () => {
    let storageUser: any = localStorage.getItem('user'), status;
    storageUser = isJSON(storageUser) ? JSON.parse(storageUser) : null;
    const storageUserExist = Boolean(storageUser && storageUser.id && storageUser.name && storageUser.token),
          storeUserExist = Boolean(store.state.user);
    if(!storeUserExist && !storageUserExist) {
        status = 0; //Vuex和storage都不存在User信息
    } else if(storeUserExist && storageUserExist) {
        status = 1; //Vuex和storage都存在User信息
    } else if(storeUserExist) {
        status = 2; //Vuex存在，storage不存在
    } else status = 3; //Vuex不存在，storage存在
    return {status: status, storeUser: store.state.user, storageUser: storageUser};
}

export const clearLoginState = () => {
    store.commit('setLoginChecked', 0);
    store.commit('setUser', null);
    localStorage.removeItem('user');
}

export const logout = () => {
    clearLoginState();
    router.push('/');
    location.reload();
}

export const getToken = () => {
    const storeToken: string = (store.state.user as any)?.token;
    let storageUser: any = localStorage.getItem('user');
    storageUser = isJSON(storageUser) ? JSON.parse(storageUser) : null;
    return storeToken && storeToken === storageUser?.token ? storeToken : undefined;
}

export const addGoodsType = (inputDom: HTMLInputElement) => {
    const name = inputDom.value;
    let message!: string;
    if(!name) {
        message = '请先在输入框内填入需要添加的品种名称！';
    } else if(name.length > 45) {
        message = '已超出45个字的限制！';
    } else if(RegExpTest('sql', name)) {
        message = '名称中存在不规范的文字或符号，请重新填写！';
    }
    
    if(message) {
        EventBus.$emit('showAlert', {title: `添加品种`, content: message});
    } else {
        EventBus.$emit('showAlert', {title: `添加品种`, content: `将添加“${name}”为新品种，是否确定？`, 
                                  actions: [{text: '确定', callback: () => {
                                    EventBus.$emit('addProgress', '添加品种中...');
                                    api.goods.add({name}).then(() => {
                                        EventBus.$emit('removeProgress', '添加品种中...');
                                        EventBus.$emit('addToast', { state: 'ok', content: '添加成功!'});
                                        reloadGoods();
                                    },(error) => {
                                        EventBus.$emit('removeProgress', '添加品种中...');
                                        if(isObj(error) && error.message) {
                                            EventBus.$emit('addToast', { state: 'error', content: error.message});
                                        }else EventBus.$emit('addToast', { state: 'error', content: '添加失败!'}); 
                                    });                                            
                                  }}]});
    }
}

export const removeGoodsType = (item: any) => {
    EventBus.$emit('showAlert', {title: `删除品种`, content: `将从品种名单中删除“${item.name}”，是否确定？`, 
                                  actions: [{text: '确定', callback: () => {
                                    EventBus.$emit('addProgress', '删除品种中...');
                                    api.goods.remove(item.id).then(() => {
                                        EventBus.$emit('removeProgress', '删除品种中...');
                                        EventBus.$emit('addToast', { state: 'ok', content: '删除成功!'});
                                        reloadGoods();
                                    },(error) => {
                                        EventBus.$emit('removeProgress', '删除品种中...');
                                        if(isObj(error) && error.message) {
                                            EventBus.$emit('addToast', { state: 'error', content: error.message});
                                        }else EventBus.$emit('addToast', { state: 'error', content: '删除失败!'}); 
                                    });                                             
                                  }}]});
}

export const addParty = (inputDom: HTMLInputElement) => {
    const name = inputDom.value;
    let message!: string;
    if(!name) {
        message = '请先在输入框内填入需要添加的交易方名称！';
    } else if(name.length > 45) {
        message = '名称中存在不规范的文字或符号，请重新填写！';
    } else if(RegExpTest('sql', name)) {
        message = '名称中存在不规范的文字或符号，请重新填写！';
    }
    
    if(message) {
        EventBus.$emit('showAlert', {title: `添加品种`, content: message});
    } else {
        EventBus.$emit('showAlert', {title: `添加交易方`, content: `将添加“${name}”到交易方名单里，是否确定？`, 
                                  actions: [{text: '确定', callback: () => {
                                    EventBus.$emit('addProgress', '添加交易方中...');
                                    api.party.add({name}).then(() => {
                                        EventBus.$emit('removeProgress', '添加交易方中...');
                                        EventBus.$emit('addToast', { state: 'ok', content: '添加成功!'});
                                        reloadParty();
                                    },(error) => {
                                        EventBus.$emit('removeProgress', '添加交易方中...');
                                        if(isObj(error) && error.message) {
                                            EventBus.$emit('addToast', { state: 'error', content: error.message});
                                        }else EventBus.$emit('addToast', { state: 'error', content: '添加失败!'}); 
                                    });
                                  }}]});
    }
}

export const removeParty = (item: any) => {
    EventBus.$emit('showAlert', {title: `删除交易方`, content: `将从交易方名单中删除“${item.name}”，是否确定？`, 
                                  actions: [{text: '确定', callback: () => {
                                    EventBus.$emit('addProgress', '删除交易方中...');
                                    api.party.remove(item.id).then(() => {
                                        EventBus.$emit('removeProgress', '删除交易方中...');
                                        EventBus.$emit('addToast', { state: 'ok', content: '删除成功!'});
                                        reloadParty();
                                    },(error) => {
                                        EventBus.$emit('removeProgress', '删除交易方中...');
                                        if(isObj(error) && error.message) {
                                            EventBus.$emit('addToast', { state: 'error', content: error.message});
                                        }else EventBus.$emit('addToast', { state: 'error', content: '删除失败!'}); 
                                    });                                            
                                  }}]});
}