var db = require("../models/db");
var writeJson = require('../models/writeJson')
var makeoid = require('../models/makeOrderId')
var async = require('async');
var sd = require('silly-datetime');
var config=require('../config/mysql')
/**
 *添加入库单
 * @param com_cat 物品类型
 * @param onepeople 经办人
 * @param twopeople 保管员
 * @param datas 商品数据
 */
exports.add = function (req, res) {
    // const query = {
    //     com_cat: 1,
    //     onepeople: "onepeople",
    //     twopeople: 'twopeople',
    //     datas: [
    //         {
    //             sname: "电视机",
    //             size: "海信T60",
    //             unit: "台",
    //             price: 6000,
    //             num: 2,
    //             prices: 12000
    //         },
    //         {
    //             sname: "中性笔",
    //             size: "齐心",
    //             unit: "支",
    //             price: 1.5,
    //             num: 100,
    //             prices: 150
    //         }
    //     ]
    // }
    const query = request.body
    const com_cat = parseInt(query.com_cat) || ''
    const onepeople = query.onepeople || ''
    const twopeople = query.twopeople || ''
    const time = new Date()
    const datas = query.datas || ''
    if (!com_cat || !onepeople || !twopeople || datas.length <= 0) {
        writeJson(res, 0, "数据不能为空")
    } else if (!(com_cat == 1 || com_cat == 2)) {
        writeJson(res, 0, "物品类别错误")
    } else {
        let jiaoyan = true
        for (let i = 0; i < datas.length; i++) {
            if (!datas[i].sname || !datas[i].size || !datas[i].unit || !datas[i].price || !datas[i].num || !datas[i].prices) {
                jiaoyan = false
            }
        }
        if (jiaoyan) {
            const threepeople = req.session.user.username//负责人
            const type = 1//出入库类型
            makeoid(type, function (oid) {
                //存储订单表
                adds(oid, com_cat, onepeople, twopeople, time, threepeople, type, datas, function (data) {
                    if (data) {
                        writeJson(res, 1, '', '生成订单成功')
                    } else {
                        writeJson(res, 0, '生成订单失败请检查数据，重新提交')
                    }
                })
            })
        } else {
            writeJson(res, 0, "商品数据不能为空")
        }
    }
}
/**
 * 查询所有入库单
 */
exports.list = async function (req, res) {
    try{
        var page = Number(req.query.page) || 1;//当前页数
        var  limt = Number(req.query.limt) || config.limt //每页显示条数
        limt = limt > 0 ? limt : config.limt
        page = page > 0 ? page : 1;
        var y=(page-1)*limt
        var nums=await findnums()
        if(nums>0){
            db.query('select oid,com_cat,onepeople,twopeople,time,threepeople from orders where type = 1 ORDER BY time DESC limit ?,?', [y,limt],
                function (err, result) {
                    if (err) {
                        writeJson(res, 0, err)
                    } else {
                        if (result.length > 0) {
                            for (let i = 0; i < result.length; i++) {
                                db.query('select sid,sname,size,unit,price,num,prices from input where oid =?', [result[i].oid],
                                    function (err, data) {
                                        if (err) {
                                            console.log(err)
                                            throw (err)
                                        } else {
                                            if(result[i].com_cat == 1){
                                                result[i].com_cat="上级调拨"
                                            }
                                            if(result[i].com_cat == 2){
                                                result[i].com_cat="本级自筹"
                                            }
                                            result[i].time=sd.format(new Date(result[i].time), 'YYYY-MM-DD hh:mm:ss')
                                            result[i].datas = data
                                        }
                                        if (i == result.length - 1) {
                                            writeJson(res, 1, '', {
                                                num:nums,//总条数
                                                current_page:page,//当前页数
                                                pages:Math.ceil(nums / limt),//总页数
                                                result:result//数据
                                            })
                                        }
                                    })
                            }
                        } else {
                            writeJson(res, 1, '', {
                                num:0,//总条数
                                current_page:1,//当前页数
                                pages:1,//总页数
                                result:result//数据
                            })
                        }
                    }
                })
        }else{
            writeJson(res, 1, '', {
                num:0,//总条数
                current_page:1,//当前页数
                pages:1,//总页数
                result:[]//数据
            })
        }
    }catch(err){
        writeJson(res, 0, err)
    }

}

//存储入库单
function adds(oid, com_cat, onepeople, twopeople, time, threepeople, type, datas, callbacks) {
    //---开启事务（回滚）---
    db.pool.getConnection(function (err, conn) {
        conn.beginTransaction(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            //添加入库订单
            var addOrder = function (callback) {
                conn.query('insert into orders (oid,com_cat,onepeople,twopeople,time,threepeople,type) values (?,?,?,?,?,?,?)',
                    [oid, com_cat, onepeople, twopeople, time, threepeople, type],
                    function (err, result) {
                        if (err) {
                            console.log(err)
                            callback(err, null)
                        } else {
                            if (result.affectedRows > 0) {
                                callback(null, true)
                            } else {
                                callback(true, null)
                            }
                        }
                    })
            }
            //添加入库商品
            var addshop = function (callback) {
                var value = []
                for (let i = 0; i < Object.values(datas).length; i++) {
                    value.push(Object.values(datas[i]))
                }
                for (let i = 0; i < value.length; i++) {
                    value[i].push(oid)
                }
                conn.query('insert into input (sname,size,unit,price,num,prices,oid) values ?', [value],
                    function (err, result) {
                        if (err) {
                            console.log(err)
                            callback(true, null)
                        } else {
                            if (result.affectedRows > 0) {
                                callback(null, true)
                            } else {
                                callback(true, null)
                            }
                        }
                    })
            }

            async.parallel([addOrder, addshop], function callback(err, result) {
                if (!err) {
                    conn.commit(function (err) {
                        if (err) {
                            console.log(err)
                            callback(false)
                        }
                        console.log('成功,提交!');
                        //释放资源
                        conn.release();
                        callbacks(true)
                    });
                } else {
                    conn.rollback(function (err, result) {
                        console.log(err)
                        console.log('出现错误,回滚!');
                        //释放资源
                        conn.release();
                        callbacks(false)
                    });
                }
            })
        })
    })
}

//根据订单号查询订单
function findByOid(oid) {
    return new Promise(function (resolve, reject) {
        if (oid.substr(0, 2) == "RK") {
            db.query('select oid,com_cat,onepeople,twopeople,time,threepeople from orders where type = 1 and oid =? ORDER BY time DESC', [oid],
                function (err, result) {
                    if (err) {
                        console.log(err)
                        reject(err)
                    } else {
                        if (result.length > 0) {
                            result[0].time=sd.format(new Date(result[0].time))
                            if (result[0].com_cat == 1) {
                                result[0].com_cat = "上级调拨"
                            }
                            if (result[0].com_cat == 2) {
                                result[0].com_cat = "本级自筹"
                            }
                            db.query('select sname,size,unit,price,num,prices from input where oid =?', [oid],
                                function (err, data) {
                                    if (err) {
                                        console.log(err)
                                        reject(err)
                                    } else {
                                        result[0].datas = data
                                        resolve(result)
                                    }
                                })
                        } else {
                            resolve(result)
                        }
                    }
                })
        } else if (oid.substr(0, 2) == "CK") {
            db.query('select oid,com_cat,onepeople,twopeople,time,threepeople from orders where type = 0 and oid =? ORDER BY time DESC', [oid],
                function (err, result) {
                    if (err) {
                        console.log(err)
                        reject(err)
                    } else {
                        if (result.length > 0) {
                            result[0].time=sd.format(new Date(result[0].time))
                            db.query('select sname,size,unit,price,expectednum,actualnum,prices from output where oid =?', [oid],
                                function (err, data) {
                                    if (err) {
                                        console.log(err)
                                        reject(err)
                                    } else {
                                        result[0].datas = data
                                        resolve(result)
                                    }
                                })
                        } else {
                            resolve(result)
                        }
                    }
                })
        } else {
            reject("订单号不正确")
        }
    })

}
//查询数据总条数
function findnums(){
    return new Promise(function (resolve, reject) {
        db.query('select count(*) as num from orders where type =1',[],function(err,result){
            if(err){
                reject(err)
            }else{
                resolve(result[0].num)
            }
        })
    })
}

exports.findByOid = findByOid
