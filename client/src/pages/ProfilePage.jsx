import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const navigate = useNavigate();

  // Set initial values from authUser
  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || "");
      setBio(authUser.bio || "");
    }
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    //  If no image is selected, just update text fields
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate("/");
      return;
    }

    //  Convert image to base64 and update all
    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      const base64Image = reader.result;
      await updateProfile({ profilePic: base64Image, fullName: name, bio });
      navigate("/");
    };
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="relative w-4/5 max-w-xl backdrop-blur-2xl text-gray-300 border-2 
      border-gray-600 rounded-lg p-6 pr-[200px] flex items-center justify-between max-sm:flex-col-reverse">
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4 flex-1">
          <h3 className="text-lg">Profile details</h3>
          
          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt="avatar"
              className={`w-12 h-12 object-cover ${
                selectedImg || authUser?.profilePic ? "rounded-full" : ""
              }`}
            />
            upload profile image
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
          ></textarea>

          <button
            type="submit"
            className="py-3 bg-green-500 hover:bg-green-600 text-white rounded-md"
          >
            Save
          </button>
        </form>

        <img
  className="absolute top-1/2 right-[16px] w-[160px] h-[160px] object-cover rounded-full transform -translate-y-1/2"
  src={
    selectedImg
      ? URL.createObjectURL(selectedImg)
      : authUser?.profilePic || assets.logo_big
  }
  alt="profile"
/>

      </div>
    </div>
  );
};

export default ProfilePage;
