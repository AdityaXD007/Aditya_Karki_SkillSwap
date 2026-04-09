import React, { useState, useEffect, useRef } from "react";
import { messagesApi, sessionsAPI, paymentAPI, getMediaUrl, type Conversation, type Message, type LearningSession } from "@/services";
import { useAuth } from "@/components/Context/AuthContext";
import { Send, Search, Phone, X, Mic, MicOff, Video as VideoIcon, VideoOff, MoreVertical, Reply, Smile, Trash2, Image as ImageIcon, ShieldCheck, CheckCircle2, Monitor, Star, AlertCircle, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.l.google.com:19305' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.stunprotocol.org' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:80?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: [
        'turn:74.125.143.127:19305?transport=udp',
        'turn:74.125.143.127:19305?transport=tcp',
      ],
      username: 'google-ice-user',
      credential: 'google-ice-password',
    }
  ],

  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  sdpSemantics: 'unified-plan',
  iceTransportPolicy: 'all' as RTCIceTransportPolicy
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteBackgroundVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
        console.log("📺 Setting remote srcObject via useEffect (Tracks:", remoteStream.getTracks().length, ")");
        remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteBackgroundVideoRef.current && remoteStream) {
        remoteBackgroundVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null); // Message ID
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);
  const sessionTimerRef = useRef<any>(null);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState(5);
  const confirmTimerRef = useRef<any>(null);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSessionId, setRatingSessionId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [ratingRole, setRatingRole] = useState<'student' | 'teacher'>('student');

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Buffer for ICE candidates that arrive before the peer connection is ready
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user?.id) {
        console.log("👤 My User ID is:", user.id, "(Type:", typeof user.id, ")");
    }
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

  // Session Management & Timing
  const currentPartnerId = conversations.find(c => c.id === selectedConversation)?.partnerId;

  useEffect(() => {
    if (selectedConversation && user && currentPartnerId) {
        const fetchCurrentSession = async () => {
            try {
                const response = await sessionsAPI.getSessions();
                const session = response.data.find(s => {
                    const isTeacher = Number(s.teacher) === Number(user.id);
                    const isStudent = Number(s.student) === Number(user.id);
                    const pId = Number(currentPartnerId);
                    
                    const statusMatch = s.status === 'SCHEDULED' || s.status === 'ONGOING';
                    const participantMatch = (isTeacher && Number(s.student) === pId) || 
                                            (isStudent && Number(s.teacher) === pId);
                    
                    return statusMatch && participantMatch;
                });
                
                setActiveSession(session || null);
            } catch (err) {
                console.error("Error fetching session:", err);
            }
        };
        fetchCurrentSession();
    } else if (!selectedConversation || !currentPartnerId) {
        setActiveSession(null);
    }
  }, [selectedConversation, user?.id, currentPartnerId]);

  useEffect(() => {
    // Clear timer whenever active session changes (e.g. switching conversations)
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    setTimeLeft(null);

    if (activeSession?.status === 'ONGOING' && activeSession.actual_start_time) {
        if (activeSession.is_paused) {
            setTimeLeft(activeSession.remaining_duration_seconds || 0);
            return;
        }


        const startTime = new Date(activeSession.actual_start_time).getTime();
        const durationMs = activeSession.duration * 60 * 1000;
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const elapsed = now - startTime;
            const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
            setTimeLeft(remaining);
            
            if (remaining === 0) {
                if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
                handleEndSession(true); 
            }
        };

        updateTimer();
        sessionTimerRef.current = setInterval(updateTimer, 1000);
        return () => { if (sessionTimerRef.current) clearInterval(sessionTimerRef.current); };
    }
  }, [activeSession?.id, activeSession?.status, activeSession?.is_paused, activeSession?.actual_start_time]);

  const handlePauseSession = async () => {
    if (!activeSession) return;
    try {
        const response = await sessionsAPI.pauseSession(activeSession.id);
        setActiveSession({
            ...activeSession,
            is_paused: true,
            remaining_duration_seconds: response.data.remaining
        });
    } catch (err) {
        console.error("Failed to pause session:", err);
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;
    try {
        const response = await sessionsAPI.resumeSession(activeSession.id);
        setActiveSession({
            ...activeSession,
            is_paused: false,
            actual_start_time: response.data.actual_start_time
        });
    } catch (err) {
        console.error("Failed to resume session:", err);
    }
  };

  const handleStartSession = async () => {
    if (!activeSession) return;
    try {
        const response = await sessionsAPI.startSession(activeSession.id);
        setActiveSession({
            ...activeSession,
            status: 'ONGOING',
            actual_start_time: response.data.actual_start_time
        });
    } catch (err) {
        console.error("Failed to start session:", err);
        alert("Failed to start session. Please try again.");
    }
  };

  const handleEndSession = async (isAuto = false) => {
    if (!activeSession) return;
    if (!isAuto && !window.confirm("Are you sure you want to end the session early?")) return;
    
    try {
        const endedSessionId = activeSession.id;
        const isTeacher = Number(activeSession.teacher) === Number(user?.id);
        await sessionsAPI.endSession(endedSessionId);
        setActiveSession(null);
        setTimeLeft(null);

        // Show rating modal
        setRatingSessionId(endedSessionId);
        setRatingRole(isTeacher ? 'teacher' : 'student');
        setRatingValue(0);
        setRatingHover(0);
        setFeedbackText("");
        setRatingError(null);
        setShowRatingModal(true);
    } catch (err) {
        console.error("Failed to end session:", err);
    }
  };

  const handleInitiatePayment = async (method: string) => {
    if (!activeSession) return;
    setIsProcessingPayment(true);
    try {
        const response = await paymentAPI.initiatePayment(activeSession.id, 1000, method); 
        if (response.data && response.data.payment_url) {
            window.location.href = response.data.payment_url;
        } else {
            alert("Failed to initiate payment. Please try again.");
            setIsProcessingPayment(false);
        }
    } catch (err) {
        console.error("Payment initiation error:", err);
        alert("An error occurred while initiating payment.");
        setIsProcessingPayment(false);
    }
  };

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

    let wsUrl;
    const hostname = window.location.hostname;
    
    if (hostname.includes('devtunnels.ms') || hostname.includes('preview.app.github.dev')) {
        const backendHostname = hostname.replace('5173', '8000');
        wsUrl = `wss://${backendHostname}/ws/chat/${selectedConversation}/?token=${token}`;
    } else {
        wsUrl = `ws://${hostname}:8000/ws/chat/${selectedConversation}/?token=${token}`;
    }
    
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
                 image: data.image,
                 audio: data.audio,
                 senderId: data.sender_id,
                 userName: data.sender || 'Unknown',
                 userAvatar: '', 
                 timestamp: data.timestamp || new Date().toISOString(),
                 isRead: false,
                 replyTo: data.reply_to_data,
                 messageType: data.message_type,
                 callDuration: data.call_duration
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
             console.log("🔔 Incoming video_offer from:", data.sender_id, "(My ID is:", user?.id, ")");
             // Guard: Never process an offer sent by ourselves
             if (data.sender_id && String(data.sender_id) === String(user?.id)) {
                 console.log("⚠️ Ignoring self-echoed offer");
                 return;
             }
             // Guard: If we are already the one who initiated a call, ignore incoming offers to stay as Caller
             if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== "stable") {
                 console.log("⚠️ Signaling Collision: Staying as Caller, ignoring incoming offer.");
                 return;
             }
             iceCandidateBufferRef.current = [];
             (window as any).pendingOffer = data.data;
             setIsIncomingCall(true);
         }
         
         // Signaling: Answer
         else if (data.type === 'video_answer') {
             console.log("✅ Received video_answer from:", data.sender_id, "(My ID is:", user?.id, ")");
             if (data.sender_id && String(data.sender_id) === String(user?.id)) {
                 console.log("⚠️ Ignoring self-echoed answer");
                 return;
             }
             if (peerConnectionRef.current && peerConnectionRef.current.signalingState === "have-local-offer") {
                 try {
                     console.log("📝 Setting remote description (answer)");
                     await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
                     // Flush any buffered ICE candidates now that remote description is set
                     console.log("💧 Flushing buffered ICE candidates:", iceCandidateBufferRef.current.length);
                     for (const candidate of iceCandidateBufferRef.current) {
                         try {
                             await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                         } catch (e) {
                             console.error("Error adding buffered ICE candidate:", e);
                         }
                     }
                     iceCandidateBufferRef.current = [];
                 } catch (err) {
                     console.error("Error setting remote description:", err);
                 }
             } else {
                 console.warn("🚫 Received answer but PC is not in 'have-local-offer' state. State:", peerConnectionRef.current?.signalingState);
             }
         }
         
         // Signaling: End Call
         else if (data.type === 'end_call') {
             if (data.sender_id === Number(user?.id)) return;
             endCall(false);
         }

         // Signaling: ICE Candidate
         else if (data.type === 'new_ice_candidate') {
             if (String(data.sender_id) === String(user?.id)) return;
             if (!data.data) return;
             const pc = peerConnectionRef.current;
             console.log("🧊 Received remote ICE candidate");
             // If peer connection exists and remote description is set, add immediately
             if (pc && pc.remoteDescription) {
                 try {
                     await pc.addIceCandidate(new RTCIceCandidate(data.data));
                 } catch (e) {
                     console.error("Error adding ICE candidate:", e);
                 }
             } else {
                 console.log("📥 Buffering ICE candidate (no remote description yet)");
                 iceCandidateBufferRef.current.push(data.data);
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

          // Call Log Update
          else if (data.type === 'call_log_update') {
              setMessages(prev => prev.map(m => 
                  m.id === data.message_id ? { ...m, callDuration: data.call_duration, text: data.status_text } : m
              ));
          }

          // Session Ended Update (via WebSocket nudge)
          else if (data.type === 'session_ended') {
              if (Number(data.sender_id) !== Number(user?.id)) {
                  setShowRatingModal(true);
                  setRatingSessionId(data.data.session_id);
                  setRatingRole('student'); // The recipient of the nudge is always the student
                  setRatingValue(0);
                  setRatingHover(0);
                  setFeedbackText("");
                  setRatingError(null);
                  setActiveSession(null);
                  setTimeLeft(null);
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

    pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log("⚡ ICE Connection State:", state);
        if (state === 'failed' || state === 'disconnected') {
            console.warn("⚠️ Connection lost/unstable. ICE state is:", state);
        } else if (state === 'connected' || state === 'completed') {
            console.log("✅ ICE Connection established! Media should flow.");
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
            console.log("📤 Sending local ICE candidate (My ID:", user?.id, ")");
            socketRef.current.send(JSON.stringify({
                type: 'new_ice_candidate',
                data: event.candidate,
                sender_id: user?.id // Explicitly adding sender_id to payload
            }));
        }
    };

    pc.ontrack = (event) => {
        console.log("🎬 Received remote track:", event.track.kind, "State:", event.track.readyState);
        setRemoteStream(prev => {
            if (!prev) {
                const s = new MediaStream();
                s.addTrack(event.track);
                return s;
            }
            if (!prev.getTracks().find(t => t.id === event.track.id)) {
                prev.addTrack(event.track);
            }
            // Always return a new MediaStream to trigger React re-renders/prop updates
            return new MediaStream(prev.getTracks());
        });

        event.track.onunmute = () => {
             console.log("🔊 Track unmuted:", event.track.kind);
             if (remoteVideoRef.current) {
                 remoteVideoRef.current.play().catch(e => {
                     if (e.name !== 'AbortError') console.error("Play error on unmute:", e);
                 });
             }
        };

        // Redundant nudge for certain browsers
        if (remoteVideoRef.current) {
            remoteVideoRef.current.play().catch(() => {});
        }
    };

    return pc;
};

const startCall = async () => {
    setIsInCall(true);
    setCallStatus("Calling...");
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
            audio: true 
        });
        localStreamRef.current = stream;
        setLocalStreamReady(true);
        
        const pc = createPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socketRef.current) {
            socketRef.current.send(JSON.stringify({
                type: 'video_offer',
                data: offer,
                sender_id: user?.id
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
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("BrowserNotSupported");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } }, 
            audio: true 
        });
        localStreamRef.current = stream;
        setLocalStreamReady(true);
        
        const pc = createPeerConnection();
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        peerConnectionRef.current = pc;

        const offer = (window as any).pendingOffer;
        if (offer) {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            // Flush any ICE candidates that arrived while user was deciding to accept
            for (const candidate of iceCandidateBufferRef.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding buffered ICE candidate in acceptCall:", e);
                }
            }
            iceCandidateBufferRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (socketRef.current) {
                socketRef.current.send(JSON.stringify({
                    type: 'video_answer',
                    data: answer,
                    sender_id: user?.id
                }));
            }
        } else {
            console.warn("No pending offer found when accepting call.");
            alert("Call connection error: missing signaling data.");
            endCall();
            return;
        }

    } catch (err: any) {
        console.error("Error accepting call:", err);
        let errorMsg = "Could not start video call.";
        
        if (err.message === "BrowserNotSupported") {
            errorMsg = "Your browser does not support video calls on this connection. Ensure you use HTTPS or the chrome://flags workaround.";
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMsg = "Camera or Microphone permission was denied. Please allow access in browser settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMsg = "No camera or microphone found on your device.";
        } else if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            errorMsg = "Video calls require a Secure Connection (HTTPS) or a special browser flag on mobile.";
        }
        
        alert(errorMsg);
        endCall();
    }
};

const endCall = (sendSignal = true) => {
    setIsInCall(false);
    setIsIncomingCall(false);
    setCallStatus("");
    
    if (sendSignal && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
            type: 'end_call'
        }));
    }
    
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }

    // Clear tracks from remote stream
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => {
            track.stop();
        });
        setRemoteStream(null);
    }


    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }

    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
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

const toggleScreenShare = async () => {
    if (!isInCall || !peerConnectionRef.current) return;

    if (!isScreenSharing) {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            screenStreamRef.current = screenStream;
            const screenTrack = screenStream.getVideoTracks()[0];

            // Get existing video sender and replace track
            const senders = peerConnectionRef.current.getSenders();
            const videoSender = senders.find(s => s.track?.kind === 'video');
            
            if (videoSender) {
                videoSender.replaceTrack(screenTrack);
            }

            // Professional behavior: turn off camera if it was on
            if (cameraOn) {
                if (localStreamRef.current) {
                    localStreamRef.current.getVideoTracks().forEach(t => t.enabled = false);
                    setCameraOn(false);
                }
            }

            setIsScreenSharing(true);

            // Revert when screen share stopped by browser UI
            screenTrack.onended = () => {
                stopScreenShare();
            };

        } catch (err) {
            console.error("Screen share error:", err);
        }
    } else {
        stopScreenShare();
    }
};

const stopScreenShare = () => {
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
    }

    // Revert to camera track in peer connection
    if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
            videoSender.replaceTrack(videoTrack).catch(err => console.error("Error reverting camera:", err));
        }
    }
    
    setIsScreenSharing(false);
};

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !imagePreview && !isRecording) return;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        try {
            const payload: any = {
                message: messageText,
                reply_to_id: replyingTo?.id
            };

            if (imagePreview) {
                payload.image = imagePreview;
            }

            if (isRecording) {
                // If currently recording, stop it and wait briefly for the stop event to populate pendingAudio
                setIsRecording(false);
                if (timerRef.current) clearInterval(timerRef.current);
                mediaRecorderRef.current?.stop();
                
                // Wait for the reader to finish (rough approximation for demo/simplicity)
                await new Promise(resolve => setTimeout(resolve, 500));
                if ((window as any).pendingAudio) {
                    payload.audio = (window as any).pendingAudio;
                    delete (window as any).pendingAudio;
                }
            }

            socketRef.current.send(JSON.stringify(payload));
            setMessageText("");
            setReplyingTo(null);
            setSelectedImage(null);
            setImagePreview(null);
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64Audio = reader.result as string;
                // We'll send this in handleSendMessage
                (window as any).pendingAudio = base64Audio;
            };
            stream.getTracks().forEach(t => t.stop());
        };

        recorder.start();
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selected = conversations.find((c) => c.id === selectedConversation);

  return (
    <>
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
                            src={getMediaUrl(conv.userAvatar)}
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
                        src={getMediaUrl(selected.userAvatar)}
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
                    {/* Session controls & Call Buttons */}
                    <div className="flex items-center space-x-3">
                        {/* Timer Display */}
                            <div className={`px-3 py-1.5 rounded-full font-mono font-bold flex items-center gap-2 shadow-sm border transition-all ${
                                activeSession?.is_paused
                                ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                                : timeLeft !== null && timeLeft < 300 
                                ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${
                                    activeSession?.is_paused ? 'bg-yellow-600' :
                                    timeLeft !== null && timeLeft < 300 ? 'bg-red-600' : 'bg-blue-600'
                                }`} />
                                {activeSession?.is_paused ? 'PAUSED ' : ''}
                                {timeLeft !== null && (
                                    <>
                                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                                    </>
                                )}
                            </div>

                        {/* Teacher Controls */}
                        {activeSession && user && Number(activeSession.teacher) === Number(user.id) && (
                            <>
                                {activeSession.status === 'SCHEDULED' && (
                                    <button 
                                        onClick={handleStartSession}
                                        disabled={!activeSession.is_paid}
                                        className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-lg flex items-center gap-2 ${
                                            activeSession.is_paid 
                                            ? "bg-green-500 hover:bg-green-600 shadow-green-500/20" 
                                            : "bg-gray-400 cursor-not-allowed shadow-none"
                                        }`}
                                    >
                                        <div className={`w-2 h-2 bg-white rounded-full ${activeSession.is_paid ? "animate-pulse" : ""}`} />
                                        {activeSession.is_paid 
                                            ? (activeSession.is_free ? "Start Free Session" : "Start Paid Session") 
                                            : "Waiting for Payment"}
                                    </button>
                                )}
                                {activeSession.status === 'ONGOING' && (
                                    <>
                                        <button 
                                            onClick={activeSession.is_paused ? handleResumeSession : handlePauseSession}
                                            disabled={confirmingEnd}
                                            className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-lg ${
                                                confirmingEnd
                                                ? 'opacity-40 cursor-not-allowed bg-gray-400 shadow-none'
                                                : activeSession.is_paused 
                                                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20' 
                                                : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20'
                                            }`}
                                        >
                                            {activeSession.is_paused ? 'Resume' : 'Pause'}
                                        </button>
                                        {!confirmingEnd ? (
                                            <button 
                                                onClick={() => {
                                                    setConfirmingEnd(true);
                                                    setConfirmCountdown(5);
                                                    let count = 5;
                                                    if (confirmTimerRef.current) clearInterval(confirmTimerRef.current);
                                                    confirmTimerRef.current = setInterval(() => {
                                                        count--;
                                                        setConfirmCountdown(count);
                                                        if (count <= 0) {
                                                            clearInterval(confirmTimerRef.current);
                                                            confirmTimerRef.current = null;
                                                            setConfirmingEnd(false);
                                                        }
                                                    }, 1000);
                                                }}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-red-500/20"
                                            >
                                                End Session
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 animate-in fade-in duration-200">
                                                <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">Are you sure?</span>
                                                <button
                                                    onClick={() => {
                                                        if (confirmTimerRef.current) { clearInterval(confirmTimerRef.current); confirmTimerRef.current = null; }
                                                        setConfirmingEnd(false);
                                                        handleEndSession(false);
                                                    }}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-all shadow-sm whitespace-nowrap"
                                                >
                                                    Yes, End
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirmTimerRef.current) { clearInterval(confirmTimerRef.current); confirmTimerRef.current = null; }
                                                        setConfirmingEnd(false);
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-md hover:bg-gray-300 dark:hover:bg-slate-600 transition-all flex items-center gap-1.5"
                                                >
                                                    Cancel
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-300 dark:bg-slate-600 text-[10px] font-mono font-bold text-gray-600 dark:text-gray-300">{confirmCountdown}</span>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* Student Controls */}
                        {activeSession && user && Number(activeSession.student) === Number(user.id) && (
                            <>
                                {activeSession.status === 'SCHEDULED' && !activeSession.is_paid && (
                                    <button 
                                        onClick={() => setShowPaymentModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 flex flex-col items-center leading-none"
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <VideoIcon className="w-4 h-4" />
                                          <span>Pay NPR {parseFloat(activeSession.total_price.toString()).toFixed(2)} to Join</span>
                                        </div>
                                        <span className="text-[10px] opacity-60 font-normal">Secure payment via Khalti or Stripe</span>
                                    </button>
                                )}
                                {activeSession.status === 'SCHEDULED' && activeSession.is_paid && (
                                    <div className="px-4 py-2 bg-green-100 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                                        {activeSession.is_free ? 'Free Trial Session' : 'Fee Paid - Waiting for Teacher'}
                                    </div>
                                )}
                            </>
                        )}

                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-slate-800 mx-1" />

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
                      <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col md:rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                          <div className="relative flex-1 bg-slate-950 flex items-center justify-center group">
                              {/* Remote Video Background (Blurred) */}
                              <div className="absolute inset-0 opacity-30 blur-3xl scale-110 pointer-events-none overflow-hidden">
                                  <video 
                                      ref={remoteBackgroundVideoRef}
                                      autoPlay 
                                      muted 
                                      className="w-full h-full object-cover"
                                  />
                              </div>

                              {/* Remote Video */}
                            <video 
                                ref={remoteVideoRef}
                                autoPlay 
                                playsInline 
                                muted={false}
                                className="relative z-10 w-auto h-full max-h-screen max-w-full object-contain transition-all duration-700"
                                onLoadedMetadata={() => {
                                    console.log("📽️ Remote metadata loaded");
                                    remoteVideoRef.current?.play().catch(() => {});
                                }}
                            />
                              
                              {/* Local Video (Floating) */}
                              <div className="absolute top-6 right-6 w-32 h-44 md:w-56 md:h-72 z-30 bg-slate-800 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-500 hover:scale-105 hover:border-blue-500/50 group-hover:translate-x-0">
                                  <video 
                                      key={`local-video-${localStreamReady}`}
                                      ref={(el) => {
                                          if (el && localStreamRef.current) {
                                              if (el.srcObject !== localStreamRef.current) {
                                                  console.log("📹 Starting local camera view (Ready:", localStreamReady, ")");
                                                  el.srcObject = localStreamRef.current;
                                                  el.load();
                                              }
                                              el.play().catch(e => console.error("Local video error:", e));
                                          }
                                      }} 
                                      autoPlay 
                                      playsInline 
                                      muted 
                                      className="w-full h-full object-cover -scale-x-100"
                                  />
                                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md">
                                      <p className="text-[10px] text-white font-medium">You</p>
                                  </div>
                              </div>

                              {/* Top Bar with Status */}
                              <div className="absolute top-8 left-8 z-30 flex items-center space-x-4">
                                  <div className="flex flex-col">
                                      <h3 className="text-white font-bold text-lg md:text-xl drop-shadow-md">{selected?.userName || 'Participant'}</h3>
                                      <div className="flex items-center space-x-2">
                                          <div className={`w-2 h-2 rounded-full ${callStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                          <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{callStatus}</p>
                                      </div>
                                  </div>
                              </div>

                              {/* Session Timer in Video Call */}
                              {activeSession?.status === 'ONGOING' && timeLeft !== null && (
                                  <div className="absolute top-8 right-8 z-30">
                                      <div className={`px-4 py-2 rounded-2xl backdrop-blur-2xl border font-mono font-bold text-sm flex items-center gap-2 shadow-lg transition-all ${
                                          activeSession.is_paused
                                              ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
                                              : timeLeft < 300
                                              ? 'bg-red-500/20 border-red-400/30 text-red-300 animate-pulse'
                                              : 'bg-white/10 border-white/10 text-white'
                                      }`}>
                                          <div className={`w-2 h-2 rounded-full ${
                                              activeSession.is_paused ? 'bg-yellow-400' :
                                              timeLeft < 300 ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                                          }`} />
                                          {activeSession.is_paused && <span className="text-xs">PAUSED</span>}
                                          <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                                      </div>
                                  </div>
                              )}

                              {/* Floating Glass Controls */}
                              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 px-6 py-4 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 flex items-center space-x-6 transition-all duration-300 hover:bg-white/15 hover:scale-105 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                  <button 
                                      onClick={toggleMic}
                                      className={`p-4 rounded-2xl transition-all duration-300 ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                      title={micOn ? "Mute" : "Unmute"}
                                  >
                                      {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                                  </button>

                                  <button 
                                      onClick={() => endCall()}
                                      className="p-5 rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-600/30 hover:scale-110 active:scale-95 group-endcall"
                                      title="End Call"
                                  >
                                      <Phone className="w-8 h-8 rotate-[135deg]" />
                                  </button>

                                  <button 
                                      onClick={toggleScreenShare}
                                      className={`p-4 rounded-2xl transition-all duration-300 ${isScreenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                      title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
                                  >
                                      <Monitor className="w-6 h-6" />
                                  </button>

                                  <button 
                                      onClick={toggleCamera}
                                      className={`p-4 rounded-2xl transition-all duration-300 ${cameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                      title={cameraOn ? "Stop Video" : "Start Video"}
                                  >
                                      {cameraOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                                  </button>
                              </div>
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
                                       onClick={() => endCall()}
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
                                         {msg.audio && (
                                            <div className="mb-2 max-w-full">
                                                <audio 
                                                    controls 
                                                    className={`h-8 w-48 md:w-64 ${isMe ? 'brightness-125' : ''}`}
                                                    src={getMediaUrl(msg.audio)}
                                                />
                                            </div>
                                        )}
                                        {msg.image && (
                                            <div className="mb-2 relative rounded-lg overflow-hidden border border-black/5">
                                                <img 
                                                    src={getMediaUrl(msg.image)} 
                                                    alt="Attached" 
                                                    className="max-h-64 w-auto object-contain cursor-zoom-in hover:brightness-95 transition-all"
                                                />
                                            </div>
                                        )}
                                        {msg.messageType === 'video_call' && (() => {
                                            const isPickedUp = msg.callDuration && msg.callDuration > 0;
                                            const colorClass = isPickedUp 
                                                ? (isMe ? 'text-green-300' : 'text-green-600 dark:text-green-400') 
                                                : (isMe ? 'text-red-300' : 'text-red-600 dark:text-red-400');
                                            const bgColor = isMe ? 'bg-white/20' : (isPickedUp ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20');

                                            return (
                                                <div className={`flex items-start space-x-3 py-2 mb-2 border-b ${isMe ? 'border-white/20' : 'border-gray-200 dark:border-slate-700'}`}>
                                                    <div className={`p-2 rounded-full ${bgColor} ${colorClass}`}>
                                                        <VideoIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-bold uppercase tracking-wider block">
                                                            {isMe ? 'Outgoing' : 'Incoming'} Video Call
                                                        </span>
                                                        <span className={`text-[11px] font-bold truncate ${colorClass}`}>
                                                            {isPickedUp 
                                                                ? `Picked up • ${Math.floor(msg.callDuration! / 60)}:${(msg.callDuration! % 60).toString().padStart(2, '0')}` 
                                                                : "Missed Call"}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        {msg.text && msg.messageType !== 'video_call' && (
                                            <p className={`text-sm md:text-base leading-relaxed break-words ${msg.isDeleted ? 'italic opacity-70' : ''}`}>
                                                {msg.text}
                                            </p>
                                        )}
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
                     {/* Image Preview Area */}
                     {imagePreview && (
                         <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/30 flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2">
                             <div className="relative group">
                                 <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm" />
                                 <button 
                                     type="button"
                                     onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                 >
                                     <X className="w-3 h-3" />
                                 </button>
                             </div>
                             <div className="flex-1">
                                 <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{selectedImage?.name}</p>
                                 <p className="text-[10px] text-gray-500 italic">{(selectedImage!.size / 1024).toFixed(1)} KB</p>
                             </div>
                         </div>
                     )}

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
                     
                     <div className="p-4 flex items-center space-x-3">
                       <div className="flex items-center space-x-1 shrink-0">
                           <input 
                               type="file" 
                               ref={fileInputRef} 
                               onChange={handleImageSelect} 
                               accept="image/*" 
                               className="hidden" 
                           />
                           <button
                             type="button"
                             onClick={() => fileInputRef.current?.click()}
                             className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all hover:text-blue-600 dark:hover:text-blue-400 active:scale-90"
                             title="Attach Image"
                           >
                             <ImageIcon className="w-5 h-5" />
                           </button>
                           <button
                             type="button"
                             onClick={toggleRecording}
                             className={`p-2 rounded-full transition-all active:scale-90 ${
                               isRecording 
                               ? 'bg-red-100 text-red-600 animate-pulse' 
                               : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-red-500'
                             }`}
                             title={isRecording ? "Stop Recording" : "Voice Message"}
                           >
                             <Mic className="w-5 h-5" />
                           </button>
                       </div>

                       {isRecording ? (
                           <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/30 animate-in fade-in scale-in-95">
                               <div className="flex items-center space-x-2">
                                   <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                                   <span className="text-sm font-medium text-red-600 dark:text-red-400">Recording Voice...</span>
                               </div>
                               <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">{formatTime(recordingTime)}</span>
                           </div>
                       ) : (
                           <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-colors"
                          />
                       )}
                       
                       <button
                         type="submit"
                         disabled={!messageText.trim() && !imagePreview && !isRecording}
                         className={`px-6 py-2 rounded-lg text-white font-medium flex items-center space-x-2 transition-all active:scale-95 shadow-md ${
                            (messageText.trim() || imagePreview || isRecording)
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' 
                            : 'bg-gray-300 dark:bg-slate-800 text-gray-500 dark:text-slate-600 cursor-not-allowed'
                         }`}
                       >
                         <Send className="w-4 h-4" />
                         <span>{isRecording ? 'Send Voice' : 'Send'}</span>
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

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 border-none shadow-2xl p-0 overflow-hidden">
          <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:20px_20px]" />
            <div className="z-10 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">Secure Checkout</h3>
            </div>
          </div>
          
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-gray-900 dark:text-white text-xl font-bold">Choose Payment Method</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                You are paying <span className="font-bold text-blue-600 dark:text-blue-400">NPR {activeSession ? parseFloat(activeSession.total_price.toString()).toFixed(2) : "0.00"}</span> for your learning session.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row gap-4 py-2">
              <button
                onClick={() => handleInitiatePayment('KHALTI')}
                disabled={isProcessingPayment}
                className="group relative flex-1 flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-300 text-center"
              >
                <div className="w-25 h-25 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform overflow-hidden p-2">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/e/ee/Khalti_Digital_Wallet_Logo.png.jpg" 
                    alt="Khalti" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">Khalti Wallet</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Pay using your Khalti account</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
              </button>

              <button
                onClick={() => handleInitiatePayment('STRIPE')}
                disabled={isProcessingPayment}
                className="group relative flex-1 flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-300 text-center"
              >
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform overflow-hidden p-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white mb-1">Stripe Payment</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">Pay using your Stripe account</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
              </button>
            </div>

            {isProcessingPayment && (
              <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Redirecting to payment gateway...</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center justify-center space-x-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Secure</span>
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
                <div className="h-8 w-px bg-gray-100 dark:bg-slate-800" />
                <div className="flex space-x-2 opacity-50 grayscale transition-all hover:grayscale-0">
                  {/* Mimic small logo icons or just text for simplicity */}
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white px-1.5 py-0.5 border rounded uppercase">Visa</span>
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white px-1.5 py-0.5 border rounded uppercase">MC</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

    {/* Session Rating Modal */}
    {showRatingModal && ratingSessionId && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-md" style={{ animation: 'scaleIn 0.2s ease-out' }}>
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Session Complete!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">How was your experience?</p>
              </div>
            </div>
            <button
              onClick={() => { setShowRatingModal(false); setRatingError(null); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-5 space-y-5">
            {/* Star Selector */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (ratingHover || ratingValue)
                          ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {ratingValue === 1 ? 'Poor' : ratingValue === 2 ? 'Fair' : ratingValue === 3 ? 'Good' : ratingValue === 4 ? 'Very Good' : ratingValue === 5 ? 'Excellent' : 'Select a rating'}
              </p>
            </div>

            {/* Feedback Text */}
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={3}
              placeholder="Share your experience (optional)..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 text-sm resize-none outline-none transition-all"
            />

            {ratingError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {ratingError}
              </div>
            )}
          </div>
          <div className="flex gap-3 p-5 border-t dark:border-slate-800 font-bold">
            <button
              onClick={() => setShowRatingModal(false)}
              className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={async () => {
                if (!ratingValue || !ratingSessionId) return;
                try {
                  setRatingLoading(true);
                  setRatingError(null);
                  await sessionsAPI.submitFeedback(ratingSessionId, ratingValue, feedbackText.trim(), ratingRole);
                  setShowRatingModal(false);
                } catch (e: any) {
                  setRatingError(e?.response?.data?.error || 'Failed to submit rating.');
                } finally {
                  setRatingLoading(false);
                }
              }}
              disabled={!ratingValue || ratingLoading}
              className="flex-1 px-4 py-2.5 text-white bg-amber-600 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {ratingLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Star className="w-4 h-4" />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
