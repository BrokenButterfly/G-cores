var mongodb = require('./db');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;


//储存用户信息
User.prototype.save = function (callback) {
    //要存入数据库的用户文档
    var user = {
        name:this.name,
        password:this.password,
        email:this.email
    };
//    打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);//错误，返回err信息
        }
    //    读取users集合
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);//错误，返回err信息
            }
            //讲用户数据插入 users 集合
            collection.insert(user,{
                safe:true
            },function (err,user) {
                mongodb.close();
                if(err){
                    return callback(err);//错误，返回err信息
                }
                callback(null,user[0]);//成功!err 为 null，并返回储存后的用户文档
            })
        })
    })
};

//用户读取信息
User.get = function (name,callback) {
    //打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);//错误，返回err信息
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);//错误，返回err信息
            }
            //查找用户名(name值)值为 name 一个文档
            collection.findOne({
                name:name
            },function(err,user){
                mongodb.close();
                if(err){
                    return callback(err);//失败！返回err信息
                }
                callback(null,user);//成功！返回查询的用户信息
            })
        })
    })
};

//编辑用户信息
User.edit = function (name,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('users',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name
            },function (err,doc) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);
            })
        })
    })
};
//将编辑后的内容更新
User.update = function (name,email,tel,qq,wechat,dp,callback) {
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('users',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name
            },{$set:{email:email,tel:tel,qq:qq,wechat:wechat,dp:dp}},{upsert:true})
            collection.findOne({name:name},function (err,user) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                callback(null,user);
            })
        })
    })
};

//更新发布文章里的头像
// User.updateImg = function (name,dp,callback) {
//     mongodb.open(function(err,db){
//         if(err){
//             return callback(err);
//         }
//         db.collection('posts',function(err,collection){
//             if(err){
//                 mongodb.close();
//                 return callback(err);
//             }
//             collection.update({"name":name},{$set:{dp:dp}},{upsert:true},{multi:true})
//             collection.find({name:name},function (err,user) {
//                 if(err) {
//                     mongodb.close();
//                     return callback(err);
//                 }
//                 callback(null,user);
//             })
//         })
//     })
// };