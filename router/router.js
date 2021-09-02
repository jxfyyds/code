const path = require('path')
const mysql = require('mysql')
const fs = require('fs')
const express = require('express'); 
const router = express.Router()
const multer = require('multer');
const myQuery = require('../model/query.js')
 // 设置上传的目录
 const upload = multer({ dest:path.join(__dirname,'../uploads')  })
 const { getUnixTime } = require('../util/tool.js');
// 连接数据库
const myuncle = require('../config/myuncle.js');
const connection = mysql.createConnection(myuncle);
//连接mysql
connection.connect(function (err) {
    if (err) {
        throw err;
    }
    console.log('connect mysql success');
});
//控制器
const ArticleController = require('../controller/ArticleController.js')
const userLoginController = require('../controller/userLoginController.js')
const ClassifylistController = require('../controller/ClassifylistController.js')

//后台首页
router.get('/',(req,res)=>{
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    res.render('index.html',{userInfo})
})
// 文章列表
 router.get('/article',ArticleController.index);
//回收列表
router.get('/recyclelist',ArticleController.recyclelist) 
//文章删除
router.get('/delete',ArticleController.delete)
//ajax文章删除
router.post('/ajaxdelete',ArticleController.ajaxdelete)
//添加页面
router.get('/add',ArticleController.add)
// 实现数据添加入库
router.post('/insert',upload.single('img'),ArticleController.insert )
//页面回显操作
router.get('/edit',ArticleController.edit)
// 实现文章更新入库操作
router.post('/update',upload.single('img'),ArticleController.update)
//实现文章加入回收站
router.get('/recycle',ArticleController.recycle)
//回收站还原
router.get('/restore', ArticleController.restore)
// 展示上传文件的表单
router.get('/addImg',ArticleController.addImg )
// 文章详情页面
router.get('/detail',ArticleController.detail)
//处理文件上传
router.post('/upload',upload.single('photo'),ArticleController.upload)
// axaj头像上传
router.post('/upoloadAvatar',upload.single('avatar'),ArticleController.upoloadAvatar)
//用户登录
router.get('/login',userLoginController.login)
//展示注册页面
router.get('/registo',userLoginController.registo)
//登录逻辑
router.post('/dologin',userLoginController.dologin)
//ajax登录
router.post('/ajaxlogin',userLoginController.ajaxlogin)
//ajax注册
router.post('/ajaxregisto',userLoginController.ajaxregisto)
router.post('/ajaxemail',userLoginController.ajaxemail)
//退出逻辑
router.get('/logout',userLoginController.logout)
//修改密码
router.post('/updatePassword',userLoginController.updatePassword )

//分类列表
router.get('/classify-list',ClassifylistController.list)
//分类数据api接口
router.get('/getCateData',ClassifylistController.getCateData)
//删除分类
router.post('/deleteCate',ClassifylistController.deleteCate)
//展示添加分类列表
router.get('/addCate',ClassifylistController.addCate)
//添加分类入库api
router.post('/ajaxAddCate',upload.single(''),ClassifylistController.ajaxAddCate)

//展示编辑分类页面
router.get('/editorCate',ClassifylistController.editor)
//回显
router.get('/getCateDetail',ClassifylistController.detail)

//更新分类
router.post('/updateCate',ClassifylistController.updateCate)
//回显富文本编辑内容
router.get('/editContent',ArticleController.editContent)
//富文本编辑
router.post('/updateArtilceContent',ArticleController.updateArtilceContent)

router.get('/demo',(req,res)=>{
    res.json({success:'成功',code:100000000})
})
module.exports = router;
