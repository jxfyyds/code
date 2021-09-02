
const express = require('express');
const moment = require('moment')
const path = require('path')
const artTemplate = require('art-template');
const express_template = require('express-art-template');
const session = require('express-session')
const app = express();
const favicon = require('serve-favicon')

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

//初始化session数据
app.use(session({
    name: 'SESSIONID',  // session会话名称存储在cookie中的键名
    secret: '%#%￥#……%￥', // 必填项，用户session会话加密（防止用户篡改cookie）
    cookie: {  //设置session在cookie中的其他选项配置
        path: '/',
        secure: false,  //默认为false, true 只针对于域名https协议
        maxAge: 60000 * 24,  //设置有效期为24分钟，说明：24分钟内，不访问就会过期，如果24分钟内访问了。则有效期重新初始化为24分钟。
    }
}))




// 设置托管静态资源中间件
app.use('/uploads', express.static(path.join(__dirname + '/uploads')));
// app.use('/static', express.static(path.join(__dirname + '/static')));
app.use('/img', express.static(path.join(__dirname + '/img')));
app.use('/layui-v2.6.8',express.static(path.join(__dirname + '/layui-v2.6.8')) ) ; 


// app.use(express.json()) // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded


//配置模板的路径
app.set('views', __dirname + '/views/');
//设置express_template模板后缀为.html的文件(不设这句话，模板文件的后缀默认是.art)
app.engine('html', express_template);
//设置视图引擎为上面的html
app.set('view engine', 'html');

//定义一个过滤器dateFormat
artTemplate.defaults.imports.dateFormat = function (time, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment.unix(time).format(format);
}
//登录时间过滤器
artTemplate.defaults.imports.dealDate = function (date, format = 'YYYY-MM-DD HH:mm:ss') {
    return moment(date).format(format);
}

//中间件统一校验session权限
app.use('/', (req, res, next) => {
    let { flag } = req.body
    //login(登录)logout（退出）
    let path = req.path.toLowerCase();
    let unPermission = ['/login', '/logout', '/dologin', '/ajaxlogin', '/registo', '/ajaxregisto', '/ajaxemail', '/ajaxdelete','/demo']
    if (!unPermission.includes(path)) {
        if (req.session.userInfo) {
            next()
        } else {
            if (flag === 'ajax') {
                res.json({
                    errcode: 304,
                    message: "请重新登录"

                })
                return;
            } else {
                res.redirect('/login')
                return;
            }
        }
    } else {
        next()
    }
})

///挂载路由中间件
const router = require('./router/router.js')
app.use(router)

app.listen(5686, () => {
    console.log('server is running at port 5686')
})