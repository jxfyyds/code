const myQuery = require('../model/query.js')
const myQueryPromise = require('../model/queryPromise.js')
let CryptoJS = require('crypto-js')
const { secret } = require("../config/config.js")
let { getNowDate } = require('../util/tool.js');
const e = require('express');
let userLoginController = {};
//输出表单页面
userLoginController.login = (req, res) => {
    if (req.session.userInfo) {
        res.redirect('/')
    } else {
        res.render('login.html')
    }

}
// 表单逻辑
// userLoginController.dologin = (req, res) => {
//     // console.log(req.body);
//     //接收用户信息
//     let { username, password } = req.body;
//     password = CryptoJS.MD5(`${password}${secret}`).toString()
//     //数据库匹配信息是否正确
//     let sql = ` select * from  userpage where username = '${username}' and  password= '${password}' `;
//     myQuery(sql, (err, rows) => {
//         if (rows.length > 0) {
//             let userInfo = rows[0];
//             req.session.userInfo = JSON.stringify(userInfo)
//             //更新用户最后的登录时间
//             let sql2 = `update UserPage set last_login_date='${getNowDate()} where use_id = ${userInfo.use_id} '`
//             myQuery(sql2, (err, result) => {
//                 if (err) {
//                     throw err;
//                 }
//                 res.redirect('/')
//             })
//         } else {
//             res.send("<script>alert('用户名或密码错误');location.href='/login'</script>")

//         }
//     })
// }
userLoginController.dologin = (req, res) => {
    // console.log(req.body);
    //接收用户信息
    let { username, password } = req.body;
    password = CryptoJS.MD5(`${password}${secret}`).toString()
    //数据库匹配信息是否正确
    let sql = ` select * from  userpage where username = '${username}' and  password= '${password}' `;
    myQueryPromise(sql).then( err, rows => {
        if (rows.length > 0) {
            let userInfo = rows[0];
            req.session.userInfo = JSON.stringify(userInfo)
            //更新用户最后的登录时间
            let sql2 = `update UserPage set last_login_date='${getNowDate()} where use_id = ${userInfo.use_id} '`
            myQueryPromise(sql2).then(err, result => {
                if (err) {
                    throw err;
                }
                res.redirect('/')
            })
        } else {
            res.send("<script>alert('用户名或密码错误');location.href='/login'</script>")

        }
    })
}
//登录页面逻辑4
userLoginController.ajaxlogin = (req, res) => {
    // console.log(req.body);
    //接收用户信息
    let { username, password } = req.body;

    password = CryptoJS.MD5(`${password}${secret}`).toString()
    //数据库匹配信息是否正确
    let sql = ` select * from  userpage where username = '${username}' and password= '${password}' `;
    myQueryPromise(sql).then ( rows => {
        let userInfo=""
        if (rows.length > 0) {
            userInfo = rows[0];
            req.session.userInfo = JSON.stringify(userInfo)
        }
        //更新用户最后的登录时间

        let sql2 = `update UserPage set last_login_date='${getNowDate()} where use_id = ${userInfo.use_id} '`
        return myQueryPromise(sql2)
    }).then(result =>{
        console.log(result.affectedRows)
        if(result.affectedRows){
            res.json({ errcode: 200, message: "成功" })
        }
        
    }).catch(err=>{
        res.json({ errcode: 220, message: "错误" })
    })
}
//注册页面
userLoginController.ajaxregisto = (req, res) => {
    let { username, email, password, repassword } = req.body;
    if ([username, email, password, repassword].includes('')) {
        res.json({
            message: "参数不能为空",
            errcode: -2

        })
        return;
    }

    if (password !== repassword) {
        res.json({
            message: "两次密码不一致",
            errcode: -3

        })
        return;
    }
    password = CryptoJS.MD5(`${password}${secret}`).toString()
    let last_login_date = getNowDate();
    let sql = `insert into userpage(username,password,email,last_login_date) value 
    ('${username}','${password}','${email}','${last_login_date}')`
    myQueryPromise(sql).then(result => {
        if (result.affectedRows) {
            res.json({
                errcode: 200,
                message: "success"
            })
        } else {
            res.json({
                errcode: -3,
                message: "服务器繁忙，请稍后再试"
            })
        }
    })
}


//登录页面
userLoginController.registo = (req, res) => {
    res.render('registo.html')
}
//用户退出逻辑
userLoginController.logout = (req, res) => {
    //删除用户信息
    req.session.destroy((err) => {
        if (err) throw err;
    })
    //重定向到登录页面
    res.redirect('/login')
}
//邮箱逻辑
userLoginController.ajaxemail = (req, res) => {
    let { email } = req.body;
    let sql = `select * from userpage where email = '${email}'`;
    myQueryPromise(sql).then ( rows => {
        if (rows.length > 0) {
            res.json({
                errcode: -5,
                message: '邮箱被占用'
            })
        } else {
            res.json({
                errcode: 200,
                message: '邮箱可用'
            })
        }
    })
}



//修改密码
userLoginController.updatePassword = (req, res) => {
    let { oldpwd, newpwd, renewpwd } = req.body;
    let { use_id } = JSON.parse(req.session.userInfo)
    let sql = `select password from userpage where use_id = ${use_id}`;
    myQueryPromise(sql).then(result => {
        oldpwd = CryptoJS.MD5(`${oldpwd}${secret}`).toString();
        if (result.length) {
            if (result[0].password !== oldpwd) {

                res.json({
                    errcode: -1,
                    message: '原密码输入错误'
                })
            } else {
                newpwd = CryptoJS.MD5(`${newpwd}${secret}`).toString();
                let sql = `update userpage set password ='${newpwd}' where use_id = ${use_id}`;
                return myQueryPromise(sql)

            }

        }

    }).then(result => {
        if (result.affectedRows) {
            res.json({
                errcode: 200,
                message: '更新密码成功'
            })
        } else {
            res.json({
                errcode: -2,
                message: '服务器繁忙，请稍后再试'
            })
        }
    })
}



module.exports = userLoginController;


