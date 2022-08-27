import request from './Request';
import store from '../store';

class WebApi {
    private static inst: WebApi;

    public static get Instance(): WebApi {
        return this.inst || (this.inst = new this());
    }

    public userId() {
        return (store.state.user as any)?.id;
    }

    public user = {
        register: (body: any) => {
            return request('post', 'register', JSON.stringify(body));
        },
        login: (body: any) => {
            return request('post', 'login', JSON.stringify(body));
        },
        checkLogin: (body: any) => {
            return request('post', 'checkLogin', JSON.stringify(body));
        }
    }

    public goods = {
        list: () => {
            return request('get', `goodsList/${this.userId()}`, undefined, {cancel: 'goods/list'});
        },
        add: (body: any) => {
            body.userId = this.userId();
            return request('post', 'addGoods', JSON.stringify(body));
        },
        remove: (id: string) => {
            return request('delete', `removeGoods/${id}/${(store.state.user as any)?.id}`);
        }
    }

    public party = {
        list: () => {
            return request('get', `partyList/${this.userId()}`, undefined, {cancel: 'party/list'});
        },
        add: (body: any) => {
            body.userId = this.userId();
            return request('post', 'addParty', JSON.stringify(body));
        },
        remove: (id: string) => {
            return request('delete', `removeParty/${id}/${(store.state.user as any)?.id}`);
        }
    }

    public stock = {
        list: () => {
            return request('get', `stockList/${this.userId()}`, undefined, {cancel: 'stock/list'});
        },
        update: (body: any) => {
            body.userId = this.userId();
            return request('put', 'updateStock', JSON.stringify(body));
        },
        remove: (id: string) => {
            return request('delete', `removeStock/${id}/${(store.state.user as any)?.id}`);
        }
    }

    public deal = {
        list: (query: any) => {
            query = Object.assign({userId: this.userId()}, query || {} );
            const queryStr = Object.keys(query).filter((key) => query[key] != undefined).map((key: string) => `${key}=${query[key]}`).join('&');  
            return request('get', `dealList?${queryStr}`, undefined, {cancel: 'deal/list'});
        },
        add: (body: any) => {
            body.userId = this.userId();
            return request('post', 'addDeal', JSON.stringify(body));
        },
        update: (body: any) => {
            body.userId = this.userId();
            return request('put', 'updateDeal', JSON.stringify(body));
        },
        remove: (body: any) => {
            body.userId = this.userId();
            return request('patch', 'removeDeal', JSON.stringify(body));
        }
    }
}

const Services = WebApi.Instance;

export default Services;