import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../library/cloudinary.js";
import { io, userSocketMap } from "../server.js";

//get all users except the logged in user
export const getUserForSidebar = async (requestAnimationFrame, res)=>{
    try {
        const userId = requestAnimationFrame.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");

        //count number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async(user)=>{
            const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false})
            if(messages.length > 0){
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({success: true, users: filteredUsers, unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

//get all messages for selected user
export const getMessages = async (req, res) =>{
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: selectedUserId},
                {senderId: selectedUserId, receiverId: myId},
            ]
        })
        await Message.updateMany({senderId: selectedUserId, receiverId: myId},{seen: true});

        res.json({success: true, messages})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async (req, res)=>{
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, {seen: true})
        res.json({success: true})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// send message to selected user

export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.id;

    let imageUrl;
    if (req.file) {
      const dataUri = `data:${req.file.mimetype};base64,${Buffer.from(req.file.buffer).toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(dataUri);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text || "",
      image: imageUrl
    });

    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });

  } catch (err) {
    console.error(err.message);
    res.json({ success: false, message: err.message });
  }
};
