import React, { useState, useEffect, useRef } from "react";
import { messagesApi, type Conversation, type Message } from "@/services";
import { useAuth } from "@/components/Context/AuthContext";
import { Send, Search, Phone, X, Mic, MicOff, Video as VideoIcon, VideoOff, MoreVertical, Reply, Smile, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(() => {
    const saved = localStorage.getItem("selected_conversation_id");
    return saved ? Number(saved) : null;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Video Call State
  const [isInCall, setIsInCall] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null); // Message ID

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await messagesApi.getConversations();
        setConversations(data);
        
        if (data.length > 0) {
            // Priority: 1. Locally saved ID (if it exists in data) 2. First conversation in list
            const savedId = localStorage.getItem("selected_conversation_id");
            if (savedId && data.some(c => c.id === Number(savedId))) {
               if (selectedConversation !== Number(savedId)) {
                   setSelectedConversation(Number(savedId));
               }
            } else if (!selectedConversation) {
                setSelectedConversation(data[0].id);
            }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
        fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
        // Fetch history
        setLoading(true);
        messagesApi.getMessages(selectedConversation).then((data) => {
            setMessages(data);
            setLoading(false);
        });

        // Connect WebSocket
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/chat/${selectedConversation}/?token=${token}`;
    
    if (socketRef.current) {
        socketRef.current.close();
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
         console.log('Connected to chat');
         // We no longer mark as read here automatically to avoid wiping out the counter on load
    };

    socket.onmessage = async (e) => {
         const data = JSON.parse(e.data);
         
         if (data.type === 'chat_message' || data.message) {
             const roomId = data.room_id || selectedConversation;
             const newMsg: Message = {
                 id: data.id || Date.now(), 
                 text: data.message,
                 senderId: data.sender_id,
                 userName: data.sender || 'Unknown',
                 userAvatar: '', 
                 timestamp: data.timestamp || new Date().toISOString(),
                 isRead: false,
                 replyTo: data.reply_to_data
             };

             // Only add to messages view if it's the currently selected conversation
             if (Number(roomId) === Number(selectedConversation)) {
                 setMessages(prev => {
                     // Simple deduplication based on ID
                     if (prev.some(m => m.id === newMsg.id)) return prev;
                     return [...prev, newMsg];
                 });
                 
                 // Mark as read since we are viewing this conversation
                 if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                     socketRef.current.send(JSON.stringify({ type: 'mark_read' }));
                 }
             }

             // Update conversation list for ALL rooms (sidebar sync)
             setConversations(prev => {
                 const convIndex = prev.findIndex(c => Number(c.id) === Number(roomId));
                 if (convIndex === -1) return prev;
                 
                 const targetConv = prev[convIndex];
                 const isSelected = Number(roomId) === Number(selectedConversation);
                 const isFromMe = Number(data.sender_id) === Number(user?.id);

                 const updatedConv = {
                     ...targetConv,
                     lastMessage: data.message,
                     lastMessageTime: data.timestamp || new Date().toISOString(),
                     // Increment unread count ONLY if it's not the active chat AND not from me
                     unreadCount: isSelected ? 0 : (isFromMe ? targetConv.unreadCount : targetConv.unreadCount + 1)
                 };
                 
                 const filtered = prev.filter(c => Number(c.id) !== Number(roomId));
                 return [updatedConv, ...filtered];
             });
         }
         
         // Signaling: Offer
         else if (data.type === 'video_offer') {
             if (data.sender_id === Number(user?.id)) return; // Ignore own offer if echoed
             setIsIncomingCall(true);
             // Store offer data temporarily? Or just set it when accepting
             // For simplicity, we assume we can handle it now or wait
             // Better: Store offer in a ref to use when user 'Accepts'
             // For now, let's just log it. Real-world: show Accept/Reject UI
             // We'll attach the offer data to a ref to use in 'acceptCall'
             (window as any).pendingOffer = data.data; 
         }
         
         // Signaling: Answer
         else if (data.type === 'video_answer') {
             if (peerConnectionRef.current) {
                 await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
             }
         }
         
         // Signaling: ICE Candidate
         else if (data.type === 'new_ice_candidate') {
             if (peerConnectionRef.current && data.data) {
                 try {
                     await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.data));
                 } catch (e) {
                     console.error("Error adding ice candidate", e);
                 }
             }
         }

          // Reactions Update
          else if (data.type === 'reaction_update') {
              setMessages(prev => prev.map(m => 
                  m.id === data.message_id ? { ...m, reactions: data.reactions } : m
              ));
          }

          // Message Unsent
          else if (data.type === 'message_unsent') {
              setMessages(prev => prev.map(m => 
                  m.id === data.message_id ? { ...m, text: "Message unsent", isDeleted: true, reactions: {} } : m
              ));
          }

          // Message Removed For Me
          else if (data.type === 'message_removed_for_me') {
              setMessages(prev => prev.filter(m => m.id !== data.message_id));
          }

          // Messages Read
          else if (data.type === 'messages_read') {
              if (Number(data.reader_id) !== Number(user?.id)) {
                  // If the other person read my messages
                  setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
              }
          }
    };

    socketRef.current = socket;

    return () => {
        if (socketRef.current) {
            socketRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
             peerConnectionRef.current.close();
        }
    };
  }
}, [selectedConversation]);

// WebRTC Functions
const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: 'new_ice_candidate',
                data: event.candidate
            }));
        }
    };

    pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
        }
    };

    return pc;
};

const startCall = async () => {
    setIsInCall(true);
    setCallStatus("Calling...");
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: 'video_offer',
                data: offer
            }));
        }

    } catch (err) {
        console.error("Error starting call:", err);
        endCall();
    }
};

const acceptCall = async () => {
    setIsIncomingCall(false);
    setIsInCall(true);
    setCallStatus("Connected");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        const pc = createPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;

        const offer = (window as any).pendingOffer;
        if (offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (socketRef.current) {
                socketRef.current.send(JSON.stringify({
                    type: 'video_answer',
                    data: answer
                }));
            }
        }

    } catch (err) {
        console.error("Error accepting call:", err);
        endCall();
    }
};

const endCall = () => {
    setIsInCall(false);
    setIsIncomingCall(false);
    setCallStatus("");
    
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }
};

const toggleMic = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !micOn);
        setMicOn(!micOn);
    }
};

const toggleCamera = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !cameraOn);
        setCameraOn(!cameraOn);
    }
};

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
            socketRef.current.send(JSON.stringify({
                message: messageText,
                reply_to_id: replyingTo?.id
            }));
            setMessageText("");
            setReplyingTo(null);
            markAsRead(); // Mark as read locally after sending
        } catch (err) {
            console.error("WS Send Error", err);
        }
    } else {
        // Fallback or reconnect logic
        console.warn("WebSocket not connected");
    }
  };

  const handleAddReaction = (messageId: number, reaction: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'add_reaction',
            message_id: messageId,
            reaction: reaction
        }));
    }
    setShowEmojiPicker(null);
  };

  const handleUnsend = (messageId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'unsend_message',
            message_id: messageId
        }));
    }
  };

  const handleRemoveForMe = (messageId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'remove_message',
            message_id: messageId
        }));
    }
  };

  const markAsRead = (id?: number) => {
    const targetId = id || selectedConversation;
    if (!targetId) return;

    // Tell backend if socket is ready
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'mark_read' }));
        
        // Reset locally only for the specific conversation
        setConversations(prev => prev.map(c => 
            Number(c.id) === Number(targetId) ? { ...c, unreadCount: 0 } : c
        ));
    }
  };

  // Removed automatic markAsRead effects to ensure counter is visible on initial load
  // until user interacts or a new message arrives.

  const selected = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden"
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r border-gray-200 dark:border-slate-800 overflow-y-auto h-full">
              <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>
               <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                          setSelectedConversation(conv.id);
                          localStorage.setItem("selected_conversation_id", conv.id.toString());
                          markAsRead(conv.id);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${
                        selectedConversation === conv.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={conv.userAvatar}
                            alt={conv.userName}
                            className="w-12 h-12 rounded-full"
                          />
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {conv.userName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(conv.lastMessageTime).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {loading ? "Loading..." : "No conversations yet"}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
              {selected ? (
                <>
                   {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <img
                        src={selected.userAvatar}
                        alt={selected.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {selected.userName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active now</p>
                      </div>
                    </div>
                    {/* Call Buttons */}
                    <div className="flex space-x-3">
                        <button onClick={startCall} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors">
                            <VideoIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 transition-colors">
                            <Phone className="w-5 h-5" />
                        </button>
                    </div>
                  </div>

                  {/* Video Call Overlay */}
                  {isInCall && (
                      <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col">
                          <div className="relative flex-1 bg-black">
                              {/* Remote Video */}
                              <video 
                                  ref={remoteVideoRef} 
                                  autoPlay 
                                  playsInline 
                                  className="w-full h-full object-cover"
                              />
                              
                              {/* Local Video */}
                              <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl">
                                  <video 
                                      ref={localVideoRef} 
                                      autoPlay 
                                      playsInline 
                                      muted 
                                      className="w-full h-full object-cover"
                                  />
                              </div>

                              {/* Status Overlay */}
                              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                  <p className="text-white font-medium">{callStatus}</p>
                              </div>
                          </div>

                          {/* Controls */}
                          <div className="h-20 bg-slate-900 flex items-center justify-center space-x-6 border-t border-slate-800">
                              <button 
                                  onClick={toggleMic}
                                  className={`p-4 rounded-full ${micOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'} hover:opacity-90 transition-all`}
                              >
                                  {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                              </button>
                              <button 
                                  onClick={endCall}
                                  className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                              >
                                  <Phone className="w-8 h-8 rotate-[135deg]" />
                              </button>
                              <button 
                                  onClick={toggleCamera}
                                  className={`p-4 rounded-full ${cameraOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'} hover:opacity-90 transition-all`}
                              >
                                  {cameraOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Incoming Call Modal */}
                  {isIncomingCall && !isInCall && (
                      <div className="absolute top-4 right-4 z-50 animate-bounce-in">
                          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col items-center w-64">
                               <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3 animate-pulse">
                                   <VideoIcon className="w-8 h-8 text-blue-600" />
                               </div>
                               <h3 className="font-bold text-gray-900 dark:text-white mb-1">Incoming Call...</h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{selected?.userName}</p>
                               <div className="flex space-x-3 w-full">
                                   <button 
                                       onClick={() => setIsIncomingCall(false)}
                                       className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium transition-colors"
                                   >
                                       Decline
                                   </button>
                                   <button 
                                       onClick={acceptCall}
                                       className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors shadow-lg shadow-green-500/20"
                                   >
                                       Accept
                                   </button>
                               </div>
                          </div>
                      </div>
                  )}

                  {/* Colors for my message */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-950 transition-colors space-y-4">
                    {messages.map((msg, index) => {
                        const isMe = msg.userName === user?.username || Number(msg.senderId) === Number(user?.id); // Safe check
                        
                        return (
                            <div key={msg.id || index} className={`flex w-full group ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                                <div className={`flex items-end max-w-[80%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Message Bubble */}
                                    <div className={`relative px-4 py-2 shadow-sm ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl rounded-bl-none border border-gray-100 dark:border-slate-700'
                                    }`}>
                                        {msg.replyTo && (
                                            <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 rounded-md text-xs border-l-2 border-white/50">
                                                <p className="font-bold opacity-90 mb-0.5">{msg.replyTo.sender}</p>
                                                <p className="opacity-80 line-clamp-1">{msg.replyTo.text}</p>
                                            </div>
                                        )}
                                        <p className={`text-sm md:text-base leading-relaxed break-words ${msg.isDeleted ? 'italic opacity-70' : ''}`}>
                                            {msg.text}
                                        </p>
                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100/70' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>

                                        {/* Reactions Display (Moved inside the relative container) */}
                                        {!msg.isDeleted && msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className={`absolute -bottom-3 flex -space-x-1 ${isMe ? 'right-0' : 'left-0'} z-10`}>
                                                <div className="bg-white dark:bg-slate-800 rounded-full px-1.5 py-0.5 shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-1 scale-90 origin-bottom">
                                                    <div className="flex -space-x-1">
                                                        {Array.from(new Set(Object.values(msg.reactions))).map((emoji, i) => (
                                                            <span key={i} className="text-[14px]">{emoji as string}</span>
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        {Object.keys(msg.reactions).length}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons (Hidden by default, visible on hover) */}
                                    {!msg.isDeleted && (
                                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button 
                                                        className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors focus:outline-none"
                                                        title="More"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align={isMe ? "end" : "start"} className="w-48">
                                                    {isMe && !msg.isDeleted && (
                                                        <DropdownMenuItem 
                                                            onClick={() => handleUnsend(msg.id)}
                                                            className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Unsend for everyone
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem 
                                                        onClick={() => handleRemoveForMe(msg.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove for me
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <button 
                                                onClick={() => setReplyingTo(msg)}
                                                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400 transition-colors focus:outline-none"
                                                title="Reply"
                                            >
                                                <Reply className="w-4 h-4" />
                                            </button>
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                                                    className={`p-1.5 rounded-full ${showEmojiPicker === msg.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700'} text-gray-500 dark:text-gray-400 transition-colors focus:outline-none`}
                                                    title="React"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                
                                                {showEmojiPicker === msg.id && (
                                                    <div className={`absolute bottom-full mb-2 p-1 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-gray-200 dark:border-slate-700 flex items-center gap-1 z-50 animate-bounce-in ${isMe ? 'right-0' : 'left-0'}`}>
                                                        {['❤️', '😂', '😮', '😢', '😡', '👍'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleAddReaction(msg.id, emoji)}
                                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-125 text-lg"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form
                    onSubmit={handleSendMessage}
                    className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors flex flex-col"
                  >
                    {replyingTo && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center animate-slide-up">
                            <div className="flex flex-col border-l-2 border-blue-500 pl-3">
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Replying to {replyingTo.userName}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{replyingTo.text}</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setReplyingTo(null)} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <div className="p-4 flex space-x-2">
                       <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 transition-colors">
                  Select a conversation to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
