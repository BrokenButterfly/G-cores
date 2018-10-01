var crypto = require('crypto');
var User = require('../models/user.js');
var Post = require('../models/post.js');
//引入multer插件
var multer = require('multer');
var upload = require('../models/uploads');

module.exports = function(app) {
    //首页
    app.get('/',function (req,res) {
        Post.get(null,function (err,posts) {
           if(err){
               posts=[];
           }
            res.render('index',{
                title:'主页',
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });
    //注册
    app.get('/reg',checkNotlogin);
    app.get('/reg',function(req,res){
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //注册行为
    app.post('/reg',checkNotlogin);
    app.post('/reg',function(req,res){
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        //检验两次输入的密码是否一致
        if(password_re != password){
            req.flash('error','两次输入的密码不一致');
            return res.redirect('/reg');//返回注册页
        }
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        });
        //检测用户名是否已存在
        User.get(newUser.name,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if(user){
                req.flash('error','用户已经存在');
                return res.redirect('/reg');//返回注册页
            }
            //    如果不存在则新增用户
            newUser.save(function (err,user) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');//注册失败返回注册页
                }
                req.session.user = newUser;//用户信息存入 session
                req.flash('success','注册成功');
                res.redirect('/');//注册成功后返回主页
            })
        });
    });
    //登录
    app.get('/login',checkNotlogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登录',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    //登录行为
    app.post('/login',checkNotlogin);
    app.post('/login',function (req,res) {
        //生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检测用户是否存在
        User.get(req.body.name,function (err,user) {
            if(!user){
                req.flash('error','用户不存在');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
            //    检测密码是否一致
            if(user.password != password){
                req.flash('error','密码错误');
                return res.redirect('/login');//密码错误则跳转到登录页
            }
            //用户名密码都匹配后，讲用户信息存入 session
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');//登录成功后跳转到主页
        });
    });
    //发表文章
    app.get('/post', checkLogin);
    app.get('/post',function(req,res){
       res.render('post',{
           title:'发表',
           user:req.session.user,
           success:req.flash('success').toString(),
           error:req.flash('error').toString()
       });
    });
    //发表文章行为
    app.post('/post', checkLogin);
    app.post('/post',upload.single('photo'),function (req,res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name,req.body.title,req.body.post,req.imgUrl,req.body.tags,req.body.sub);
        post.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            console.log(post);
            req.flash('success','发表成功');
            res.redirect('/');//发表成功跳转到主页
        });


    });


    // 文章页
    app.get('/u/:name/:minute/:title',function(req,res){
        Post.getOne(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error','找不到当前文章');
                return res.redirect('/');
            }
            // db.posts.aggregate([
            //     {
            //         $lookup:
            //             {
            //                 from:"users",
            //                 localField:"name",
            //                 foreignField:"name",
            //                 as:"u"
            //             }
            //     }
            // ]);
            res.render('article',{
                title:req.params.title,
                user:req.session.user,
                post:post,
                // dp:$u.dp,
                success:req.flash('successs').toString(),
                error:req.flash('error').toString()
            })
        })
    });



    //个人中心
    app.get('/user_center/profile',checkLogin);
    app.get('/user_center/profile',function (req,res) {
        res.render('profile', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    //编辑个人信息
    app.post('/user_center/profile',checkLogin);
    app.post('/user_center/profile',upload.single('dp'),function(req,res){
        var currentUser = req.session.user;
        var name = currentUser.name;
        User.edit(name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            var email = req.body.email;
            var tel = req.body.tel;
            var qq = req.body.qq;
            var wechat = req.body.wechat;
            var dp = req.imgUrl;
            if(dp == null){
                dp = currentUser.dp;
            }
            User.update(name,email,tel,qq,wechat,dp,function(err,user){
                console.log(dp)
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.session.user = user;
                // User.updateImg(name,dp,function (err) {
                //     if(err){
                //         req.flash('error',err);
                //         return res.redirect('back');
                //     }
                //     console.log(123);
                // });
                req.flash('success','修改个人信息成功')
                return res.redirect('back');
            })
        })
    });


    //分类页
    //标签对应的文章集合
    app.get('/tag',function(req,res){
        Post.getTag(req.params.tag,function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag',{
                title: req.params.tag,
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    });
    //退出登录
    app.get('/logout',checkLogin);
    app.get('/logout',function (req,res) {
        req.session.user= null;
        req.flash('success','登出成功');
        res.redirect('/');//登出成功后跳转到主页
    });









    function checkLogin(req,res,next){
        if(!req.session.user){
            req.flash('error','未登录');
            res.redirect('/login');
        }
        next();
    }
    function checkNotlogin(req,res,next){
        if(req.session.user){
            req.flash('error','已登录');
            res.redirect('back'); //返回之前的页面'
        }
        next();
    }
};