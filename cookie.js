 const express = require('express')
 const session = require('express-session')



const app=express();
//导入cookie中间件
const cookieParser= require('cookie-parser');
//cookie解析中间件
app.use(cookieParser())

//seesion中间件
let options={
    name:"sessionId",
    secret:"qwrqweqwe1",
    cookie: { 	
        path: '/' ,  // 默认为'/'，即域的根路径。
        httpOnly: true,  // 默认为true,设置cookie只读，即不能通过document.cookie来获取
        secure: false,  // 设为true可适用于https网站的安全传输。若域名是http开头，网站只能设为false，否则cookie不写携带到后台服务器中。
        maxAge: null , //session会话保存在cookie中的有效期，单位：毫秒值， 默认为null,即设置的当前会话永不失效，一般都是需要设置有效期的，如php中的session有效期默认为24分钟。
        //设置有效期为24分钟，说明：24分钟内，不访问就会过期，如果24分钟内访问了。则有效期在初始化为24分钟。
    }  
}
app.use(session(options))


app.get('/cookle',(req,res)=>{
    res.sendFile(__dirname+ '/cookle.html')
})
app.get('/test',(req,res)=>{
    console.log('cookie',req.cookies.name)
    res.sendFile(__dirname+ '/test.html')
})
app.listen(6362,()=>{
    console.log('陈全启动了')
})