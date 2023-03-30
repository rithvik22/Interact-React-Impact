import React,{
    useState,
    useEffect,
    useContext
} from 'react'
import Img from '../img/img.png'
import Attach from '../img/attach.png'
import { ChatContext } from '../ChatContext';
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db,storage } from "../../../firebase_service";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
export default function Input() {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const [photoUrl, setPhotoUrl] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    useEffect(() => {
      console.log("user in Chats:", currentUser);
      const prepareData = {
        displayName: currentUser?.displayName,
        email: currentUser?.email,
        photoURL: currentUser?.photoURL,
      };
      setPhotoUrl(prepareData?.photoURL);
      setDisplayName(prepareData?.displayName);
      setEmail(prepareData?.email);
    }, [currentUser]);
    //
    const { data } = useContext(ChatContext);
    const [text,setText] = useState('');
    const [img,setImg] = useState('');
 const handleSend = async () => {
   if (img) {
     const storageRef = ref(storage, uuid());

     const uploadTask = uploadBytesResumable(storageRef, img);

     uploadTask.on(
       (error) => {
         //TODO:Handle Error
       },
       () => {
         getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
           await updateDoc(doc(db, "chats", data.chatId), {
             messages: arrayUnion({
               id: uuid(),
               text,
               senderId: currentUser.uid,
               date: Timestamp.now(),
               img: downloadURL,
             }),
           });
         });
       }
     );
   } else {
     await updateDoc(doc(db, "chats", data.chatId), {
       messages: arrayUnion({
         id: uuid(),
         text,
         senderId: currentUser.uid,
         date: Timestamp.now(),
       }),
     });
   }

   await updateDoc(doc(db, "userChats", currentUser.uid), {
     [data.chatId + ".lastMessage"]: {
       text,
     },
     [data.chatId + ".date"]: serverTimestamp(),
   });

   await updateDoc(doc(db, "userChats", data.user.uid), {
     [data.chatId + ".lastMessage"]: {
       text,
     },
     [data.chatId + ".date"]: serverTimestamp(),
   });

   setText("");
   setImg(null);
 };
  return (
    <div className='input'>
     <input type="text" placeholder="Type a message" onChange={ e=> setText(e.target.value)}/>
     <div className='send'>
    <img src={Attach} alt='send'/>
    <input type='file' style={{
        display: 'none'
    }} id='file' onChange={ e=>{
        setImg(e.target.files[0]);
    }}/>
    <label htmlFor='file'>
        <img src={Img} alt='file'/>
    </label>
    <button onClick={handleSend}>send</button>
     </div>
    </div>
  )
}
