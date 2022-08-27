/* eslint-disable */
 
const express = require('express'),
      router = express.Router(),
      { SuccessModel, ErrorModel } = require('../model/responseModel'),
      { dealList, addDeal, updateDeal, removeDeal } = require('../controllers/deal'),
      { resSend } = require('../utils/tools');

router.use(express.json());

router.get('/dealList',function (req,res) {
    let factor = '';
    for(let key in req.query) {
        switch(key){
            case 'cottonId':;
            case 'partyId': 
                factor += ` and d.${key}='${req.query[key]}'`;
                break;
            case 'type':
                factor += ` and d.${key}=${req.query[key]}`;
                break;
            case 'searchText':
                let keyWords = `%${req.query[key]}%`;
                factor += ` and (binary ucase(c.name) like ucase('${keyWords}') or binary (case d.type when 0 then '入库' when 1 then '出库' end) like '${keyWords}' or d.unitPrice like '${keyWords}' or d.quantity like '${keyWords}' or binary ucase(p.name) like ucase('${keyWords}') or d.businessDate like '${keyWords}' or binary ucase(d.comment) like ucase('${keyWords}'))`;
                break;
        }
    }
    if(req.query.startDate && req.query.endDate) {
        factor += ` and d.businessDate between '${req.query.startDate}' and '${req.query.endDate}'`;
    }
    dealList(req, factor).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.post('/addDeal',function (req,res) {
    addDeal(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.put('/updateDeal',function (req,res) {
    updateDeal(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.patch('/removeDeal',function (req,res) {
    removeDeal(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
 
module.exports = router
