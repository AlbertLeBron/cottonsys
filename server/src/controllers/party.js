const { excSQL } = require('../db/mysql'),
      { run, RegExpStr } = require('../utils/tools'),
      joi = require('joi');

const partyList = (req) => {
    let userId = req.params.userId;
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配'))
    },{
        userId
    }).then(() => {
        let sql = `select id,name from party where userId='${userId}' and isnull(state)`;
        return excSQL(sql).then((result) => {
            return result;
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const addParty = (req) => {
    let reqBody = req.body;
    return run({
        name: joi.string().max(45).required().error(new Error('交易方名格式不正确')),
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配'))
    },{
        name: reqBody.name,
        userId: reqBody.userId
    }).then(() => {
        let sql = `select id,state from party where userId='${reqBody.userId}' and name=${connection.escape(reqBody.name)}`;
        return excSQL(sql).then((result) => {
            if(result.length) {
                if(result[0].state === null) return Promise.reject('交易方名已存在！');
                sql = `update party set state=null where id='${result[0].id}'`;
            } else sql = `insert into party(id,userId,name) values(uuid(),'${reqBody.userId}',${connection.escape(reqBody.name)})`;
            return excSQL(sql);
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const removeParty = (req) => {
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        id: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法'))
    },{
        userId: req.params.userId,
        id: req.params.id
    }).then(() => {
        let sql = `update party set state=0 where id='${req.params.id}' and userId='${req.params.userId}'`;
        return excSQL(sql);
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

module.exports = {
    partyList,
    addParty,
    removeParty
};