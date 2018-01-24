var sd = require('silly-datetime');
var db = require("../models/db");

//生成订单编号
async function makeOrderId(type, callback) {
    try{
        var code = Math.floor(Math.random() * 9000) + 1000;
        //var date = code + sd.format(new Date(), "YYYYMMDDhhmmss")
        var myData = new Date();
        var date = code+myData.getTime().toString();
        console.log(date)
        if (type == 1) {
            date = "RK" + date
        } else {
            date = "CK" + date
        }
        if(await findOid(date)){
            makeOrderId(type,callback)
        }else{
            callback(date)
        }
    }catch(err){
        console.log(err)
        makeOrderId(type,callback)
    }
}
function findOid(date){
    return new Promise(function(resolve,reject){
        db.query('select count(1) as num from orders where oid =?',[date],function(err,num){
            if(err){
                console.log(err)
                reject(true)
            }else{
                if(num[0].num>0){
                    resolve(true)
                }else{
                    resolve(false)
                }
            }
        })
    })
}
module.exports = makeOrderId