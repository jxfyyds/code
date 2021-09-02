const mysql = require('mysql')
const myuncle = require('../config/myuncle.js');
const connection = mysql.createConnection(myuncle);

connection.connect(function(err){
    if(err){
        throw err;
    }
    console.log('连接数据库成功')
})
function myQuery(sql){
    return new Promise((resolve,reject)=>{
        connection.query(sql,(err,result)=>{
            if(err){
                reject(err)
            }else{
                resolve(result)
            }
        })
    })
   
}
module.exports = myQuery;