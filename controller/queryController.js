var db = require("../models/db");
var writeJson = require('../models/writeJson')
var outputController = require('../controller/outputController')
var inputController = require('../controller/inputController')
var sd = require('silly-datetime');
var config = require('../config/mysql')
/**
 * 检索查询出库单
 * @param req
 * @param res
 */
exports.output = async function (req, res) {
    const query = req.body;
    const onepeople = query.onepeople || '';//发放人
    const twopeople = query.twopeople || '';//领取人
    const threepeople = query.threepeople || '';//负责人
    const oid = query.oid || '';//订单编号
    const startime = query.startime || ''//起始时间
    const closetime = query.closetime || '' //终止时间
    const com_cat = query.com_cat || '' //收料单位
    const type = 0;
    try {
        var page = Number(req.query.page) || 1;//当前页数
        var limt = Number(req.query.limt) || config.limt //每页显示条数
        limt = limt > 0 ? limt : config.limt
        page = page > 0 ? page : 1;
        const data = await sousuo(com_cat, onepeople, twopeople, threepeople, oid, startime, closetime, type, page, limt)
        for (let i = 0; i < data.result.length; i++) {
            data.result[i].time = sd.format(new Date(data.result[i].time))
        }
        writeJson(res, 1, '', data)
    } catch (err) {
        writeJson(res, 0, err)
    }
}
/**
 * 检索查询入库单
 * @param req
 * @param res
 */
exports.input = async function (req, res) {
    const query = req.body;
    const onepeople = query.onepeople || '';//发放人
    const twopeople = query.twopeople || '';//保管员
    const threepeople = query.threepeople || '';//负责人
    const oid = query.oid || '';//订单编号
    const startime = query.startime || ''//起始时间
    const closetime = query.closetime || '' //终止时间
    const com_cat = query.com_cat || '' //物品类别
    const type = 1;
    try {
        var page = Number(req.query.page) || 1;//当前页数
        var limt = Number(req.query.limt) || config.limt //每页显示条数
        limt = limt > 0 ? limt : config.limt
        page = page > 0 ? page : 1;
        const data = await sousuo(com_cat, onepeople, twopeople, threepeople, oid, startime, closetime, type, page, limt)
        for (let i = 0; i < data.result.length; i++) {
            data.result[i].time = sd.format(new Date(data.result[i].time))
            if (data.result[i].com_cat == 1) {
                data.result[i].com_cat = "上级调拨"
            }
            if (data.result[i].com_cat == 2) {
                data.result[i].com_cat = "本级自筹"
            }
        }
        writeJson(res, 1, '', data)
    } catch (err) {
        writeJson(res, 0, err)
    }
}
/**
 * 检索商品
 * @param req
 * @param res
 */
exports.goods = function (req, res) {
    let query = req.body;
    let sname = query.sname || ''
    let size = query.size || ''
    if (!sname && !size) {
        writeJson(res, 0, "搜索条件为空")
    } else {
        if (!sname) {
            var sql = `select sname,size,unit,price from input where size like '%${size}%' group by sname,size`
        } else if (!size) {
            var sql = `select sname,size,unit,price from input where sname like '%${sname}%'  group by sname,size`
        } else {
            var sql = `select sname,size,unit,price from input where sname like '%${sname}%' and size like '%${size}%'  group by sname,size`
        }
        db.query(sql, [], async function (err, result) {
            if (err) {
                writeJson(res, 0, err)
            } else {
                if (result.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        let kucun = await outputController.findKuCun(result[i].sname, result[i].size)
                        result[i].kucun = kucun
                    }
                    writeJson(res, 1, '', result)
                } else (
                    writeJson(res, 1, '', result)
                )
            }
        })
    }

}

/**
 * 查询商品的出入库情况
 * @param sname
 * @param size
 */
exports.shopRecord = async function (req, res) {
    const query = req.body;
    const sname = query.sname || '';
    const size = query.size || '';
    if (!sname || !size) {
        writeJson(res, 0, "商品信息不能为空")
    } else {
        try {
            const data = {}
            let num = await outputController.findKuCun(sname, size)
            data.kucun = num
            let out = await outShopRecord(sname, size)
            for (let i = 0; i < out.length; i++) {
                out[i].time = sd.format(new Date(out[i].time), 'YYYY-MM-DD hh:mm:ss')
            }
            data.out = out
            let input = await  inShopRecord(sname, size)
            for (let i = 0; i < input.length; i++) {
                input[i].time = sd.format(new Date(input[i].time), 'YYYY-MM-DD hh:mm:ss')
            }
            data.input = input
            writeJson(res, 1, '', data)
        } catch (err) {
            writeJson(res, 0, err)
            return
        }
    }
}
/**
 * 根据订单号查询订单详情
 * @param req
 * @param res
 * @returns {Promise.<void>}
 */
exports.findByOid = async function (req, res) {
    const oid = req.params.oid || ''
    let regex = new RegExp(/^[CR]K\d{17}$/)
    if (!oid) {
        writeJson(res, 0, '数据为空')
    } else if (regex.test(oid)) {
        try {
            const result = await inputController.findByOid(oid)
            writeJson(res, 1, '', result)
        } catch (err) {
            writeJson(res, 0, err)
        }
    } else {
        writeJson(res, 0, '订单格式错误')
    }

}
/**
 * 商品列表
 * @param req
 * @param res
 * @returns 品名 类型 单位 库存
 */
exports.goodslist = async function (req, res) {
    try {
        var page = Number(req.query.page) || 1;//当前页数
        var limt = Number(req.query.limt) || config.limt //每页显示条数
        limt = limt > 0 ? limt : config.limt
        page = page > 0 ? page : 1;
        var y = (page - 1) * limt
        var nums = await findgoodnums()
        if (nums > 0) {
            db.query('select sname,size,unit,price from input group by sname,size limit ?,?', [y, limt],
                async function (err, result) {
                    if (err) {
                        writeJson(res, 0, err)
                    } else {
                        if (result.length > 0) {
                            for (let i = 0; i < result.length; i++) {
                                let kucun = await outputController.findKuCun(result[i].sname, result[i].size)
                                result[i].kucun = kucun
                            }
                            writeJson(res, 1, '', {
                                num: nums,//总条数
                                current_page: page,//当前页数
                                pages: Math.ceil(nums / limt),//总页数
                                result: result//数据
                            })
                        } else (
                            writeJson(res, 1, '', writeJson(res, 1, '', {
                                num: 0,//总条数
                                current_page: 1,//当前页数
                                pages: 1,//总页数
                                result: result//数据
                            }))
                        )
                    }
                })
        } else {
            writeJson(res, 1, '', {
                num: 0,//总条数
                current_page: 1,//当前页数
                pages: 1,//总页数
                result: []//数据
            })
        }
    } catch (err) {
        writeJson(res, 0, err)
    }
}

//查询商品出库信息
function outShopRecord(sname, size) {
    return new Promise(function (resolve, reject) {
        db.query('SELECT b.oid,b.expectednum,b.actualnum,b.unit,b.price,b.prices,a.time FROM output AS b,orders AS a WHERE a.oid=b.oid and b.sname=? and b.size=? ORDER BY time DESC',
            [sname, size], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
    })
}

//查询商品入库信息
function inShopRecord(sname, size) {
    return new Promise(function (resolve, reject) {
        db.query('SELECT b.oid,b.num,b.unit,b.price,b.prices,a.time FROM input AS b,orders AS a WHERE a.oid=b.oid and b.sname=? and b.size=? ORDER BY time DESC',
            [sname, size], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
    })
}

//检索方法
function sousuo(com_cat, onepeople, twopeople, threepeople, oid, startime, closetime, type, page, limt) {
    return new Promise(async function (resolve, reject) {

        var y = (page - 1) * limt
        if (!com_cat && !onepeople && !twopeople && !threepeople && !oid && !startime && !closetime) {
            reject("搜索信息不能为空")
        } else {
            if (type == 1) {
                if (!(com_cat == 1 || com_cat == 2)) {
                    reject("物品类别错误")
                }
            }
            const val = []
            var sql = "select oid,com_cat,onepeople, twopeople, threepeople,time from orders where type=" + type
            var sqlnum = "select count(*) as num from orders where type=" + type
            if (com_cat) {
                sql = sql + " and com_cat = ?"
                sqlnum = sqlnum + " and com_cat = ?"
                val.push(com_cat)
            }
            if (onepeople) {
                sql = sql + " and onepeople = ?"
                sqlnum = sqlnum + " and onepeople = ?"
                val.push(onepeople)
            }
            if (twopeople) {
                sql = sql + " and twopeople = ?"
                sqlnum = sqlnum + " and twopeople = ?"
                val.push(twopeople)
            }
            if (threepeople) {
                sql = sql + " and threepeople = ?"
                sqlnum = sqlnum + " and threepeople = ?"
                val.push(threepeople)
            }
            if (oid) {
                sql = sql + " and oid = ?"
                sqlnum = sqlnum + " and oid = ?"
                val.push(oid)
            }
            if (startime || closetime) {
                if (!startime) {
                    sql = sql + " and time <= '" + closetime + "'"
                    sqlnum = sqlnum + " and time <= '" + closetime + "'"
                } else if (!closetime) {
                    sql = sql + " and time >= '" + startime + "'"
                    sqlnum = sqlnum + " and time >= '" + startime + "'"
                } else {
                    sql = sql + " and time <= '" + closetime + "' and time >= '" + startime + "'"
                    sqlnum = sqlnum + " and time <= '" + closetime + "' and time >= '" + startime + "'"
                }
            }
            sql = sql + " limit ?,?"
            val.push(y, limt)
            try {
                var nums = await findordernums(sqlnum, val)
                if (nums > 0) {
                    db.query(sql, val, function (err, result) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve({
                                num: nums,//总条数
                                current_page: page,//当前页数
                                pages: Math.ceil(nums / limt),//总页数
                                result: result//数据
                            })
                        }
                    })
                } else {
                    resolve({
                        num: 0,//总条数
                        current_page: 1,//当前页数
                        pages: 1,//总页数
                        result: []//数据
                    })
                }
            } catch (err) {
                reject(err)
            }
        }
    })
}

//查询商品条数
function findgoodnums() {
    return new Promise(function (resole, reject) {
        db.query('select count(*) as num from(select count(1) from input group by sname,size) a', [],
            function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resole(result[0].num)
                }
            })
    })
}

//根据检索条件查询入库出库条数
function findordernums(sql, val) {
    return new Promise(function (resole, reject) {
        db.query(sql, val, function (err, result) {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                resole(result[0].num)
            }
        })
    })
}

//检索时间 SELECT b.oid,b.expectednum,b.actualnum,b.unit,b.price,b.prices,a.time FROM output AS b,orders AS a WHERE a.oid=b.oid and b.sname="电视机" and b.size="海信T60" and time>'2017-12-28 10:32:19' ORDER BY time DESC

