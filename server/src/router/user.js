/* eslint-disable */
 
const express = require('express'),
      router = express.Router(),
      { SuccessModel, ErrorModel } = require('../model/responseModel'),
      { register, login, checkLogin } = require('../controllers/user'),
      { resSend } = require('../utils/tools');

router.use(express.json());

router.post('/register',function (req,res) {
    register(req).then((result) => {
        resSend(res, new SuccessModel());
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.post('/login',function (req,res) {
    login(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.post('/checkLogin',function (req,res) {
    checkLogin(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.get('/user/:id',function (req,res) {
    // var user = {}
    // connection.query('select * from users where id = ' + req.params.id,function (err,result) {
    //     if (err) throw err
    //     user = result
    //     res.end(JSON.stringify(user))
    // })
})
router.get('/addUser/:name/:age/:email',function (req,res) {
    // var sql = 'insert into users(name,age,email) values(?,?,?)'
    // var user = {name: 'Mike',age:12,email:'1124245@qq,com'}
    // var params = [req.params.name,req.params.age,req.params.email]
    // connection.query(sql,params,function (err,result) {
    //     if (err) throw err
    //     console.log(result)
    //     res.end(JSON.stringify(result))
    // })
})
router.get('/delUser/:id',function (req,res) {
    // connection.query('delete  from users where id=' + req.params.id,function (err,result) {
    //     if (err) throw err
    //     res.end(JSON.stringify(result))
    // })
})
router.get('/updateUser/:id',function (req,res) {
    // connection.query('update users set name=? where id = ?',['LiMing',req.params.id],function (err,result) {
    //     if (err) throw err
    //     res.end(JSON.stringify(result))
    // })
})
 
module.exports = router
