const { excSQL } = require('../db/mysql'),
      { run, RegExpStr, MathSubtr } = require('../utils/tools'),
      { stockLimit } = require('../utils/constant'),
      joi = require('joi');

const dealList = (req, factor) => {
    let query = req.query;
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        pageNumber: joi.number().required().error(new Error('页数不正确')),
        pageSize: joi.number().required().error(new Error('单页记录数不正确')),
        cottonId: joi.string().regex(RegExpStr.uuid).error(new Error('品种ID不合法')),
        type: joi.number().integer().error(new Error('交易类型不正确')),
        partyId: joi.string().regex(RegExpStr.uuid).error(new Error('交易方ID不合法')),
        startDate: joi.string().error(new Error('开始日期不合法')),
        endDate: joi.string().error(new Error('结束日期不合法')),
        searchText: joi.string().error(new Error('检索文本不合法'))
    },{
        userId: query.userId,
        pageNumber: query.pageNumber,
        pageSize: query.pageSize,
        cottonId: query.cottonId,
        type: query.type,
        partyId: query.partyId,
        startDate: query.startDate,
        endDate: query.endDate,
        searchText: query.searchText
    }).then(() => {
        query.pageSize = Number(query.pageSize);
        query.pageNumber = Number(query.pageNumber)
        let offset = query.pageSize*query.pageNumber,
            pageFactor = offset => Number(query.pageSize) ? `limit ${query.pageSize} offset ${offset}` : '',
            querySql = offset => `select SQL_CALC_FOUND_ROWS d.id as id,d.userId as userId,d.cottonId as cottonId,c.name as cottonName,d.partyId as partyId,p.name as partyName,d.type as type,d.unitPrice as unitPrice,d.quantity as quantity,d.comment as comment,d.businessDate as businessDate from deal d left join cotton c on d.cottonId=c.id and d.userId=c.userId left join party p on d.partyId=p.id and d.userId=p.userId where d.userId='${query.userId}' and isnull(d.state) ${factor} order by d.createDate desc,d.id desc ${pageFactor(offset)}`,
            countSql = 'select FOUND_ROWS() as count',
            sql = querySql(offset);
        return excSQL(sql).then((result) => {
            sql = countSql;
            return excSQL(sql).then((count) => {
                return {count: count[0].count, value: result};
            });
        }).then((data) => {
            if(offset >= data.count && data.count) {
                let pageNumber = Math.floor(data.count/query.pageSize);
                pageNumber = data.count%query.pageSize ? pageNumber : --pageNumber;
                offset = pageNumber*query.pageSize;
                sql = querySql(offset);
                return excSQL(sql).then((result) => {
                    sql = countSql;
                    return excSQL(sql).then((count) => {
                        return {pagenum: pageNumber, count: count[0].count, value: result};
                    });
                })
            } else if(!data.count) {
                return Object.assign({pagenum: -1}, data);
            }
            return Object.assign({pagenum: query.pageNumber}, data);
        });
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

const addDeal = (req) => {
    let reqBody = req.body;
    return run({
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        cottonId: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法')),
        partyId: joi.string().regex(RegExpStr.uuid).required().error(new Error('交易方ID不合法')),
        unitPrice: joi.string().regex(RegExpStr.decimal).required().error(new Error('单价不正确')),
        quantity: joi.string().regex(RegExpStr.decimal).required().error(new Error('数量不正确')),
        comment: joi.string().error(new Error('备注不合法')),
        businessDate: joi.string().error(new Error('日期不合法')),
    },{
        userId: reqBody.userId,
        cottonId: reqBody.cottonId,
        partyId: reqBody.partyId,
        unitPrice: reqBody.unitPrice,
        quantity: reqBody.quantity,
        comment: reqBody.comment,
        businessDate: reqBody.businessDate
    }).then(() => {
        if(reqBody.type !== 0 && reqBody.type !== 1) 
            throw new Error('不存在入库和出库之外的操作！');

        let sql = `select stock from cotton where id='${reqBody.cottonId}' and userId='${reqBody.userId}'`;
        return excSQL(sql).then((result) => {
            if(reqBody.type === 0) {
                if(MathSubtr(MathSubtr(stockLimit, reqBody.quantity), result[0].stock || 0) < 0) {
                    return Promise.reject('品种库存已接近上限，请手动校正或先出货！');
                }else return '核对库存成功，库存尚未接近上限';
            } else if(reqBody.type === 1) {
                if(MathSubtr(result[0].stock || 0, reqBody.quantity) < 0 ) {
                    return Promise.reject('库存不足，请手动校正或先入货！');
                }else return '核对库存成功，库存尚够';
            }
        }).catch((error) => {
            return Promise.reject(error || '核对库存信息失败！');
        });
    }, (err) => {
        return Promise.reject({status: 400});
    }).then(() => {
        let sql = `insert into deal(id,userId,cottonId,partyId,type,unitPrice,quantity,comment,businessDate,createDate) values(uuid(),'${reqBody.userId}','${reqBody.cottonId}','${reqBody.partyId}',${reqBody.type},${reqBody.unitPrice},${reqBody.quantity},${connection.escape(reqBody.comment)},${connection.escape(reqBody.businessDate)},now())`;
        return excSQL(sql).then(() => {
            try{
                sql = `update cotton set stock=ifnull(stock,0)+${reqBody.type ? -reqBody.quantity : reqBody.quantity},stockState=null where id='${reqBody.cottonId}' and userId='${reqBody.userId}'`;
                return excSQL(sql);
            }catch(error) {
                return Promise.reject('更新库存信息失败！');
            }
        });
    }, (error) => {
        return Promise.reject(error);
    });
}

const updateDeal = (req) => {
    let reqBody = req.body;
    return run({
        id: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法')),
        userId: joi.string().equal(req.auth.id).required().error(new Error('用户不匹配')),
        cottonId: joi.string().regex(RegExpStr.uuid).required().error(new Error('品种ID不合法')),
        originalCottonId: joi.string().regex(RegExpStr.uuid).required().error(new Error('原品种ID不合法')),
        partyId: joi.string().regex(RegExpStr.uuid).required().error(new Error('交易方ID不合法')),
        unitPrice: joi.string().regex(RegExpStr.decimal).required().error(new Error('单价不正确')),
        quantity: joi.string().regex(RegExpStr.decimal).required().error(new Error('数量不正确')),
        originalQuantity: joi.number().required().required().error(new Error('原数量不正确')),
        comment: joi.string().error(new Error('备注不合法')),
        businessDate: joi.string().error(new Error('日期不合法')),
    },{
        id: reqBody.id,
        userId: reqBody.userId,
        cottonId: reqBody.cottonId,
        originalCottonId: reqBody.originalCottonId,
        partyId: reqBody.partyId,
        unitPrice: reqBody.unitPrice,
        quantity: reqBody.quantity,
        originalQuantity: reqBody.originalQuantity,
        comment: reqBody.comment,
        businessDate: reqBody.businessDate
    }).then(() => {
        if(reqBody.type !== 0 && reqBody.type !== 1) 
            throw new Error('不存在入库和出库之外的操作！');

        let sql = `select id,name,stock from cotton where (id='${reqBody.cottonId}' or id='${reqBody.originalCottonId}') and userId='${reqBody.userId}'`;
        return excSQL(sql).then((result) => {
            let stockToUpdate = [];
            if(reqBody.cottonId === reqBody.originalCottonId) {
                stockToUpdate.push({id: reqBody.cottonId, difference: reqBody.type ? MathSubtr(reqBody.quantity, reqBody.originalQuantity) : MathSubtr(reqBody.originalQuantity, reqBody.quantity)});
            } else {
                stockToUpdate = reqBody.type ? [{id: reqBody.cottonId, difference: reqBody.quantity}, {id: reqBody.originalCottonId, difference: -reqBody.originalQuantity}]
                                                : [{id: reqBody.cottonId, difference: -reqBody.quantity}, {id: reqBody.originalCottonId, difference: reqBody.originalQuantity}];
            }
            
            for(let key in stockToUpdate) {
                let cotton = result.find(item => item.id === stockToUpdate[key].id);
                if(cotton && stockToUpdate[key].difference > 0 && MathSubtr(cotton.stock || 0, stockToUpdate[key].difference) < 0) {
                    return Promise.reject(`${cotton.name}库存不足，请手动校正或先入货！`);
                } else if(cotton && stockToUpdate[key].difference < 0 && MathSubtr(cotton.stock || 0, stockToUpdate[key].difference) > stockLimit) {
                    return Promise.reject(`${cotton.name}库存已接近上限，请手动校正或先出货！`);
                }
            }

            return stockToUpdate;
        }).catch((error) => {
            return Promise.reject(error || '核对库存信息失败！');
        });
    }, (err) => {
        return Promise.reject({status: 400});
    }).then((stockToUpdate) => {
        let sql = `update deal set cottonId='${reqBody.cottonId}',partyId='${reqBody.partyId}',type=${reqBody.type},unitPrice=${reqBody.unitPrice},quantity=${reqBody.quantity},comment=${connection.escape(reqBody.comment)},businessDate=${connection.escape(reqBody.businessDate)} where id='${reqBody.id}' and userId='${reqBody.userId}'`;
        return excSQL(sql).then(() => {
            try{
                sql = stockToUpdate.map(item => `update cotton set stock=ifnull(stock,0)+${-item.difference},stockState=null where id='${item.id}' and userId='${reqBody.userId}'`).join(';');
                return excSQL(sql);
            }catch(error) {
                return Promise.reject('更新库存信息失败！');
            }
        });
    }, (error) => {
        return Promise.reject(error);
    });
}

const removeDeal = (req) => {
    let reqBody = req.body;
    return run({
        userId: joi.string().equal(req.auth.id).error(new Error('用户不匹配')),
        ids: joi.array().items(
            joi.object().keys({
                id: joi.string().regex(RegExpStr.uuid).error(new Error('交易ID不合法'))
            })
        )
    },{
        userId: reqBody.userId,
        ids: reqBody.ids
    }).then(() => {
        let sql = reqBody.ids.map(item => `update deal set state=0 where id='${item.id}' and userId='${reqBody.userId}'`).join(';');
        return excSQL(sql);
    }, (err) => {
        return Promise.reject({status: 400});
    });
}

module.exports = {
    dealList,
    addDeal,
    updateDeal,
    removeDeal
};