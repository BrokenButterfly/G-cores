//连接数据库
var mongodb = require('./db');
var markdown = require('markdown').markdown;
function Post(name,title,post,imgUrl,tags,sub) {
    this.name = name;
    this.title = title;
    this.post = post;
    this.imgUrl = imgUrl;
    this.tags = tags;
    this.sub = sub;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function (callback) {
    var date = new Date();
//    存储各种时间格式，方便以后扩展
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + "-" +(date.getMonth() + 1),
        day:date.getFullYear() + "-" +(date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
//    要存入数据库的文档
    var post = {
        name:this.name,
        time:time,
        title:this.title,
        sub:this.sub,
        post:this.post,
        // 图片
        imgUrl:this.imgUrl,
        // 标签
        tags :this.tags,
        // //新增的留言字段
        comments:[],
        // //新增访问量
        pv:0
    };
//    打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
    //    读取 posts 集合
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
        //    将文档插入 posts 集合
            collection.insert(post,{
                safe:true
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回err 为 null
            });
        });
    });
};

//读取文章及其相关信息
Post.get = function (name,callback) {
//    打开数据库
    mongodb.open(function (err,db) {
        if(err){
            return callback(err);
        }
    //    读取posts集合
        db.collection('posts',function (err,collection) {
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
        //    根据 query 对象查询文章
            collection.find(query).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);//失败 返回err
                }
                callback(null,docs);//成功 以数据形式返回查询的结果
            });
        });
    });
};

//获取标签所对应的文章
Post.getTag = function(tag,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1,
                "sub":1,
                "tags":1,
                "imgUrl":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
};


//根据用户名，发布时间，文章标题来查询某一篇具体的文章
Post.getOne = function(name,minute,title,callback){
   mongodb.open(function(err,db){
       if(err){
           return callback(err);
       }
       db.collection('posts',function(err,collection){
           if(err){
               mongodb.close();
               return callback(err);
           }
           collection.findOne({
               'name':name,
               'time.minute':minute,
               'title':title
           },function(err,doc){
               if(err){
                   mongodb.close();
                   return callback(err);
               }
           //访问量增加的代码
               if(doc){
                   collection.update({
                       "name":name,
                       "time.minute":minute,
                       "title":title,
                   },{
                       $inc:{'pv':1}
                   },function(err){
                       mongodb.close();
                       if(err){
                           return callback(err);
                       }
                   })
               }
           //    markdown解析一下
               doc.post = markdown.toHTML(doc.post);
           //    把留言的内容用markdown解析一下
               doc.comments.forEach(function(comment){
                   comment.content = markdown.toHTML(comment.content);
               })
               callback(null,doc);
           })
       })
   })
};

//返回包含用户名，发布时间，标题，发布的图片的文章
Post.getArchive = function (callback) {
  mongodb.open(function (err,db) {
      if(err){
          return callback(err);
      }
      db.collection('posts',function(err,collection){
          if(err){
              mongodb.close();
              return callback(err);
          }
      //    只获取到发布人，发布时间，发布的标题，发布的图片
          collection.find({},{
              "name":1,
              "time":1,
              "title":1,
              "imgUrl":1
          }).sort({
              time:-1
          }).toArray(function(err,docs){
              mongodb.close();
              if(err){
                  return callback(err);
              }
              callback(null,docs);
          })
      })
  })
};