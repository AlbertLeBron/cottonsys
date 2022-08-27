const { excSQL } = require('../db/mysql'),
      { run } = require('../utils/tools'),
      bcrypt = require('bcryptjs'),
      { jwtSecret } = require('../config/jwt'),
      jwt = require('jsonwebtoken'),
      joi = require('joi');

const register = (req) => {
    let reqBody = req.body;
    
    return run({
        accountId: joi.string().max(45).required().error(new Error('用户名格式不正确')),
        password: joi.string().max(45).required().error(new Error('密码格式不正确')),
    },{
        accountId: reqBody.name,
        password: reqBody.password
    }).then(() => {
        let sql = `select accountId from user where accountId=${connection.escape(reqBody.name)}`;
        return excSQL(sql).then((result) => {
            if(result.length) {
                return Promise.reject('用户名已被注册！');
            } else {
                sql = `insert into user(id,accountId,password) values(uuid(),${connection.escape(reqBody.name)},'${bcrypt.hashSync(connection.escape(reqBody.password), 10)}')`;
                return excSQL(sql);
            }
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const login = (req) => {
    let reqBody = req.body;
    return run({
        accountId: joi.string().max(45).required().error(new Error('用户名格式不正确')),
        password: joi.string().max(45).required().error(new Error('密码格式不正确')),
    },{
        accountId: reqBody.name,
        password: reqBody.password
    }).then(() => {
        let sql = `select id,accountId,password from user where accountId=${connection.escape(reqBody.name)}`;
        return excSQL(sql).then((result) => {
            if(result.length && bcrypt.compareSync(connection.escape(reqBody.password), result[0].password)) {
                const token = jwt.sign({ id: result[0].id }, jwtSecret, { expiresIn: 60 * 60 * 24 });
                return {id: result[0].id, name: result[0].accountId, token: token};
            } else return Promise.reject('用户名或密码不正确！');
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const checkLogin = (req) => {
    let reqBody = req.body, user;
    try {
        user = jwt.verify(reqBody.token, jwtSecret);
    } catch(error) {
        if(error.message === 'jwt expired') {
            return Promise.reject('登录已过期！');
        } return Promise.reject('登录异常！');
    }
    if(reqBody.id === user.id) {
        let sql = `select id,accountId from user where id='${reqBody.id}'`;
        return excSQL(sql).then((result) => {
            if(result.length) {
                const token = jwt.sign({ id: result[0].id }, jwtSecret, { expiresIn: 60 * 60 * 24 });
                return {id: result[0].id, name: result[0].accountId, token: token};
            } else return Promise.reject('用户名不存在！');
        });
    } else return Promise.reject('登录异常！');
}

module.exports = {
    register,
    login,
    checkLogin
};