const express = require('express');
const path = require('path')
const mysql = require('mysql')
const moment = require('moment')
const { getUnixTime } = require('./util/tool.js');
const artTemplate = require('art-template');
const express_template = require('express-art-template');
const { fstat } = require('fs');
const fs = require('fs')
const app = express();


// 设置托管静态资源中间件
app.use('/uploads',express.static(path.join(__dirname + '/uploads')) ) ; 
app.use('/layui-v2.6.8',express.static(path.join(__dirname + '/layui-v2.6.8')) ) ; 


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
 var multer = require('multer')
 // 设置上传的目录
 var upload = multer({ dest: 'uploads/' })
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

// 连接数据库
var connection = mysql.createConnection({
    host: "localhost", //主机
    port: '3306',	//端口
    user: "root",	//用户名
    password: "196128",	//密码
    database: "myuncle"		//数据库
});

//连接mysql
connection.connect(function (err) {
    if (err) {
        throw err;
    }
    console.log('connect mysql success');
});


// 只要是一种映射的数据关系，都可以用对象形式来简化if elseif
let statusTextMap = {
    0: '<span class="cgray">待审核</span>',
    1: '<span class="cgreen">审核通过</span>',
    2: '<span class="cred">审核失败</span>'
}

// 文章列表
app.get('/', (req, res) => {
    // 1. 编写sql语句
    let sql = `select t1.*,t2.name from mypost  as t1 
                left join mycategories t2 on t1.cat_id = t2.id 
               where t1.state = 1 and t1.is_delete = 0 order by t1.id desc`;
    // 2. 执行sql
    connection.query(sql, (err, rows) => {
        // console.log('异步回调')
        // console.log(rows); // [{title,status},{}]
        let data = rows.map((item) => {
            item.status_text = statusTextMap[item.state]
            return item;
        })
        //  
        // 3. 把查询出来的数据分配到模板引擎中
        res.render('index.html', { myposts: data })
    })

})


// 文章回收列表
app.get('/recyclelist', (req, res) => {
    // 1. 编写sql语句
    let sql = `select t1.*,t2.name from mypost  as t1 
                left join mycategories t2 on t1.cat_id = t2.id 
               where t1.state = 1 and t1.is_delete = 1 order by t1.id desc`;
    // 2. 执行sql
    connection.query(sql, (err, rows) => {
        let data = rows.map((item) => {
            item.status_text = statusTextMap[item.state]
            return item;
        })
        //  
        // 3. 把查询出来的数据分配到模板引擎中
        res.render('recycle.html', { myposts: data })
    })

})

// 文章删除
app.get('/delete', (req, res) => {
    //1. 接受要删除的文章的id
    let { id } = req.query;
    //2. 编写sql语句，删除
    let sql = `delete from mypost where id = ${id}`;
    connection.query(sql, (err, result) => {
        // 3.判断结果
        if (result.affectedRows) {
            // 删除成功 ，重定向到首页
            res.redirect('/')
        } else {
            // 删除失败，响应js代码，让浏览器执行
            res.send("<script>alert('删除失败'); location.href = '/'; </script>")
        }
    })

})



// 展示一个添加文章的表单页面
app.get('/add', (req, res) => {
    // 取出所有的分类数据分配到模板中
    let sql = "select * from mycategories";
    connection.query(sql, (err, rows) => {
        res.render('add.html', { cats: rows })
    })
})

// 实现数据添加入库
app.post('/insert',upload.single('img'), (req, res) => {
    let imgPath=''
    if(req.file){
        let {originalname,filename,destination} = req.file
        console.log(req.file)
        let ext = originalname.substring( originalname.indexOf('.') );
        // 把上传成功后的文件进行重命名
        let oldPath = path.join( __dirname,destination,filename);
         let newPath = path.join( __dirname,destination,filename) + ext;
        // 数据库记录存放的路径 
        imgPath = `${destination}${filename}${ext}`
        fs.renameSync(oldPath,newPath)
    
    }
    // 1.接受post参数
    let { title, author, cat_id, statuse, content } = req.body
    // 2.编写sql语句插入到文章表中
    let sql = 'insert into mypost(title,img,author,cat_id,state,content,addtime) values(?,?,?,?,?,?,?)';
    let nowTime = getUnixTime();
    let bind = [title,imgPath, author, cat_id, statuse, content, nowTime]

    connection.query(sql, bind, (err, result) => {
        console.log(bind)
        // 3.判断结果
        if (result.affectedRows) {
            res.send("<script>alert('成功');location.href='/';</script>")
        } else {
            res.send("<script>alert('失败');location.href='/add';</script>")
        }
    })


})

//页面回显操作
app.get('/edit', (req, res) => {
    //1.接受参数id
    let { id } = req.query;
    //2.编写sql语句查询当前文章的数据分配给模板
    let sql1 = `select * from mypost where id=${id}`;


    connection.query(sql1, (err, rows1) => {
        let sql2 = "select * from mycategories";
        connection.query(sql2, (err, rows2) => {
            res.render('edit.html', {
                article: rows1[0],
                cats: rows2
            })
        })


    })
})

// 实现文章更新入库操作
app.post('/update', (req, res) => {
    let { id, title, author, status, cat_id, content } = req.body

    let duplicate = getUnixTime();
    let bind = [title, author, status, cat_id, content, duplicate, id]
    let sql = `update mypost set title = ?,author= ?,state= ?,cat_id= ?,content = ?,duplicate= ? where id = ?`
    connection.query(sql, bind, (err, result) => {
        console.log(duplicate)
        if (result.affectedRows) {
            res.redirect('/')
        } else {
            res.send('<script>alert("编辑失败");location.href="/";</script>')
        }
    })
})
//实现文章加入回收站

app.get('/recycle', (req, res) => {
    let { id = 0 } = req.query
    $sql = `update mypost set is_delete = 1 where id = ${id}`;
    connection.query($sql,(err, result) => {
        let { affectedRows } = result;
        if (affectedRows) {
            //重定向
            res.redirect('/')
        } else {
            res.send("<script>alert('加入失败'); location.href='/';</script>")
        }
    })
})
//回收站还原
app.get('/restore', (req, res) => {
    let { id = 0 } = req.query
    $sql = `update mypost set is_delete = 0 where id = ${id}`;
    connection.query($sql,(err, result) => {
        let { affectedRows } = result;
        if (affectedRows) {
            //重定向
            res.redirect('/')
        } else {
            res.send("<script>alert('加入失败'); location.href='/';</script>")
        }
    })
})

// 展示上传文件的表单
app.get('/addImg',(req,res)=>{
    res.render('addimg.html')
})
//处理文件上传
app.post('/upload',upload.single('photo'),(req,res)=>{
    let {originalname,filename,destination} = req.file
    console.log(req.file)
    let ext = originalname.substring( originalname.indexOf('.') ); 
    // 把上传成功后的文件进行重命名
    let oldPath = path.join( __dirname,destination,filename);
    let newPath = path.join( __dirname,destination,filename) + ext;
    fs.renameSync(oldPath,newPath)
    
    res.send('upload success')
})

app.listen(8899, () => {
    console.log('server is running at port 8899')
})