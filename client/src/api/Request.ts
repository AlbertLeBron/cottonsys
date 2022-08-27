import axios from 'axios';
import store from '../store/index';
import { getToken, logout } from '../utils/Constant';

const req = axios.create({
        baseURL: 'http://119.3.144.14:8090/api',
        timeout: 20000
    }), axiosSources: any[] = [];

req.interceptors.request.use((config: any) => {
    config.headers['Content-Type'] = 'application/json;charset=utf-8';
    const token = getToken();
    if(token) config.headers['authorization'] = 'Bearer ' + token;  // 设置请求头
    return config;
}, error => {
    return Promise.reject(error);
});

req.interceptors.response.use(
    response => {
        let res = response.data;

        if (response.config.responseType === 'blob') {
            return res;
        }

        if (typeof res === 'string') {
            res = res ? JSON.parse(res) : res;
        }
        return res;
    },
    error => {
        const err = error.response.data;
        console.log('err' + err) // for debug
        if(error.response.status === 401) logout();
        return Promise.reject(err)
    }
);

const request = (type: 'get' | 'post' | 'put' | 'patch' | 'delete', url: string, body?: string, options?: any) => {
    const cancel: any = options?.cancel, opts: any = {};
    let currentAxiosSource!: any;
    if (cancel) {
        const formerAxiosSourceIndex = axiosSources.findIndex((p: any) => p.cancel === cancel);
        if (formerAxiosSourceIndex > -1) {
            axiosSources[formerAxiosSourceIndex].source.cancel('Operation canceled due to new request.')
            axiosSources.splice(formerAxiosSourceIndex, 1);
        }
        currentAxiosSource = { cancel: cancel, source: axios.CancelToken.source() }
        axiosSources.push(currentAxiosSource);
        opts.cancelToken = currentAxiosSource.source.token;
    }

    let response!: Promise<any>;
    switch (type) {
        case 'get': response = req.get(url, opts).then((response: any) => {
                        const currentAxiosSourceIndex = axiosSources.indexOf(currentAxiosSource);
                        if (currentAxiosSourceIndex > -1) axiosSources.splice(currentAxiosSourceIndex, 1);
                        return response;
                    }).catch((thrown: any) => {
                        if (cancel && axios.isCancel(thrown)) {
                            console.log('请求已取消');
                        } else {
                            throw thrown;
                        }
                    });
                    break;
        case 'post': response = req.post(url, body, opts);break;
        case 'put': response = req.put(url, body, opts);break;
        case 'patch': response = req.patch(url, body, opts);break;
        case 'delete': response = req.delete(url, opts);break;
    }
    return response;
}

export default request;