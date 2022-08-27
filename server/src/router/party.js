/* eslint-disable */
 
const express = require('express'),
      router = express.Router(),
      { SuccessModel, ErrorModel } = require('../model/responseModel'),
      { partyList, addParty, removeParty } = require('../controllers/party'),
      { resSend } = require('../utils/tools');

router.use(express.json());

router.get('/partyList/:userId',function (req,res) {
    partyList(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.post('/addParty',function (req,res) {
    addParty(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
router.delete('/removeParty/:id/:userId',function (req,res) {
    removeParty(req).then((result) => {
        resSend(res, new SuccessModel(result));
    }, (err) => {
        console.log(err)
        resSend(res.status(err.status || 500), new ErrorModel(err));
    });
})
 
module.exports = router
