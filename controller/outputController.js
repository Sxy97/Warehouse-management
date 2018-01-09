var db = require("../models/db");
var writeJson = require('../models/writeJson')
var makeoid = require('../models/makeOrderId')
var async = require('async');
var sd = require('silly-datetime');
var config=require('../config/mysql')

/**
 * 模糊搜索品名
 */
exports.fuzzyFindSname = function (req, res) {
    const sname = req.body.sname || ''
    if (sname) {
        db.query("select distinct(sname) from input where sname like '%' ? '%'", [sname],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    writeJson(res, 1, '', result)
                }
            })
    }
}
/**
 * 根据品名返回类型
 */
exports.findSize = function (req, res) {
    const sname = req.body.sname || ''
    if (!sname) {
        writeJson(res, 0, "数据不能为空")
    } else {
        db.query("select distinct(size) from input where sname = ?", [sname],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    writeJson(res, 1, '', result)
                }
            })

    }
}


/**
 * 模糊搜索类型
 */
exports.fuzzyFindSize = function (req, res) {
    const size = req.body.size || ''
    if (size) {
        db.query("select distinct(size) from input where size like '%' ? '%'", [size],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    writeJson(res, 1, '', result)
                }
            })
    }
}
/**
 * 根据类型返回品名
 */
exports.findSname = function (req, res) {
    const size = req.body.size || ''
    if (!size) {
        writeJson(res, 0, "数据不能为空")
    } else {
        db.query("select distinct(sname) from input where size = ?", [size],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    writeJson(res, 1, '', result)
                }
            })
    }
}
/**
 * 根据品名，类型 返回 单位、单价、库存数量
 * @param sname 品名
 * @param size 类型
 */
exports.callback = async function (req, res) {
    const sname = req.body.sname || ''
    const size = req.body.size || ''
    if (!sname || !size) {
        writeJson(res, 0, '数据不能为空')
    } else {
        //查询单价，单位
        var test1 = function (callback) {
            db.query('Select price ,unit From input Where sname= ? and size= ? group by sname,size', [sname, size],
                function (err, result) {
                    if (err) {
                        console.log(err)
                        callback(err, null)
                    } else {
                        callback(null, result)
                    }
                })
        }
        //查询库存
        var test2 = function (callback) {
            db.query(' Select sum(num) as num From input Where sname=? and size=?  group by sname,size', [sname, size],
                function (err, result1) {
                    if (err) {
                        console.log(err)
                        callback(err, null)
                    } else {
                        if (result1.length > 0) {
                            db.query(' Select sum(actualnum) as num From output Where sname=? and size=?  group by sname,size', [sname, size],
                                function (err, result2) {
                                    if (err) {
                                        console.log(err)
                                        callback(err, null)
                                    } else {
                                        if (result2.length > 0) {
                                            var num = result1[0].num - result2[0].num
                                            callback(null, num)
                                        } else {
                                            callback(null, result1[0].num)
                                        }
                                    }
                                })
                        } else {
                            callback("没有该商品", null)
                        }

                    }
                })
        }
        async.parallel([test1, test2], function callback(err, result) {
            if (!err) {
                result[0][0].num = result[1]
                writeJson(res, 1, '', result[0][0])
            } else {
                writeJson(res, 0, err)
            }
        })
    }
}
/**
 *添加出库单
 * @param com_cat 收料单位
 * @param onepeople 经办人
 * @param twopeople 收料人
 * @param datas
 */
exports.add = async function (req, res) {
    // const query = {
    //     com_cat: "炊事班",
    //     onepeople: "onepeople",
    //     twopeople: 'twopeople',
    //     datas: [
    //         {
    //             sname: "电视机",
    //             size: "海信T60",
    //             unit: "台",
    //             price: 6000,
    //             expectednum: 2,
    //             actualnum: 2,
    //             prices: 6000
    //         },
    //         {
    //             sname: "中性笔",
    //             size: "齐心",
    //             unit: "支",
    //             price: 1.5,
    //             expectednum: 50,
    //             actualnum: 50,
    //             prices: 75
    //         }
    //     ]
    // }
    const query = req.body
    const com_cat = query.com_cat || ''
    const onepeople = query.onepeople || ''
    const twopeople = query.twopeople || ''
    const time = new Date()
    const datas = query.datas || ''
    if (!com_cat || !onepeople || !twopeople || datas.length <= 0) {
        writeJson(res, 0, "数据不能为空")
    } else {
        let jiaoyan = true
        let jiaoyankucun = true
         for (let i = 0; i < datas.length; i++) {
            if (!datas[i].sname || !datas[i].size || !datas[i].unit || !datas[i].price || !datas[i].expectednum || !datas[i].actualnum || !datas[i].prices) {
                jiaoyan = false
                writeJson(res, 0, "商品数据不能为空")
                return
            } else if (datas[i].actualnum > datas[i].expectednum) {
                jiaoyan = false
                writeJson(res, 0, "实发数不能大于通知数")
                return
            } else {
                if(jiaoyan){
                    try{
                        var kucun =await findKuCun(datas[i].sname, datas[i].size)
                        //实发数要小于库存
                        if (kucun  < datas[i].actualnum) {
                            jiaoyan = false
                            jiaoyankucun = false
                        }
                    }catch (err){
                        jiaoyan = false
                        jiaoyankucun = false
                        writeJson(res, 0,err)
                        return
                    }
                }
            }
        }
        if (!jiaoyankucun) {
            writeJson(res, 0, "实发数不能大于库存")
            return
        }
        if (jiaoyan) {
            const threepeople = req.session.user.username//负责人
            const type = 0//出入库类型
            makeoid(type,function (oid) {
                //存储订单表
                adds(oid, com_cat, onepeople, twopeople, time, threepeople, type, datas, function (data) {
                    if (data) {
                        writeJson(res, 1, '', '生成订单成功')
                    } else {
                        writeJson(res, 0, '生成订单失败，请检查填写数据')
                    }
                })
            })
        }
    }
}
/**
 * 查询所有出库单
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
            db.query('select oid,com_cat,onepeople,twopeople,time,threepeople from orders where type = 0 ORDER BY time DESC limit ?,?', [y,limt],
                function (err, result) {
                    if (err) {
                        writeJson(res, 0, err)
                    } else {
                        if (result.length > 0) {
                            for (let i = 0; i < result.length; i++) {
                                db.query('select sid,sname,size,unit,price,expectednum,actualnum,prices from output where oid =?', [result[i].oid],
                                    function (err, data) {
                                        if (err) {
                                            console.log(err)
                                        } else {
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
                            writeJson(res, 1, '',  writeJson(res, 1, '', {
                                num:0,//总条数
                                current_page:1,//当前页数
                                pages:1,//总页数
                                result:[]//数据
                            }))
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

//查看库存
function findKuCun(sname, size) {
    return new Promise(function (resolve, reject) {
        db.query(' Select sum(num) as num From input Where sname=? and size=?  group by sname,size', [sname, size],
            function (err, result1) {
                if (err) {
                    console.log(err)
                    reject(err)
                } else {
                    if (result1.length > 0) {
                        db.query(' Select sum(actualnum) as num From output Where sname=? and size=?  group by sname,size', [sname, size],
                            function (err, result2) {
                                if (err) {
                                    console.log(err)
                                    reject(err)
                                } else {
                                    if (result2.length > 0) {
                                        var num = result1[0].num - result2[0].num
                                        resolve(num)
                                    } else {
                                        resolve(result1[0].num)
                                    }
                                }
                            })
                    } else {
                        reject("没有该商品")
                    }

                }
            })
    })
}

//存储出库单
function adds(oid, com_cat, onepeople, twopeople, time, threepeople, type, datas, callbacks) {
    //---开启事务（回滚）---
    db.pool.getConnection(function (err, conn) {
        conn.beginTransaction(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            //添加出库订单
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
            //添加出库商品
            var addshop = function (callback) {
                var value = []
                for (let i = 0; i < Object.values(datas).length; i++) {
                    value.push(Object.values(datas[i]))
                }
                for (let i = 0; i < value.length; i++) {
                    value[i].push(oid)
                }
                conn.query('insert into output (sname,size,unit,price,expectednum,actualnum,prices,oid) values ?', [value],
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

//查询数据总条数
function findnums(){
    return new Promise(function (resolve, reject) {
        db.query('select count(*) as num from orders where type =0',[],function(err,result){
            if(err){
                reject(err)
            }else{
                resolve(result[0].num)
            }
        })
    })
}

exports.findKuCun=findKuCun;