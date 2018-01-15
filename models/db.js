var DB_CONFIG = require("../config/mysql");
var mysql = require('mysql');
//连接数据库
var pool = mysql.createPool({
    host: DB_CONFIG.host,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    port: DB_CONFIG.port
});
exports.query=function(sql,options,callback){
    pool.getConnection(function(err,conn){
        if(err){
            console.log(err)
            callback(err,null,null);
        }else{
          conn.query(sql,options,function(err,results,fields){
                //释放连接
                conn.release();
                //事件驱动回调
                callback(err,results,fields);
            });
        }
    });
};
exports.pool=pool;

