import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        // 每次刷新页面或初次加载页面会验证登录状态：
        // 0.不在验证，1.正在验证。
        // 单纯作为防止多次调用登录接口的标志位。
        loginChecked: 0, 
        user: null,
        pageSize: 20,
        goodsTypes: null,
        parties: null,
        stock: null,
        stockLoading: false
    },
    mutations:{
        setUser(state, user){
            state.user = user;
        },
        setGoodsTypes(state, goods){
            state.goodsTypes = goods;
        },
        setParties(state, party){
            state.parties = party;
        },
        setStock(state, stock){
            state.stock = stock;
        },
        setStockLoading(state, stockLoading){
            state.stockLoading = stockLoading;
        },
        setLoginChecked(state, loginChecked) {
            state.loginChecked = loginChecked;
        }
    },
    actions:{
        
    },
    getters: {

    }
})