let socket=io();

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
    let upload_data=document.getElementById("profileImage").value;
    document.getElementsByClassName("send_image_message")[0].style.visibility="hidden";
    let data=document.getElementById('data').value;
    let receiver_id=document.getElementById('receiver_id').innerHTML;
    let sender_profile_id=document.getElementById('sender_profile_id').innerHTML;
    let receiver_profile_id=document.getElementById('receiver_profile_id').innerHTML;
    console.log(upload_data);
    console.log(data);
    if(data.length>0){
        socket.emit('Sender_Message',data,upload_data,socket.id,receiver_id,sender_profile_id,receiver_profile_id);
    }
    this.reset();
})
socket.on("Receiver_Message",function(AllMessage,Arr,UserId,AllUserData,Msg,Time,receiver_id,sender_profile_id,receiver_profile_id){
    window.AllMessages = AllMessage;
    let checkerReceiver=document.getElementById("message_receiverId").innerHTML;
    let checkerSender=document.getElementById('message_senderId').innerHTML;
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
        if(receiver_id.includes(Arr[i].UserId)&&Arr[i].SocketId==socket.id){ // future m Arr[i].UserId!=undefined lega dena
            if(checkerReceiver==sender_profile_id){
                span.innerHTML=data[0].name;
                span.classList.add("span2");
                p.innerHTML=Msg;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
                div.classList.add('recieved');
                div.appendChild(span);
                div.appendChild(p);   
                div.appendChild(span2);
                MsgBox.appendChild(div);
            }
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

socket.on("Online_User",function(arr){
    let sideUser=document.querySelectorAll(".users_container div");
    for(let i=0;i<sideUser.length;i++){
        let Profile_id=sideUser[i].children[2].innerHTML;
        for(let j=0;j<arr.length;j++){
            if(Profile_id==arr[j].UserId){
                sideUser[i].children[3].style.display="block"
                break;
            }
            else{
                sideUser[i].children[3].style.display="none"
            }
        }
    }
})