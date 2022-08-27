const { excSQL } = require('../db/mysql'),
      { run, RegExpStr } = require('../utils/tools'),
      joi = require('joi');

const goodsList = (req) => {
    let userId = req.params.userId;
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配'))
    },{
        userId
    }).then(() => {
        let sql = `select id,name from cotton where userId='${userId}' and isnull(state)`;
        return excSQL(sql).then((result) => {
            return result;
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const addGoods = (req) => {
    let reqBody = req.body;
    return run({
        name: joi.string().max(45).required().error(new Error('品种名格式不正确')),
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配'))
    },{
        name: reqBody.name,
        userId: reqBody.userId
    }).then(() => {
        let sql = `select id,state from cotton where userId='${reqBody.userId}' and name=${connection.escape(reqBody.name)}`;
        return excSQL(sql).then((result) => {
            if(result.length) {
                if(result[0].state === null) return Promise.reject('品种名已存在！');
                sql = `update cotton set state=null where id='${result[0].id}'`;
            } else sql = `insert into cotton(id,userId,name,stockState) values(uuid(),'${reqBody.userId}',${connection.escape(reqBody.name)},0)`;
            return excSQL(sql);
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const removeGoods = (req) => {
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        id: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法'))
    },{
        userId: req.params.userId,
        id: req.params.id
    }).then(() => {
        let sql = `update cotton set state=0 where id='${req.params.id}' and userId='${req.params.userId}'`;
        return excSQL(sql);
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const stockList = (req) => {
    let userId = req.params.userId;
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配'))
    },{
        userId
    }).then(() => {
        let sql = `select id,name,stock from cotton where userId='${userId}' and isnull(stockState)`;
        return excSQL(sql).then((result) => {
            return result;
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const updateStock = (req) => {
    let reqBody = req.body;
    return run({
        stock: joi.string().regex(RegExpStr.decimal).required().error(new Error('数量格式不正确')),
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        id: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法'))
    },{
        stock: reqBody.stock,
        userId: reqBody.userId,
        id: reqBody.id
    }).then(() => {
        let sql = `update cotton set stock=${reqBody.stock},stockState=null where id='${reqBody.id}' and userId='${reqBody.userId}'`;
        return excSQL(sql);
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const removeStock = (req) => {
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        id: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法'))
    },{
        userId: req.params.userId,
        id: req.params.id
    }).then(() => {
        let sql = `update cotton set stock=null,stockState=0 where id='${req.params.id}' and userId='${req.params.userId}'`;
        return excSQL(sql);
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

module.exports = {
    goodsList,
    addGoods,
    removeGoods,
    stockList,
    updateStock,
    removeStock
};