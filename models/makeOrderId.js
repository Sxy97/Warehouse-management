var sd = require('silly-datetime');
var db = require("../models/db");

//生成订单编号
function makeOrderId(type,callback) {
    var code = Math.floor(Math.random() * 900) + 100;
    var date = code + sd.format(new Date(), "YYYYMMDDhhmmss")
    if(type == 1){
        date="RK"+date
    }else{
        date="CK"+date
    }

    db.query('select * from orders where oid = ?', [date],
        function (err, result) {
            if (err) {
                console.log(err)
                makeOrderId(type,callback)
            } else {
                if (result.length > 0) {
                    makeOrderId(type,callback)
                } else {
                    callback(date)
                }
            }
        })
}
module.exports = makeOrderId



