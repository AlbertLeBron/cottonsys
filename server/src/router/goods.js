/* eslint-disable */
 
const express = require('express'),
      router = express.Router(),
      { SuccessModel, ErrorModel } = require('../model/responseModel'),
      { goodsList, addGoods, removeGoods, stockList, updateStock, removeStock } = require('../controllers/goods'),
      { resSend } = require('../utils/tools');

router.use(express.json());

router.get('/goodsList/:userId',function (req,res) {
    goodsList(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.post('/addGoods',function (req,res) {
    addGoods(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.delete('/removeGoods/:id/:userId',function (req,res) {
    removeGoods(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.get('/stockList/:userId',function (req,res) {
    stockList(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.put('/updateStock',function (req,res) {
    updateStock(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.delete('/removeStock/:id/:userId',function (req,res) {
    removeStock(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
 
module.exports = router
