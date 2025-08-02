// AuthContext.jsx
import { createContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Auth check failed");
    }
  };

  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        localStorage.setItem("token", data.token);
        setToken(data.token);
        toast.success(data.message);
        connectSocket(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login/Signup failed");
    }
  };

  const logout = () => {
    socketRef.current?.disconnect();
    localStorage.removeItem("token");
    axios.defaults.headers.common["token"] = null;
    setAuthUser(null);
    setOnlineUsers([]);
    setToken(null);
    toast.success("Logged out successfully");
  };

  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Profile update failed");
    }
  };

  const connectSocket = (userData) => {
    if (!userData || socketRef.current?.connected) return;

    const newSocket = io(backendUrl, {
      query: { token },
      autoConnect: false, 
    });

    // Log disconnects and connection errors
    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
    newSocket.on("connect_error", (err) => {
      console.log("Connect error:", err.message);
    });

    // Register listeners exactly once
    newSocket.on("getOnlineUsers", (ids) => setOnlineUsers(ids));
    newSocket.on("newMessage", (msg) => {
      // you can pass this to ChatContext via socket state
      console.log("Incoming message", msg);
    });

    newSocket.connect();
    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  useEffect(() => {
    if (token) axios.defaults.headers.common["token"] = token;
    checkAuth();
    return () => socketRef.current?.disconnect();
  }, []);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
