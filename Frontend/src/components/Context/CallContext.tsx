import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

interface CallContextType {
    isInCall: boolean;
    isIncomingCall: boolean;
    callStatus: string;
    incomingCallData: any;
    remoteStream: MediaStream | null;
    localStream: MediaStream | null;
    micOn: boolean;
    cameraOn: boolean;
    isScreenSharing: boolean;
    acceptCall: () => Promise<void>;
    startCall: (roomId: number, partnerName: string) => Promise<void>;
    endCall: (sendSignal?: boolean) => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    toggleScreenShare: () => Promise<void>;
    setIsIncomingCall: (val: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.l.google.com:19305' },
        {
            urls: [
                'turn:openrelay.metered.ca:80',
                'turn:openrelay.metered.ca:443',
                'turns:openrelay.metered.ca:443',
            ],
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    const [isInCall, setIsInCall] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState<any>(null);
    const [callStatus, setCallStatus] = useState("");
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const socketRef = useRef<WebSocket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const iceCandidateBufferRef = useRef<any[]>([]);
    const pendingOfferRef = useRef<any>(null);
    const currentRoomIdRef = useRef<number | null>(null);

    // Global Notification Socket
    const reconnectTimeoutRef = useRef<any>(null);

    useEffect(() => {
        let isStopped = false;

        const connect = () => {
            if (!isAuthenticated || !user || isStopped) return;

            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const hostname = window.location.hostname;
            let wsUrl;
            if (hostname.includes('devtunnels.ms') || hostname.includes('preview.app.github.dev')) {
                const backendHostname = hostname.replace('5173', '8000');
                wsUrl = `wss://${backendHostname}/ws/notifications/?token=${token}`;
            } else {
                wsUrl = `ws://${hostname}:8000/ws/notifications/?token=${token}`;
            }

            console.log("🔌 Attempting Global Notification Socket connection...");
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;

            socket.onopen = () => {
                if (isStopped) {
                    socket.close();
                    return;
                }
                console.log("🔌 Global Notification Socket Connected");
            };

            socket.onerror = (error) => {
                // Only log if not intentional stop
                if (!isStopped) console.error("Global Notification Socket Error");
            };

            socket.onclose = (event) => {
                if (isStopped) return;
                console.log("🔌 Global Notification Socket Closed", event.code, event.reason);
                
                // Reconnect on abnormal closure
                if (event.code !== 1000 && !isStopped) {
                    reconnectTimeoutRef.current = setTimeout(connect, 3000);
                }
            };

            socket.onmessage = async (e) => {
                if (isStopped) return;
                const data = JSON.parse(e.data);
                
                if (data.type === 'video_offer') {
                    if (String(data.sender_id) === String(user.id)) return;
                    console.log("🔔 Global Incoming Call from:", data.sender_name);
                    
                    pendingOfferRef.current = data.data;
                    currentRoomIdRef.current = data.room_id;
                    setIncomingCallData(data);
                    setIsIncomingCall(true);
                } 
                else if (data.type === 'video_answer') {
                    if (String(data.sender_id) === String(user.id)) return;
                    if (peerConnectionRef.current && peerConnectionRef.current.signalingState === "have-local-offer") {
                        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.data));
                        for (const candidate of iceCandidateBufferRef.current) {
                            try {
                                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                            } catch (e) {}
                        }
                        iceCandidateBufferRef.current = [];
                    }
                } 
                else if (data.type === 'new_ice_candidate') {
                    if (String(data.sender_id) === String(user.id)) return;
                    if (!data.data) return;
                    if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
                        try {
                            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.data));
                        } catch (e) {}
                    } else {
                        iceCandidateBufferRef.current.push(data.data);
                    }
                } 
                else if (data.type === 'end_call') {
                    if (String(data.sender_id) === String(user.id)) return;
                    endCall(false);
                }
            };
        };

        connect();

        return () => {
            isStopped = true;
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) {
                // Check state to avoid "closed before established" error noise
                if (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.close(1000, "Component unmounted");
                }
            }
        };
    }, [isAuthenticated, user?.id]);

    const createPeerConnection = () => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current) {
                socketRef.current.send(JSON.stringify({
                    type: 'new_ice_candidate',
                    data: event.candidate,
                    sender_id: user?.id,
                    room_id: currentRoomIdRef.current // Important for backend forwarding
                }));
            }
        };

        pc.ontrack = (event) => {
            setRemoteStream(prev => {
                if (!prev) {
                    const s = new MediaStream();
                    s.addTrack(event.track);
                    return s;
                }
                if (!prev.getTracks().find(t => t.id === event.track.id)) {
                    prev.addTrack(event.track);
                }
                return new MediaStream(prev.getTracks());
            });
        };

        return pc;
    };

    const startCall = async (roomId: number, partnerName: string) => {
        currentRoomIdRef.current = roomId;
        setIsInCall(true);
        setCallStatus("Calling...");
        setIncomingCallData({ sender_name: partnerName });

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setLocalStream(stream);

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            peerConnectionRef.current = pc;

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            if (socketRef.current) {
                socketRef.current.send(JSON.stringify({
                    type: 'video_offer',
                    data: offer,
                    sender_id: user?.id,
                    room_id: roomId
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
            setLocalStream(stream);

            const pc = createPeerConnection();
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            peerConnectionRef.current = pc;

            if (pendingOfferRef.current) {
                await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
                for (const candidate of iceCandidateBufferRef.current) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
                }
                iceCandidateBufferRef.current = [];

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                if (socketRef.current) {
                    socketRef.current.send(JSON.stringify({
                        type: 'video_answer',
                        data: answer,
                        sender_id: user?.id,
                        room_id: currentRoomIdRef.current
                    }));
                }
            }
        } catch (err) {
            console.error("Error accepting call:", err);
            endCall();
        }
    };

    const endCall = (sendSignal = true) => {
        if (sendSignal && socketRef.current) {
            socketRef.current.send(JSON.stringify({ 
                type: 'end_call',
                room_id: currentRoomIdRef.current 
            }));
        }

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        
        setIsInCall(false);
        setIsIncomingCall(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus("");
        setIncomingCallData(null);
        setIsScreenSharing(false);
        pendingOfferRef.current = null;
        currentRoomIdRef.current = null;
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !micOn);
            setMicOn(!micOn);
        }
    };

    const toggleCamera = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !cameraOn);
            setCameraOn(!cameraOn);
        }
    };

    const toggleScreenShare = async () => {
        if (!peerConnectionRef.current) return;

        try {
            if (!isScreenSharing) {
                // Start Screen Share
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = stream;
                
                const screenTrack = stream.getVideoTracks()[0];
                
                // Replace video track in peer connection
                const videoSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(screenTrack);
                }

                setLocalStream(stream); // Show screen in local preview too
                setIsScreenSharing(true);

                // Handle when user clicks "Stop Sharing" from browser UI
                screenTrack.onended = () => {
                    stopScreenShare();
                };
            } else {
                await stopScreenShare();
            }
        } catch (err) {
            console.error("Error toggling screen share:", err);
        }
    };

    const stopScreenShare = async () => {
        if (!peerConnectionRef.current || !localStreamRef.current) return;

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const videoSender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
        }

        setLocalStream(localStreamRef.current);
        setIsScreenSharing(false);
    };

    return (
        <CallContext.Provider value={{
            isInCall, isIncomingCall, callStatus, incomingCallData,
            remoteStream, localStream, micOn, cameraOn, isScreenSharing,
            acceptCall, startCall, endCall, toggleMic, toggleCamera, toggleScreenShare,
            setIsIncomingCall
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) throw new Error("useCall must be used within CallProvider");
    return context;
};
