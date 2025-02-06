let express=require('express');
let app=express();
let path=require('path');
let mongoose=require("./database.js");
let session=require('express-session');
let passport=require("passport");
let localpassport=require('passport-local');
let bcrypt=require("bcrypt");
let http=require('http');

let server=http.createServer(app);
let io=require('socket.io')(server);

let sessionOptions={
    secret:"secret_chatapp",
    resave:false,
    saveUninitialized:false,
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.json());
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));


passport.use("Local-login",new localpassport(
    {
        usernameField:"email",
        passswordField:"password",
    },
    function(email,password,done){
        let db=mongoose.connection.db;
        let Collection = db.collection("User");
        Collection.findOne({email:email})  
        .then(async function(user){
            let match=await bcrypt.compare(password,user.password);
            if(match)
                return done(null,user);
            else
                return done(null,false);
        })
        .catch(function(err){
            return done(null,false);
        });
    }
))

passport.serializeUser(function(user,done){
    done(null,user);
})

passport.deserializeUser(function(user,done){
    done(null,user);
})

let arr=[];
let ChatUser;
let ChatUserName;
io.on("connect",async function(Socket){
    let db=mongoose.connection.db; 
    let Message=db.collection("message") 
    let User=db.collection("User");   
    let data=arr.findIndex(item=>(item.SocketId===Socket.id&&item.UserId===ChatUser&&!item.UserId ))
    if(data==-1){ 
        arr.push({ 
            SocketId:Socket.id,
            UserId:ChatUser
        }); 
    } 
    Socket.on("New_User_Join",async function(){
        let id=Socket.id;  
        let AllUserData=await User.find({}).toArray();
        let senderId=arr.find(item => item.SocketId === id)?.UserId;
        let data=await Message.find({sender_id:senderId}).toArray();
        if(data.length==0){
            let date=new Date(); 
            Message.insertOne({member:"yes",msg:`${ChatUserName}`,sender_id:senderId,date:date,time:date.toLocaleTimeString()}); 
            io.emit('New_User_Join',arr,senderId,AllUserData,ChatUserName)
        } 
    })  

    Socket.on("Sender_Message", async function (data, id, receiver_id) {  
        console.log(receiver_id);
        
        let AllUserData = await User.find({}).toArray();
        let senderId = arr.find(item => item.SocketId === id)?.UserId;
        let date = new Date(); 
        await Message.insertOne({msg: data,sender_id: senderId,receiver_id: receiver_id,date: date,time: date.toLocaleTimeString()});
        let AllMessages = await Message.find({}).toArray();
        io.emit('Receiver_Message', AllMessages, arr, senderId, AllUserData, data, date.toLocaleTimeString(), receiver_id);
    });
     
    Socket.on("disconnect",async function(){  
        let index=arr.findIndex(item=>item.SocketId===Socket.id);
        if(index>-1)
            arr.splice(index,1); 
    })
}) 



app.get("/",function(req,res){
    if(req.isAuthenticated())
        res.redirect("/chat");
    else
        res.render("login.ejs");
})

app.post("/login",passport.authenticate("Local-login",{
    successRedirect:"/chat",
    failureRedirect:"/"
}))

app.get("/chat",async function(req,res){
    if(req.isAuthenticated()){
        ChatUser=req.user._id;
        ChatUserName=req.user.name;
        let db=mongoose.connection.db;
        let User=db.collection("User");
        let AllUserData=await User.find({}).toArray();
        let Message=db.collection("message")
        let AllMessages=await Message.find({}).toArray();
        res.render("chat.ejs",{AllMessages:AllMessages,AllUserData,Id:req.user._id,name:req.user.name});
    } 
    else   
        res.redirect("/") 
}) 

app.get("/signup",function(req,res){
    res.render("signup.ejs");
})

app.post("/signup",async function(req,res){
    let {name,email,password} = req.body;
    let db=mongoose.connection.db;
    let User=db.collection("User");
    let data=await User.findOne({email:email});
    if(data)
        res.redirect("/signup");
    else{
        password=await new bcrypt.hash(password,10);
        User.insertOne({name:name,email:email,password:password});
        res.redirect("/");
    }
   
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        res.redirect("/");
    })
})

server.listen(3000,function(){
    console.log("Server is running on port 3000");
})  
   