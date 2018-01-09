//返回json信息
function writeJson (res, code, msg, data) {
    if (data) {
        res.json({code: code, data: data})
    } else {
        res.json({code: code, msg: msg})
    }

}
module.exports=writeJson