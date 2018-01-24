var writeJson = require('../models/writeJson')
//登录拦截器
exports.interceptor=function (req, res,next) {
    var path = req.originalUrl;
    if(needLogin(path)) {
        var login = req.session.user;
        if(!login){
            res.render('login')
            // writeJson(res,0,"未登录")
            return
        }else{
            if(needAdmin(path)){
                var state=req.session.user.state;
                if(state!=2){
                    res.json({ "code": 0, "msg":  "没有权限操作" });
                    return
                }
            }
        }
    }
    next();
}
//拦截是否登录
var needLogin = function(path){
    let noLoginPath = ['/','/login']; //不需要登陆的地址
    if(noLoginPath.includes(path) || noLoginPath.includes(path+'/')){
        return false
    }else {
        return true
    }
}
//拦截是否为管理员
var needAdmin=function(path){
    //需要超级管理员权限
    let loginadmin=['/user/add','/user/updatestate','/user/delete','/user/list','/user/findone/*','/user/find','/userManagement']
    if(loginadmin.includes(path) || loginadmin.includes(path+'/')){
        return true
    }else {
        return false
    }
}