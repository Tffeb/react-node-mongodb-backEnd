// 包含n个操作数据库集合数据的Model模块
// 1.1连接数据库
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// 1.2连接指定的数据库
mongoose.connect('mongodb://localhost:27017/tourapp_server', { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
  if (err) {
    console.log('db connect error:' + err)
  } else {
    console.log('db connect success!')
  }
})
mongoose.set('useFindAndModify', false)
// //1.3获取连接对象
// const conn = mongoose.connection
// //1.4绑定连接完成的监听
// conn.on('connected', function () {
//     console.log('db connect success!')
// })

// 2.定义出对应特定集合的Model并向外暴露
//定义用户集合
const userSchema = new Schema({
  //指定文档结构:属性名/属性值的类型，是否是必须的，默认值
  username: { type: String, required: true },
  password: { type: String, required: true },
  nickname: { type: String },
  signature: { type: String },
  avatar: { type: String }
})

//定义帖子集合
const articalSchema = new Schema({
  //指定文档结构:属性名/属性值的类型，是否是必须的，默认值
  cid: { type: Schema.Types.ObjectId },
  content: { type: String },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  imagefile: [],
  date: { type: String },
  commentNumber: { type: Number },
  praise: []
})

//定义评论集合
const commentSchema = new Schema({
  avatar: { type: String, required: true },
  author: { type: String, required: true },
  praise: [],
  createTime: { type: String },
  content: { type: String },
  userid: { type: Schema.Types.ObjectId },
  commentid: { type: Schema.Types.ObjectId }
})

//定义回复集合
const replaySchema = new Schema({
  author: { type: String, required: true },
  createTime: { type: String },
  content: { type: String },
  replayid: { type: Schema.Types.ObjectId }
})

//定义订单集合
const orderSchema = new Schema({
  ordername: { type: String, required: true },
  createTime: { type: String },
  price: { type: Number },
  number: { type: Number },
  orderimg: { type: String },
  orderid: { type: Schema.Types.ObjectId },
  state: { type: Number }
})

//2.1定义Model(与集合对应，可以操作集合)
const UserModel = mongoose.model('user', userSchema)
const ArticalModel = mongoose.model('artical', articalSchema)
const CommentSchema = mongoose.model('comment', commentSchema)
const ReplaySchema = mongoose.model('replay', replaySchema)
const OrderSchema = mongoose.model('order', orderSchema)
exports.UserModel = UserModel
exports.ArticalModel = ArticalModel
exports.CommentSchema = CommentSchema
exports.ReplaySchema = ReplaySchema
exports.OrderSchema = OrderSchema