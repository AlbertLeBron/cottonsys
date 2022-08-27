import { Decimal } from 'decimal.js'

export const guid = (): string => {
    return ('' + [1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, ch => {
        const c: number = Number(ch);
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
    });
}

export const debounce = (func: any, wait: number, context: any) => {
    let timeOut: any;
    return function (...args: any[]) {
        if (timeOut) clearTimeout(timeOut);
        timeOut = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

export const throttle = (func: any, wait: number, context: any) => {
    let timeOut: any;
    return function (...args: any[]) {
        if (timeOut) {
            return;
        }
        timeOut = setTimeout(() => {
            func.apply(context, args);
            timeOut = null;
        }, wait);
    };
}

export const isJSON = (str: any) => {
	if (typeof str === 'string') {
    try {
        const obj = JSON.parse(str);
        if(typeof obj === 'object' && obj){
            return true;
        }else{
            return false;
        }
    } catch(e) {
        return false;
    }
	}
	return false;
}

export const isObj = (obj: any) => {
    return Boolean(Object.prototype.toString.call(obj) === '[object Object]' && obj !== null);
}

export const sortByStr = (data: any[]) => {
    return data.sort((a: any, b: any) => { return (a.name as string).toLocaleLowerCase() > b.name.toLocaleLowerCase() ? 1 : -1; });
}

export const RegExpTest = (type: string, field: string) => {
    let regexp!: RegExp;
    switch(type) {
        case 'posInt': 
            regexp = /^([1-9]\d*|[0]{1,1})$/;
            break;
        case 'sql':
            regexp = /select|update|delete|truncate|join|union|exec|insert|drop|count|'|"|;|>|<|%/i;
            break;
        case 'decimal':
            regexp = /^(([1-9]{1}[0-9]{0,7})|([0]{1}))((\.{1}[0-9]{1,6}$)|$)/;
            break;
    }
    return regexp?.test(field);
}

export const MathAdd = (x: number, y: number) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.plus(yy).toNumber();
}
		
export const MathSubtr = (x: number, y: number) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.minus(yy).toNumber();
}
 
export const MathMul = (x: number, y: number) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.mul(yy).toNumber();
}
 
export const MathDiv = (x: number, y: number) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.div(yy).toNumber();
}

export const dateFormat = (date: Date, type?: 'pure' | 'hyphen') => {
    const units = date.toLocaleDateString().split('/');
    units[1] = Number(units[1]) < 10 ? '0'+units[1] : units[1];
    units[2] = Number(units[2]) < 10 ? '0'+units[2] : units[2];
    return type === 'pure' ? units.join('') : units.join('-');
}