let socket=io();

socket.emit("New_User_Join") 

socket.on("New_User_Join",function(Arr,UserId,AllUserData,UserName){
    for(let i=0;i<Arr.length;i++){
        let MsgBox=document.getElementsByClassName('message')[0];
        let span=document.createElement("span");
        span.classList.add("newjoin");
        if(Arr[i].UserId!=UserId&&Arr[i].SocketId==socket.id){
            span.innerHTML=UserName+" joined this chit chat";
            MsgBox.appendChild(span);
        }
        else if(Arr[i].UserId==UserId&&Arr[i].SocketId==socket.id){
            span.innerHTML="You joined this chit chat";
            MsgBox.appendChild(span);
        }
        MsgBox.scrollTop=MsgBox.scrollHeight;
    }
})
document.querySelector('form').addEventListener("submit",function(e){
    e.preventDefault();
    let data=document.getElementById('data').value;
    let receiver_id=document.getElementById('receiver_id').innerHTML;
    if(data.length>0){
        socket.emit('Sender_Message',data,socket.id,receiver_id);
    }
    this.reset();
})
socket.on("Receiver_Message",function(AllMessage,Arr,UserId,AllUserData,Msg,Time,receiver_id){
    window.AllMessages = AllMessage;
    for(let i=0;i<Arr.length;i++){
        let MsgBox=document.getElementsByClassName('message')[0];
        let div=document.createElement('div');
        let p=document.createElement('p'); 
        let span=document.createElement('span');
        let span2=document.createElement('span');
        span2.classList.add('time');
        span2.innerHTML=Time.substring(0,5)+Time.substring(8);  
        p.classList.add('para');
        let data=AllUserData.filter(ele => { if(ele._id==UserId) return ele})
        if(Arr[i].UserId==receiver_id&&Arr[i].SocketId==socket.id){ // future m Arr[i].UserId!=undefined lega dena
            span.innerHTML=data[0].name;
            span.classList.add("span2");
            p.innerHTML=Msg;
            div.classList.add('recieved');
            div.appendChild(span);
            div.appendChild(p);   
            div.appendChild(span2);
            MsgBox.appendChild(div);
        }  
        else if(Arr[i].UserId==UserId&&Arr[i].SocketId==socket.id){ 
            span.innerHTML="You";
            p.innerHTML=Msg;
            span.classList.add("span");
            div.classList.add('sender'); 
            div.appendChild(span);
            div.appendChild(p);  
            div.appendChild(span2);
            MsgBox.appendChild(div);
        }
        MsgBox.scrollTop=MsgBox.scrollHeight;
    } 
})