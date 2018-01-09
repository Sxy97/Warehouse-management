var writeJson = require('../models/writeJson')
//登录拦截器
exports.interceptor=function (req, res,next) {
    var path = req.originalUrl;
    if(needLogin(path)) {
        var login = req.session.user;
        if(!login){
            writeJson(res,0,"未登录")
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
    var noLoginPath = ['/login']; //不需要登陆的地址
    for(var i =0; i< noLoginPath.length;i++) {
        var item = noLoginPath[i];
        if(path == item || (item + '/') == path){
            return false;
        }
    }
    return true;
}
//拦截是否为管理员
var needAdmin=function(path){
    var loginadmin=['/user/add','/user/updatestate','/user/delete','/user/list','/user/findone/*']//需要超级管理员权限
    for(var i=0;i<loginadmin.length;i++){
        var item=loginadmin[i];
        if(path == item || (item + '/') == path){
            return true
        }
    }
    return false
}