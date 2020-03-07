var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var formidable = require('formidable'); //上传功能的插件
// var multer = require('multer');//安装上传图片模块
var userDirPath = 'public/avatar'
var articalDirPath = 'public/artical'
var mongoose = require('mongoose')
const md5 = require('blueimp-md5'); //md加密的函数
const filter = { password: 0, __v: 0 } //查询过滤出指定的属性
const { UserModel, ArticalModel, CommentSchema, ReplaySchema, OrderSchema } = require('../db/models')
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
// 注册的路由
router.post('/register', function (req, res) {
  // 读取请求参数数据
  const { username, password } = req.body
  // 处理: 判断用户是否已经存在, 如果存在, 返回提示错误的信息, 如果不存在, 保存
  // 查询(根据username)
  UserModel.findOne({ username }, function (err, user) {
    // 如果user有值(已存在)
    if (user) {
      // 返回提示错误的信息
      res.send({ code: 1, msg: '此用户已存在' })
    } else { // 没值(不存在)
      // 保存
      new UserModel({
        username,
        password: md5(password),
        nickname: new Date().valueOf(),
        signature: "暂无签名",
        avatar: "/touxiang/touxiang.jpg"
      }).save(function (error, user) {
        // 生成一个cookie(userid: user._id), 并交给浏览器保存
        // res.cookie('userid', user._id, { maxAge: 1000 * 60 * 60 * 24 })
        req.session.userid = user._id
        // 返回包含user的json数据
        // const data = { username, _id: user._id } // 响应数据中不要携带password
        res.send({ code: 0, msg: "恭喜你,注册成功！" })
      })
    }
  })
  // 返回响应数据
})

//检测登录状态
router.get('/isLogin', function (req, res) {
  const userid = req.session.userid
  if (!userid) {
    return res.send({ code: 1, msg: '亲爱的游客,请您先登陆' })
  }
  // 查询
  UserModel.findOne({ _id: userid }, filter, function (err, user) {
    // 如果没有, 返回错误提示
    if (!user) {
      // 清除浏览器保存的userid
      delete req.session.userid
      res.send({ code: 1, msg: '亲爱的游客,请您先登陆' })
    } else {
      // 如果有, 返回user
      res.send({ code: 0, msg: "已登录", data: user })
    }
  })
})

//登录的路由  
router.post('/login', function (req, res) {
  const { username, password } = req.body
  UserModel.findOne({ username, password: md5(password) }, filter, function (err, user) {
    if (user) { //登录成功
      // res.cookie('userid', user._id, { maxAge: 1000 * 60 * 60 * 24 * 7 })
      req.session.userid = user._id
      res.send({ code: 0, msg: "恭喜你,登录成功!" })
    } else {  //登录失败
      res.send({ code: 1, msg: '用户名或密码不正确' })
    }
  })
})

//上传头像
router.post('/avatar', (req, res, next) => {
  //上传文件只能通过这个插件接收  file是上传文件 fields是其他的
  if (!fs.existsSync(userDirPath)) {
    fs.mkdirSync(userDirPath);//创建目录
  }
  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8'; //设置编辑
  form.uploadDir = userDirPath; //设置上传目录
  form.keepExtensions = true; //保留后缀
  form.maxFieldsSize = 4 * 1024 * 1024; //文件大小
  form.type = true;
  form.parse(req, function (err, fields, files) {
    if (Object.keys(files).length !== 0) {
      var oldname = files.file.path
      var newname = userDirPath + "/" + new Date().getTime() + '.jpg'
      fs.rename(oldname, newname, (err) => {
        if (err) {
          res.send({ code: 1, msg: "上传失败" })
          return;
        }
        var userid = req.session.userid
        UserModel.findByIdAndUpdate({ _id: userid }, { avatar: newname.substring(6) }, function (error, oldUser) {
          if (!oldUser) {
            // 通知浏览器删除userid cookie
            delete req.session.userid
            // 返回返回一个提示信息
            res.send({ code: 1, msg: '保存失败,登录已过期,请您先登陆' })
          } else {
            //上传成功，返回文件的相对路径 
            res.send({ code: 0, msg: "头像上传成功!" })
          }
        })
      })
    }
  });
})

//保存个人资料
router.post('/saveinfo', (req, res) => {
  // 从请求的session得到userid
  var userid = req.session.userid
  // 如果不存在, 直接返回一个提示信息
  if (!userid) {
    return res.send({ code: 1, msg: '登录已过期,请您先登陆' })
  }
  // 存在, 根据userid更新对应的user文档数据
  // 得到提交的用户数据
  const user = req.body // 没有_id
  UserModel.findByIdAndUpdate({ _id: userid }, user, function (error, oldUser) {
    if (!oldUser) {
      // 通知浏览器删除userid
      delete req.session.userid
      // 返回返回一个提示信息
      res.send({ code: 1, msg: '保存失败,登录已过期,请您先登陆' })
    } else {
      // 返回
      res.send({ code: 0, msg: '保存成功' })
    }
  })
})

// 获取用户资料信息
router.get('/userinfo', function (req, res) {
  // 从请求的cookie得到userid
  var userid = req.session.userid
  // 如果不存在, 直接返回一个提示信息
  if (!userid) {
    return res.send({ code: 1, msg: '亲爱的游客,请您先登陆' })
  }
  // 根据userid查询对应的user
  UserModel.findOne({ _id: userid }, filter, function (error, user) {
    if (user) {
      res.send({ code: 0, data: user })
    } else {
      delete req.session.userid
      res.send({ code: 1, msg: '登录已过期,请您先登陆' })
    }
  })
})

//发贴
router.post('/artical', (req, res, next) => {
  if (!fs.existsSync(articalDirPath)) {
    fs.mkdirSync(articalDirPath);//创建目录
  }
  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8'; //设置编辑
  form.uploadDir = articalDirPath; //设置上传目录
  form.keepExtensions = true; //保留后缀
  form.maxFieldsSize = 20 * 1024 * 1024; //文件大小
  form.multiples = true;
  form.parse(req, function (err, fields, files) {
    if (err) {
      res.send({ code: 1, msg: "上传失败" })
      return;
    }
    var filesUrl = [];
    if (files.file) {
      if (files.file.length > 1) {
        files.file.map((key, index) => {
          var filePath = key.path;
          var fileExt = filePath.substring(filePath.lastIndexOf('.'));
          //以当前时间戳对上传文件进行重命名
          var fileName = new Date().getTime() + index + fileExt;
          var targetFile = path.join(articalDirPath, fileName);
          //移动文件
          fs.renameSync(filePath, targetFile);
          // 文件的Url（相对路径）
          filesUrl.push('/artical/' + fileName)
        })
      } else {
        var filePath = files.file.path;
        var fileExt = filePath.substring(filePath.lastIndexOf('.'));
        //以当前时间戳对上传文件进行重命名
        var fileName = new Date().getTime() + fileExt;
        var targetFile = path.join(articalDirPath, fileName);
        //移动文件
        fs.renameSync(filePath, targetFile);
        // 文件的Url（相对路径）
        filesUrl.push('/artical/' + fileName)
      }
    }
    var userid = req.session.userid
    // 如果不存在, 直接返回一个提示信息
    if (!userid) {
      return res.send({ code: 1, msg: '亲爱的游客,请您先登陆' })
    }
    UserModel.findOne({ _id: userid }, filter, (error, user) => {
      if (user) {
        new ArticalModel({
          cid: user._id,
          author: user.nickname,
          content: fields.info,
          avatar: user.avatar,
          imagefile: filesUrl,
          date: new Date().getTime()
        }).save(function (error, artical) {
          res.send({ code: 0, msg: '发布成功!' })
        })
      } else {
        delete req.session.userid
        res.send({ code: 1, msg: '登录已过期,请您先登陆' })
      }
    })
  })
})

// 点赞
router.post('/praise', (req, res) => {
  const { commentid, userid } = req.body
  const commentId = mongoose.Types.ObjectId(commentid)
  // const userId = mongoose.Types.ObjectId(userid)
  ArticalModel.findByIdAndUpdate({ _id: commentId }, { $addToSet: { praise: userid } }, function (err, artical) {
    if (artical) {
      res.send({ code: 0, msg: '点赞成功!' })
    }
  })
})

// 取消点赞
router.post('/nopraise', (req, res) => {
  const { commentid, userid } = req.body
  const commentId = mongoose.Types.ObjectId(commentid)
  // const userId = mongoose.Types.ObjectId(userid)
  ArticalModel.findByIdAndUpdate({ _id: commentId }, { $pull: { praise: userid } }, function (err, artical) {
    if (artical) {
      res.send({ code: 0, msg: '取消成功!' })
    }
  })
})
// 评论点赞
router.post('/commentPraise', (req, res) => {
  const { commentid, userid } = req.body
  const commentId = mongoose.Types.ObjectId(commentid)
  // const userId = mongoose.Types.ObjectId(userid)
  CommentSchema.findByIdAndUpdate({ _id: commentId }, { $addToSet: { praise: userid } }, function (err, artical) {
    if (artical) {
      res.send({ code: 0, msg: '点赞成功!' })
    }
  })
})

// 取消评论点赞
router.post('/noCommentPraise', (req, res) => {
  const { commentid, userid } = req.body
  const commentId = mongoose.Types.ObjectId(commentid)
  // const userId = mongoose.Types.ObjectId(userid)
  CommentSchema.findByIdAndUpdate({ _id: commentId }, { $pull: { praise: userid } }, function (err, artical) {
    if (artical) {
      res.send({ code: 0, msg: '取消成功!' })
    }
  })
})

//帖子信息
router.get('/articalinfo', function (req, res) {
  const userid = req.session.userid
  // 如果不存在, 直接返回一个提示信息
  UserModel.findOne({ _id: userid }, (error, user) => {
    if (user) {
      ArticalModel.update({ cid: user._id }, { author: user.nickname, avatar: user.avatar }, { multi: true }, function (err, raw) {
        if (err) return err;
        console.log('raw', raw);
      })
    }
  })
  // 如果不存在, 直接返回一个提示信息
  ArticalModel.find({}).sort({ date: -1 }).exec(function (error, articalinfo) {
    const data = articalinfo
    res.send({ code: 0, data })
  })
})

//搜索帖子
router.get('/search/articalinfo', function (req, res) {
  const search = req.query.search
  ArticalModel.find(function (error, articalinfo) {
    const data = articalinfo.filter((item) => item.content.search(search) !== -1)
    res.send({ code: 0, data })
  })
})

// 评论区信息
router.get('/comment_page', (req, res) => {
  const id = mongoose.Types.ObjectId(req.query.id)
  ArticalModel.findOne({ _id: id }, (error, artical) => {
    if (error) {
      return error
    } else {
      res.send({ code: 0, data: artical })
    }
  })
})

// 评论
router.post('/comment', (req, res) => {
  const comment = req.body
  const articalId = mongoose.Types.ObjectId(comment.articalId)
  const userid = req.session.userid
  UserModel.findOne({ _id: userid }, (error, user) => {
    if (user) {
      new CommentSchema({
        avatar: user.avatar,
        author: user.nickname,
        userid: userid,
        createTime: new Date().getTime(),
        content: comment.comment,
        commentid: articalId
      }).save(function (error, commentinfo) {
        console.log('commentinfo', commentinfo)
        CommentSchema.find({ commentid: commentinfo.commentid }, (error, comment) => {
          if (comment) {
            ArticalModel.findByIdAndUpdate({ _id: commentinfo.commentid }, { commentNumber: comment.length }, function (err, oldArtical) {
              console.log('oldArtical', oldArtical)
            })
          }
        })
        res.send({ code: 0, msg: '评论成功!' })
      })
    }
  })
})

// 回显评论
router.get('/comment_info', (req, res) => {
  const userid = req.session.userid
  UserModel.findOne({ _id: userid }, (error, user) => {
    if (user) {
      CommentSchema.update({ userid: user._id }, { author: user.nickname, avatar: user.avatar }, { multi: true }, function (err, raw) {
        if (err) return err;
        console.log('raw', raw);
      })
    }
    const articalId = mongoose.Types.ObjectId(req.query.articalid)
    CommentSchema.find({ commentid: articalId }).sort({ createTime: -1 }).exec((error, comment) => {
      if (comment) {
        const data = comment
        res.send({ code: 0, data })
      }
    })
  })
})

// 回复
router.post('/replay', (req, res) => {
  const replay = req.body
  const commentId = mongoose.Types.ObjectId(replay.commentId)
  const userid = req.session.userid
  UserModel.findOne({ _id: userid }, (error, user) => {
    if (user) {
      new ReplaySchema({
        author: user.nickname,
        createTime: new Date().getTime(),
        content: replay.comment,
        replayid: commentId
      }).save(function (error, commentinfo) {
        if (commentinfo) {
          res.send({ code: 0, msg: '回复成功!' })
        }
      })
    }
  })
})

// 回显评论
router.get('/replay_info', (req, res) => {
  const commentId = mongoose.Types.ObjectId(req.query.commentid)
  ReplaySchema.find({ replayid: commentId }).sort({ createTime: -1 }).exec((error, replay) => {
    if (replay) {
      res.send({ code: 0, data: replay })
    }
  })
})

// 我赞过的
router.get('/praising', (req, res) => {
  const userId = req.session.userid
  ArticalModel.find({ praise: { $elemMatch: { $eq: userId } } }, (err, artical) => {
    if (artical) {
      res.send({ code: 0, data: artical })
    }
  })
})

// 我评论过的
router.get('/havecomment', (req, res) => {
  const userId = req.session.userid
  const articalid = []
  CommentSchema.find({ userid: userId }, (err, comment) => {
    if (comment) {
      comment.map((item) => {
        articalid.push(item.commentid)
      })
      ArticalModel.find({ _id: { $in: articalid } }, (err, list) => {
        if (list) {
          res.send({ code: 0, data: list })
        }
      })
    }
  })
})

// 我的帖子
router.get('/sendcomment', (req, res) => {
  const userId = req.session.userid
  ArticalModel.find({ cid: userId }, (err, artical) => {
    if (artical) {
      res.send({ code: 0, data: artical })
    }
  })
})

//删除我的帖子
router.post('/deletmycomment', (req, res) => {
  const commentIdArr = req.body
  const idArr = commentIdArr.map(item => mongoose.Types.ObjectId(item))
  ArticalModel.deleteMany({ _id: { $in: idArr } }, (err, orderInfo) => {
    if (orderInfo) {
      res.send({ code: 0, msg: '删除成功' })
    }
  })
})

//生成订单
router.post('/order', (req, res) => {
  const order = req.body
  const userid = req.session.userid
  new OrderSchema({
    ordername: order.ordername,
    createTime: new Date().getTime(),
    price: order.price,
    number: order.num,
    orderimg: order.orderimg,
    orderid: userid,
    state: order.state
  }).save((error, orderInfo) => {
    if (orderInfo.state === 1) {
      res.send({ code: 1, msg: '待支付' })
    } else {
      res.send({ code: 0, msg: '已支付' })
    }
  })
})

//查看所有订单
router.get('/orderinfo', (req, res) => {
  const userid = req.session.userid
  OrderSchema.find({ orderid: userid }, (err, orderInfo) => {
    if (orderInfo) {
      console.log('orderInfo', orderInfo)
      res.send({ code: 0, data: orderInfo })
    }
  })
})

//订单支付信息
router.get('/order/payinfo', (req, res) => {
  const id = mongoose.Types.ObjectId(req.query.id)
  OrderSchema.find({ _id: id }, (err, orderInfo) => {
    if (orderInfo) {
      res.send({ code: 0, data: orderInfo[0] })
    }
  })
})

//订单去支付
router.get('/order/topay', (req, res) => {
  const id = mongoose.Types.ObjectId(req.query.id)
  OrderSchema.update({ _id: id }, { state: 0 }, (err, orderInfo) => {
    if (orderInfo) {
      res.send({ code: 0, msg: '支付成功!' })
    }
  })
})

//删除订单
router.post('/deleteorder', (req, res) => {
  const orderIdObj = req.body
  const orderId = mongoose.Types.ObjectId(orderIdObj.orderid)
  OrderSchema.remove({ _id: orderId }, (err, orderInfo) => {
    if (orderInfo) {
      res.send({ code: 0, msg: '删除成功' })
    }
  })
})

//退出登录
router.get('/loginout', function (req, res) {
  // 清除浏览器保存的userid的cookie
  delete req.session.userid
  // 返回数据
  res.send({ code: 0, msg: '您已经成功退出登录!' })
})

//随机获取casoursel
router.get('/carousel/img', function (req, res) {
  const data = require('../data/carousel.json')
  let carousel = []
  let index = undefined
  for (let i = 0; i < 8; i++) {
    index = Math.floor(Math.random() * 8)
    if (carousel.length < 4) {
      if (!carousel.includes(data[index])) {
        carousel.push(data[index])
      }
      console.log(carousel.length)
    }
  }
  setTimeout(function () {
    if (carousel.length === 4) {
      res.send({ code: 0, data: carousel })
    }
  }, 300)
})

//获取hot_spots数据
router.get('/hotspots', function (req, res) {
  setTimeout(function () {
    const data = require('../data/hot_spots.json')
    res.send({ code: 0, data })
  }, 300)
})

//获取hot_spots详情数据
router.get('/hotspots/detail', function (req, res) {
  const name = req.query.name
  const id = parseInt(req.query.id)
  setTimeout(function () {
    const spotsData = require('../data/hot_spots.json')
    for (const data of spotsData) {
      if (data.name === name) {
        for (const address of data.address) {
          if (address.id === id) {
            res.send({ code: 0, data: address })
          }
        }
      }
    }
  }, 300)
})

//获取hot_food数据
router.get('/hotfood', function (req, res) {
  setTimeout(function () {
    const data = require('../data/hot_food.json')
    res.send({ code: 0, data })
  }, 300)
})

//获取hot_food详情数据
router.get('/food/detail', function (req, res) {
  const name = req.query.name
  const id = parseInt(req.query.id)
  setTimeout(function () {
    const foodsData = require('../data/hot_food.json')
    for (const data of foodsData) {
      if (data.name === name) {
        for (const food of data.food) {
          if (food.id === id) {
            res.send({ code: 0, data: food })
          }
        }
      }
    }
  }, 300)
})

//获取city数据
router.get('/city', function (req, res) {
  setTimeout(function () {
    const data = require('../data/city.json')
    res.send({ code: 0, data })
  }, 300)
})
module.exports = router;
