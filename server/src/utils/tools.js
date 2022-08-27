const joi = require('joi'),
      Decimal = require('decimal.js');

const RegExpStr = {
    uuid: /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/,
    decimal: /^(([1-9]{1}[0-9]{0,7})|([0]{1}))((\.{1}[0-9]{1,6}$)|$)/
}

const isObj = (obj) => {
    return Boolean(Object.prototype.toString.call(obj) === '[object Object]' && obj !== null);
}

const run = async (standardObj, realObj, jwtObj) => {
    try {
        if(!standardObj || !isObj(standardObj) || !realObj || !isObj(realObj)) return;

        const schema = joi.object(standardObj);
    
        let body = realObj;

        /*验证*/
        await schema.validateAsync(body, { allowUnknown: true, abortEarly: true }); 
    } catch (err) {
        return Promise.reject(err);
    }
}

const resSend = (res, blogData) => {
    res.end(JSON.stringify(blogData));
};

const MathAdd = (x, y) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.plus(yy).toNumber();
}
		
const MathSubtr = (x, y) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.minus(yy).toNumber();
}
 
const MathMul = (x, y) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.mul(yy).toNumber();
}
 
const MathDiv = (x, y) => {
    if (!x) x = 0;
    if (!y) y = 0;
    const xx = new Decimal(x), yy = new Decimal(y);
    return xx.div(yy).toNumber();
}

module.exports = {
    run,
    resSend,
    RegExpStr,
    isObj,
    MathAdd,
    MathSubtr,
    MathMul,
    MathDiv
};