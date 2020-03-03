// 测试使用mongoose操作mongodb数据库
const md5 = require('blueimp-md5'); //md加密的函数
// 1.1连接数据库
const mongoose = require('mongoose');
// 1.2连接指定的数据库
mongoose.connect('mongodb://localhost:27017/tourapp_server')
//1.3获取连接对象
const conn = mongoose.connection
//1.4绑定连接完成的监听
conn.on('connected', function () {
    console.log('连接成功')
})

//得到对应特定集合的model
//2.1定义Schema
const userSchema = mongoose.Schema({
    //指定文档结构:属性名/属性值的类型，是否是必须的，默认值
    username: { type: String, required: true },
    password: { type: String, required: true }
})

//2.2定义Model(与集合对应，可以操作集合)
const UserModel = mongoose.model('user', userSchema)

//通过Model或其实例对集合数据进行CRUD操作
//3.1通过Model实例的save()添加数据
function testSave() {
    const userModel = new UserModel({
        username: 'Liu', password: md5('liu333666')
    })
    //调用save()保存
    userModel.save(function (error, user) {
        console.log('save()', error, user)
    })
}
// testSave()

//3.2通过Model的find()/findOne()查询多个或一个数据
function testFind() {
    //查询多个
    UserModel.find(function (error, users) {
        console.log('find()', error, users)
    })
    //查询一个，得到的是匹配对象，没有得到就返回null
    UserModel.findOne({ _id: '5e10558b6fe29e2d276203eb' }, function (error, user) {
        console.log('findOne()', error, user)
    })
}
// testFind()

//3.3通过Model的findByIdAndUpdate()更新某个数据
function testUpdate() {
    UserModel.findByIdAndUpdate({ _id: '5e10558b6fe29e2d276203eb' }, { username: 'Jack' }, function (error, olduser) {
        console.log('test', error, olduser)
    })
}
// testUpdate()

//3.4通过Model的remove()删除匹配的数据
function testDelete() {
    UserModel.remove({ _id: '5e10558b6fe29e2d276203eb' }, function (error, doc) {
        console.log('remove', error, doc)
    })
}
// testDelete()