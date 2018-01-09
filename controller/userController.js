var db = require("../models/db");
var Md5 = require("../models/MD5");
var writeJson = require('../models/writeJson')
var config = require('../config/mysql')


/**
 * 用户登录
 * @param username 登录名
 * @param password 密码
 */
exports.login = function (req, res) {
    const query = req.body;
    const username = query.username || '';
    const password = query.password || '';
    if (!username || !password) {
        writeJson(res, 0, "数据不能为空")
    } else {
        const md5password = Md5.md5Password(password)
        db.query('select * from user where loginname=? and password=?', [username, md5password],
            function (err, result) {
                if (err) {
                    console.log(err)
                } else {
                    if (result.length != 1) {
                        writeJson(res, 0, "账号密码不正确")
                    } else {
                        delete result[0].password
                        req.session.user = result[0];
                        writeJson(res, 1, "", result[0])
                    }
                }
            })
    }
}
/**
 * 用户登出
 */
exports.outlogin = function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            writeJson(res, 0, "退出失败")
        } else {
            writeJson(res, 1, "", "退出成功")
        }
    })
}
/**
 *添加用户
 * @param loginname 登录账号
 * @param username  用户名
 * @param state     权限（0/1）
 * @param password  密码
 */
exports.add = function (req, res) {
    const query = req.body;
    const loginname = query.loginname || ''
    const username = query.username || ''
    const password = query.password || ''
    const state = parseInt(query.state) || ''
    if (!loginname || !username || !password || !state) {
        writeJson(res, 0, "数据不能为空")
    } else if (!(state == 2 || state == 1)) {
        writeJson(res, 0, "权限类型输入错误")
    } else {
        findByLoginName(loginname, function (err, result) {
            if (result) {
                const md5Password = Md5.md5Password(password);
                db.query('insert into user (loginname,username,password,state) values(?,?,?,?)',
                    [loginname, username, md5Password, state],
                    function (err, result) {
                        if (err) {
                            console.log(err)
                            writeJson(res, 0, err)
                        } else {
                            if (result.affectedRows > 0) {
                                writeJson(res, 1, '', '添加成功')
                            } else {
                                writeJson(res, 0, '添加失败')
                            }
                        }
                    })
            } else {
                writeJson(res, 0, "账号重复")
            }
        })
    }
}
/**
 * 更新用户权限
 * @param uid 用户id
 * @param state 用户权限
 */
exports.updatestate = function (req, res) {
    const query = req.body;
    const uid = query.uid || ''
    const state = query.state || ''
    if (!uid || !state) {
        writeJson(res, 0, "数据不能为空")
    } else if (!(state == 0 || state == 1)) {
        writeJson(res, 0, "权限类型输入错误")
    } else {
        db.query('update user set state=? where uid=?', [state, uid],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    if (result.affectedRows > 0) {
                        writeJson(res, 1, '', '更新成功')
                    } else {
                        writeJson(res, 0, '更新失败')
                    }
                }
            })
    }
}
/**
 * 批量删除
 * @param uids 删除uid数组
 */
exports.delete = function (req, res) {
    const uids = req.body.uids || ''
    if (!uids) {
        writeJson(res, 0, "数据不能为空")
    } else {
        db.query('delete from user where uid in (?)', [uids],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    console.log(result.affectedRows)
                    if (result.affectedRows > 0) {
                        writeJson(res, 1, '', '删除成功')
                    } else {
                        writeJson(res, 0, '删除失败')
                    }
                }
            })
    }
}
/**
 * 更新个人密码
 * @param oldpassword 旧密码
 * @param newPassword 新密码
 */
exports.updatePassword = function (req, res) {
    const uid = req.session.user.uid
    //const uid = 11
    const oldpassword = req.body.oldpassword || ''
    const newPassword = req.body.newpassword || ''
    if (!uid || !oldpassword || !newPassword) {
        writeJson(res, 0, "数据不能为空")
    } else {
        const md5oldpassword = Md5.md5Password(oldpassword)
        db.query('select * from user where uid=? and password=?',
            [uid, md5oldpassword],
            function (err, result) {
                if (err) {
                    writeJson(res, 0, err)
                } else {
                    if (result[0]) {
                        const md5newpassword = Md5.md5Password(newPassword)
                        db.query('update user set password =? where uid=?', [md5newpassword, uid],
                            function (err, result) {
                                console.log(4)
                                if (err) {
                                    writeJson(res, 0, err)
                                } else {
                                    if (result.affectedRows > 0) {
                                        writeJson(res, 1, '', '更新成功')
                                    } else {
                                        writeJson(res, 0, '更新失败')
                                    }
                                }
                            })
                    } else {
                        writeJson(res, 0, "原密码不正确")
                    }
                }
            })
    }
}
/**
 * 用户列表
 */
exports.list = function (req, res) {
    var page = Number(req.query.page) || 1;//当前页数
    var limt = Number(req.query.limt) || config.limt //每页显示条数
    limt = limt > 0 ? limt : config.limt
    page = page > 0 ? page : 1;
    var y = (page - 1) * limt
    db.query('select count(*) as num from user', [], function (err, num) {
        if (err) {
            writeJson(res, 0, err)
        } else {
            if (num <= 0) {
                writeJson(res, 1, '', {
                    num: 0,//总条数
                    current_page: 1,//当前页数
                    pages: 1,//总页数
                    result: []//数据
                })
            } else {
                db.query('select uid,loginname,username,state from user limit ?,?', [y, limt],
                    function (err, result) {
                        if (err) {
                            writeJson(res, 0, err)
                        } else {
                            writeJson(res, 1, '', {
                                num: num[0].num,//总条数
                                current_page: page,//当前页数
                                pages: Math.ceil(num[0].num / limt),//总页数
                                result: result//数据
                            })
                        }
                    })
            }
        }
    })
}
/**
 * 查询单个用户
 * @param uid
 */
exports.findonebyId = function (req, res) {
    const uid = parseInt(req.params.uid) || ''
    if (!uid) {
        writeJson(res, 0, "数据不能为空")
    } else {
        findById(uid, function (err, result) {
            if (err) {
                writeJson(res, 0, err)
            } else {
                writeJson(res, 1, '', result)
            }
        })
    }
}


function findById(uid, callback) {
    db.query('select uid,loginname,username,state from user where uid = ?', [uid],
        function (err, result) {
            if (err) {
                console.log(err)
                callback(err, '')
            } else {
                callback('', result)
            }
        })
}

function findByLoginName(loginName, callback) {
    db.query('select uid,loginname,username,state from user where loginName = ?', [loginName],
        function (err, result) {
            if (err) {
                console.log(err)
                callback(err, '')
            } else {
                if (result.length > 0) {
                    callback('', false)
                } else {
                    callback('', true)
                }
            }
        })
}