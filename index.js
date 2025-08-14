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

const multer=require('multer');
const storage=multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads')
    },
    filename: function(req,file,cb){
        cb(null,Date.now() + '-' + file.originalname)
    }
})
const upload=multer({storage:storage})

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.static(path.join(__dirname, 'uploads')));
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
        let Collection = db.collection("User_Accounts");
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
    let User=db.collection("User_Accounts");   
    let data=arr.findIndex(item=>(item.SocketId===Socket.id&&item.UserId===ChatUser&&!item.UserId ))
    if(data==-1){ 
        arr.push({ 
            SocketId:Socket.id,
            UserId:ChatUser
        }); 
    } 

    io.emit("Online_User",arr);
    Socket.on("Sender_Message", async function (data,upload_data, id, receiver_id,sender_profile_id,receiver_profile_id) {  
        let AllUserData = await User.find({}).toArray();
        let senderId = arr.find(item => item.SocketId === id)?.UserId;
        let receivers=receiver_id.split(",");
        receivers=receivers.filter(function(ele){ if(ele!=senderId ) return ele; });

        let date = new Date();    
        await Message.insertOne({msg: data,sender_profile_id:sender_profile_id,receiver_profile_id:receiver_profile_id,sender_id: senderId,receiver_id:receivers,date: date,time: date.toLocaleTimeString()});
        let AllMessages = await Message.find({}).toArray();
        io.emit('Receiver_Message', AllMessages, arr, senderId, AllUserData, data, date.toLocaleTimeString(), receivers,sender_profile_id,receiver_profile_id);
    }); 
     
    Socket.on("disconnect",async function(){  
        let index=arr.findIndex(item=>item.SocketId===Socket.id);
        if(index>-1)
            arr.splice(index,1); 
        io.emit("Online_User",arr);
    })
}) 



app.get("/",function(req,res){
    if(req.isAuthenticated()){
        res.redirect("/chat");
    }
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
        let Profiles=db.collection("User_Profiles");
        let AllProfiles=await Profiles.find({}).toArray();
        let User_Profiles_Id=await Profiles.find({users_id:req.user._id}).toArray();
        let Message=db.collection("message")
        let AllMessages=await Message.find({}).toArray();
        res.render("chat.ejs",{AllMessages:AllMessages,AllProfiles,Profile_Image:User_Profiles_Id[0].image,Id:req.user._id,name:req.user.name,arr:arr});
    } 
    else   
        res.redirect("/") 
}) 

app.get("/signup",function(req,res){
    res.render("signup.ejs");
})

app.post("/signup",upload.single("profileImage"),async function(req,res){
    let {name,email,password} = req.body;
    let db=mongoose.connection.db;
    let User=db.collection("User_Accounts");
    let data=await User.findOne({email:email});
    if(data)
        res.redirect("/signup");
    else{
        password=await new bcrypt.hash(password,10);
        let Profiles=db.collection("User_Profiles");
        let date=new Date();
        let Image="";
        console.log(req.file)
        if(req.file==undefined)
            Image='default-profile.jpg';
        else
            Image=req.file.filename;
        await User.insertOne({name:name,email:email,image:Image,password:password});
        let userId=await User.findOne({name:name,email:email});
        await Profiles.insertOne({name:name,users_id:[userId._id.toString()],image:Image,date:date,time:date.toLocaleTimeString()});
        res.redirect("/");
    } 
   
});

app.get("/logout",function(req,res){
    req.logout(function(err){
        res.redirect("/");
    })
})  

app.get("/create",async function(req,res){
    if(req.isAuthenticated()){
        let db=mongoose.connection.db;
        let User=db.collection("User_Accounts");
        let AllUserData=await User.find({}).toArray();
        res.render("group.ejs",{AllUserData:AllUserData,Id:req.user._id});
    }
    else
        res.redirect("/");
})

app.post("/groupdata",upload.single("profileImage"),async function(req,res){
    let {name,description,user_id}=req.body;
    let db=mongoose.connection.db;
    let Image="";
    if(req.file==undefined)
        Image='default-profile.jpg';
    else
        Image=req.file.filename;
    let Profiles=db.collection("User_Profiles");
    let date=new Date();
    await Profiles.insertOne({name:name,about:description,users_id:user_id,image:Image,date:date,time:date.toLocaleTimeString()});
    res.redirect("/");
})
server.listen(3000,function(){
    console.log("Server is running on port 3000");
})  


   