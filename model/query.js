const mysql = require('mysql')
const myuncle = require('../config/myuncle.js');
const connection = mysql.createConnection(myuncle);

connection.connect(function(err){
    if(err){
        throw err;
    }
    console.log('连接数据库成功')
})


function myQuery(sql,callback){
    connection.query(sql,callback);
}



// 暴露于模块
module.exports = myQuery;
