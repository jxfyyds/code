

const myQueryPromise = require('../model/queryPromise.js')
const { dateFormat, getNowDate } = require('../util/tool.js')

const ClassifylistController = {};
//展示添加列表
ClassifylistController.list = (req, res) => {
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    res.render('classify-list.html', { userInfo })
}
ClassifylistController.getCateData = async (req, res) => {
    // 1.获取所有分类
    let sql = "select * from mycategories order by id desc";
    let result = await myQueryPromise(sql)
    // 2.返回json数据响应给调用者
    result.forEach(item => {
        item['addtime'] = dateFormat(item['addtime'])
        item['duplicate'] = dateFormat(item['duplicate'], 'YYYY-MM-DD')
    })
    res.json(result)
}

//添加列表删除逻辑
ClassifylistController.deleteCate = async (req, res) => {
    let { cat_id } = req.body;

    let sql = `delete from mycategories where id =${cat_id}`
    try {
        let result = await myQueryPromise(sql)
        res.json({
            errcode: 200,
            message: "成功"
        })
    } catch (err) {
        res.json({
            errcode: -1,
            message: "删除失败"
        })
    }

}
//展示添加分类列表
ClassifylistController.addCate = (req, res) => {
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    res.render('addCate.html', { userInfo })
}
//添加分类列表入库
ClassifylistController.ajaxAddCate = function (req, res) {
    let { isshow, name } = req.body
    let sql = `select * from mycategories where name ='${name}'`
    myQueryPromise(sql).then(result => {
        if (result.length) {
            res.json({

                message: '分类名占用',
                errcode: -1
            })
        } else {
            let addtime = getNowDate();
            let duplicate = dateFormat();
            let sql = `insert into mycategories(name,isshow,addtime,duplicate)values('${name}','${isshow}','${addtime}','${duplicate}')`
            myQueryPromise(sql).then(result => {
                if (result.affectedRows) {
                    res.json({

                        message: "添加成功",
                        errcode: 200
                    })
                }
            })
        }
    })
}
//展示编辑分类页面
ClassifylistController.editor =  (req, res) => {
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    res.render('editorCate.html', { userInfo })
}
//回显
ClassifylistController.detail = async (req, res) => {
    let userInfo = JSON.parse(req.session.userInfo || '{}');
    const { cat_id } = req.query;
    let sql = `select * from mycategories where id = ${cat_id}`;
    try {
        let data = await myQueryPromise(sql)// [{}]
        res.json(data[0] || {})
    } catch (err) {
        res.json({})
    }
  
}


//编辑更新入库
ClassifylistController.updateCate = async (req, res) => {
    const { cat_id, name, isshow, content } = req.body;
    console.log(cat_id)
    let sql = `select id from mycategories where name='${name}' and id !='${cat_id}'`

    let result = await myQueryPromise(sql)
    if (result.length) {
        res.json({
            message: '分类名已被占用',
            errcode: -1
        })
        return;
    }
    let msql = `update mycategories set name = '${name}',isshow='${isshow}',content='${content}' where id ='${cat_id}'`
    let result2 = await myQueryPromise(msql)
    res.json({
        message: '更新成功',
        errcode: 200
    })
}
module.exports = ClassifylistController;
