var express = require('express');
var router = express.Router();
var userController=require('../controller/userController')
var inputController=require('../controller/inputController')
var outputController=require('../controller/outputController')
var queryController=require('../controller/queryController')
var wordController=require('../controller/wordController')

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('login')
});
//跳转出库管理
router.get('/stockOut', function(req, res, next) {
    res.render('stockOut')
});
//跳转入库管理
router.get('/stockIn',function(req, res, next){
    res.render('stockIn')
})
//跳转检索查询
router.get('/retrievalQuery',function(req, res, next){
    res.render('retrievalQuery')
})
//跳转用户管理
router.get('/userManagement',function(req, res, next){
    res.render('userManagement')
})
//跳转个人中心
router.get('/personal',function(req, res, next){
    res.render('personal')
})
/**
 * 用户模块
 */
router.post('/login',userController.login)
router.get('/outlogin',userController.outlogin)
router.post('/user/add',userController.add)
router.post('/user/updatestate',userController.updatestate)
router.post('/user/delete',userController.delete)
router.post('/user/updatePassword',userController.updatePassword)
router.get('/user/list',userController.list)
router.get('/user/findone/:uid',userController.findonebyId)
//TODO 模糊查询用户名 登录账号
router.post('/user/find',userController.find)
/**
 * 入库管理
 */
router.post('/input/add',inputController.add)
router.get('/input/list',inputController.list)
/**
 * 出库管理
 */
router.post('/output/fuzzyFindSname',outputController.fuzzyFindSname)
router.post('/output/findSize',outputController.findSize)

router.post('/output/fuzzyFindSize',outputController.fuzzyFindSize)
router.post('/output/findSname',outputController.findSname)

router.post('/output/callback',outputController.callback)

router.post('/output/add',outputController.add)
router.get('/output/list',outputController.list)

/**
 * 检索查询
 */

//检索出库单
router.post('/query/output',queryController.output)
//检索入库单
router.post('/query/input',queryController.input)
//检索商品
router.post('/query/goods',queryController.goods)
router.post('/query/shopRecord',queryController.shopRecord)
router.get('/query/goodslist',queryController.goodslist)

router.get('/query/findByOid/:oid',queryController.findByOid)

/**
 * 生成word文档
 */
router.get('/word/out/:oid',wordController.exportWord)

/**
 * 入库出库单签字后图片保存 TODO （保存到服务器/用户本地）
 */

module.exports = router;
