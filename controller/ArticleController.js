//文章控制器
const path = require('path')
const mysql = require('mysql')
const fs = require('fs')
const { getUnixTime } = require('../util/tool.js');
const ArticleController = {}
//导入模型
const myQuery = require('../model/query.js')
const myQueryPromise = require('../model/queryPromise.js')



// 只要是一种映射的数据关系，都可以用对象形式来简化if elseif
let statusTextMap = {
    0: '<span class="cgray">待审核</span>',
    1: '<span class="cgreen">审核通过</span>',
    2: '<span class="cred">审核失败</span>'
}

// 文章列表
ArticleController.index = (req, res) => {
    let userInfo = JSON.parse(req.session.userInfo)
    // 1. 编写sql语句
    let sql = `select t1.*,t2.name from mypost  as t1 
                left join mycategories t2 on t1.cat_id = t2.id 
               where  t1.is_delete = 0 order by t1.id desc`;
    // 2. 执行sql
    myQueryPromise(sql).then ( rows => {
        let data = rows.map((item) => {
            item.status_text = statusTextMap[item.state]
            return item;
        })
        //  
        // 3. 把查询出来的数据分配到模板引擎中
        res.render('article-list.html', { myposts: data, userInfo})
    })

}
// 文章回收列表
ArticleController.recyclelist = (req, res) => {
    // 1. 编写sql语句
    let sql = `select t1.*,t2.name from mypost  as t1 
                left join mycategories t2 on t1.cat_id = t2.id 
               where t1.state = 1 and t1.is_delete = 1 order by t1.id desc`;
    // 2. 执行sql
    myQueryPromise(sql).then (rows => {
        let userInfo = JSON.parse( req.session.userInfo || '{}' );
        let data = rows.map((item) => {
            item.status_text = statusTextMap[item.state]
            return item;
        })
        //  
        // 3. 把查询出来的数据分配到模板引擎中
        res.render('recycle.html', { myposts: data ,userInfo})
    })

}
// 文章删除
ArticleController.delete = (req, res) => {
    //1. 接受要删除的文章的id
    let { id, img } = req.query;
    //2. 编写sql语句，删除
    let sql = `delete from mypost where id = ${id}`;
    myQueryPromise(sql).then ( result => {
        // 3.判断结果
        if (result.affectedRows) {
            // 重定向到首页

            if (img) {
                let oldpath = path.join(__dirname, '/article-list.html', img)
                fs.unlink(oldpath, (err) => {

                })
            }
            res.redirect('/article-list.html')
        } else {
            // 删除失败，响应js代码，让浏览器执行
            res.send("<script>alert('删除失败'); location.href = '/article-list'; </script>")
        }
    })

}





//ajax删除
ArticleController.ajaxdelete = (req, res) => {
    //1. 接受要删除的文章的id
    let { id, img } = req.body;
    //2. 编写sql语句，删除
    let sql = `delete from mypost where id = ${id}`;
    myQueryPromise(sql).then ( result => {
        // 3.判断结果
        if (result.affectedRows) {
            // 重定向到首页

            if (img) {
                let oldpath = path.join(__dirname, '/article-list', img)
                fs.unlink(oldpath, (err) => {

                })
            }
            res.json({
            errcode:200,
            message:'成功'
                
            })
        } else {
        res.json({
            errcode:220,
            message:'失败'
        })
        }
    })

}

// 展示一个添加文章的表单页面
ArticleController.add = (req, res) => {
    // 取出所有的分类数据分配到模板中
    let userInfo = JSON.parse( req.session.userInfo || '{}' );
    let sql = "select * from mycategories";
    myQueryPromise(sql).then ( rows => {
        res.render('add.html', { cats: rows ,userInfo})
    })
}
// 实现数据入库
ArticleController.insert = (req, res) => {
    let imgPath = '';
    if (req.file) {
        let { originalname, filename } = req.file

        let ext = originalname.substring(originalname.indexOf('.'));
        // 把上传成功后的文件进行重命名
        let oldPath = path.join(__dirname, '../', 'uploads', filename);
        let newPath = path.join(__dirname, '../', 'uploads', filename) + ext;
        // 数据库记录存放的路径 
        imgPath = `uploads/${filename}${ext}`
        fs.renameSync(oldPath, newPath)

    }
    // 1.接受post参数
    let { title, author, cat_id,  content,status } = req.body
    // console.log(req.body);
    let nowTime = getUnixTime();
    // 2.编写sql语句插入到文章表中
    let sql = `insert into mypost(title,img,author,cat_id,state,content,addtime) values('${title}','${imgPath}','${author}','${cat_id}','${status}','${content}','${nowTime}')`;

    myQueryPromise(sql).then ( result => {
        // 3.判断结果
        if (result.affectedRows) {
            res.send("<script>alert('成功');location.href='/';</script>")
        } else {
            res.send("<script>alert('失败');location.href='/add';</script>")
        }
    })


}
//页面回显操作
ArticleController.edit = (req, res) => {
    //1.接受参数id
    let { id } = req.query;
    //2.编写sql语句查询当前文章的数据分配给模板
    let sql1 = `select * from mypost where id=${id}`;
let article = '';
let cats = '';

    myQueryPromise(sql1).then (rows1=> {
        article = rows1[0]
        let sql2 = "select * from mycategories";
        return myQueryPromise(sql2)
    }).then((row2=>{
        cats = row2
        res.render('edit.html',{
            article,cats
        })
    })) 
}
// 实现文章更新入库操作
ArticleController.update = (req, res) => {
    let { id, title, author, status, cat_id, content, oldIimg } = req.body

    let duplicate = getUnixTime();
    let imgPath = '';
    if (req.file) {
        let { originalname, filename } = req.file

        let ext = originalname.substring(originalname.indexOf('.'));
        // 把上传成功后的文件进行重命名
        let oldPath = path.join(__dirname, '../', 'uploads', filename);
        let newPath = path.join(__dirname, '../', 'uploads', filename) + ext;
        // 数据库记录存放的路径 
        imgPath = `uploads/${filename}${ext}`
        fs.renameSync(oldPath, newPath)
    } else {
        imgPath = oldIimg;
    }

    let sql = `update mypost set title = '${title}',img = '${imgPath}',author= '${author}',state= '${status}',
                      cat_id= '${cat_id}',content = '${content}',duplicate= '${duplicate}' where id = '${id}'`;
                      myQueryPromise(sql).then ( result => {
        if (result.affectedRows) {
            //上传新图把老图上除掉
            if (req.file) {
                let oldPath = path.join(__dirname, '../', oldIimg)
                fs.unlink(oldPath, (err) => {

                })

            }
            res.redirect('/')
        } else {
            res.send('<script>alert("编辑失败");location.href="/";</script>')
        }
    })
}
//实现文章加入回收站
ArticleController.recycle = (req, res) => {
    let { id = 0 } = req.query
    $sql = `update mypost set is_delete = 1 where id = ${id}`;
    myQueryPromise($sql).then ( result => {
        let { affectedRows } = result;
        if (affectedRows) {
            //重定向
            res.redirect('/recyclelist')
        } else {
            res.send("<script>alert('加入失败'); location.href='/article';</script>")
        }
    })
}
//回收站还原
ArticleController.restore = (req, res) => {
    let { id = 0 } = req.query
    $sql = `update mypost set is_delete = 0 where id = ${id}`;
    myQueryPromise($sql).then ( result => {
        let { affectedRows } = result;
        if (affectedRows) {
            //重定向
            res.redirect('/article')
        } else {
            res.send("<script>alert('还原失败'); location.href='/recycle';</script>")
        }
    })
}
// 展示上传文件的表单
ArticleController.addImg = (req, res) => {
    res.render('addimg.html')
}

//处理文件上传
ArticleController.upload = (req, res) => {
    let { originalname, filename, destination } = req.file
    // console.log(req.file)
    let ext = originalname.substring(originalname.indexOf('.'));
    // 把上传成功后的文件进行重命名
    let oldPath = path.join(__dirname, destination, filename);
    let newPath = path.join(__dirname, destination, filename) + ext;
    fs.renameSync(oldPath, newPath)

    res.send('upload success')
}
// axaj头像上传
ArticleController.upoloadAvatar =(req,res)=>{
    let { originalname, filename, destination } = req.file
    // console.log(req.file)
    let ext = originalname.substring(originalname.indexOf('.'));
    // 把上传成功后的文件进行重命名
    let oldPath = path.join(__dirname, '../','uploads', filename);
    let newPath = path.join(__dirname,'../','uploads', filename) + ext;
    fs.renameSync(oldPath, newPath)
    //把上传成功的图片路径重新更新到用户表中
    let userInfo = JSON.parse(req.session.userInfo);
    //获取当前登录用户id
    let {use_id} = userInfo;
    let avatar = 'uploads/' + filename + ext;
    
    let sql = `update userpage set avatar = '${avatar}' where use_id = ${use_id}`
    myQueryPromise(sql).then(result =>{
        userInfo.avatar = avatar;
        req.session.userInfo = JSON.stringify(userInfo)
        res.json({
            errcode:200,
            message:"上传成功",
            src:avatar
        })
    })
}


// 文章详情查看
ArticleController.detail = (req,res)=>{
    let {id} = req.query;
    let sql = `select t1.*,t2.name from mypost t1 left join mycategories t2 on t1.cat_id = t2.id where t1.id=${id} `
    myQueryPromise(sql).then(rows =>{
        console.log(rows);
        // 渲染一个模板
        res.render('detail.html',{myposts:rows[0]    })
    })
    
}


//富文本编辑页面回显
ArticleController.editContent=(req,res)=>{
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    res.render('editContent.html',{userInfo})
}
//富文本编辑
ArticleController.updateArtilceContent= async(req,res)=>{
    let {id,content} = req.body;
    let sql = `update mypost set content ='${content}' where id='${id}'`
    let result= await myQueryPromise(sql)
    res.json({
        errcode:200,
        message:"编辑成功"
    }) 
}
module.exports = ArticleController;