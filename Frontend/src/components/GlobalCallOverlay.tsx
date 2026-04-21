import React, { useRef, useEffect } from "react";
import { useCall } from "./Context/CallContext";
import { Video as VideoIcon, Mic, MicOff, Phone, VideoOff, Monitor, X } from "lucide-react";

export const GlobalCallOverlay: React.FC = () => {
    const { 
        isInCall, isIncomingCall, callStatus, incomingCallData,
        remoteStream, localStream, micOn, cameraOn, isScreenSharing,
        acceptCall, endCall, toggleMic, toggleCamera, toggleScreenShare
    } = useCall();

    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, isInCall]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, isInCall]);

    if (!isInCall && !isIncomingCall) return null;

    return (
        <>
            {/* Incoming Call Notification (Top Right) */}
            {isIncomingCall && !isInCall && (
                <div className="fixed top-6 right-6 z-[9999] animate-bounce-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-slate-700 flex flex-col items-center w-72 backdrop-blur-xl">
                        <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 animate-pulse">
                            <VideoIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Incoming Call...</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">{incomingCallData?.sender_name}</p>
                        <div className="flex space-x-3 w-full">
                            <button 
                                onClick={() => endCall(true)}
                                className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 font-bold transition-all active:scale-95"
                            >
                                Decline
                            </button>
                            <button 
                                onClick={acceptCall}
                                className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 font-bold transition-all shadow-lg shadow-green-500/25 active:scale-95"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Call Overlay (Full Screen) */}
            {isInCall && (
                <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col overflow-hidden h-[100dvh] w-screen animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative flex-1 bg-slate-950 flex items-center justify-center group overflow-hidden">
                        {/* Remote Video */}
                        <video 
                            ref={remoteVideoRef}
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-contain max-h-full"
                        />
                        
                        {/* Local Video (Floating) */}
                        <div className="absolute top-4 right-4 md:top-8 md:right-8 w-32 h-44 md:w-48 md:h-64 z-30 bg-slate-800 rounded-2xl md:rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-500 hover:scale-105 border-blue-500/30">
                            <video 
                                ref={localVideoRef}
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover -scale-x-100"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md">
                                <p className="text-[10px] text-white font-bold">You</p>
                            </div>
                        </div>

                        {/* Top Bar with Status */}
                        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-30 flex items-center space-x-4">
                            <div className="flex flex-col">
                                <h3 className="text-white font-bold text-xl md:text-2xl drop-shadow-lg">{incomingCallData?.sender_name || 'Participant'}</h3>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${callStatus === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{callStatus || 'In Call'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Controls */}
                        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-40 px-4 py-3 md:px-6 md:py-4 bg-white/10 backdrop-blur-2xl rounded-2xl md:rounded-[2rem] border border-white/10 flex items-center space-x-3 md:space-x-5 transition-all duration-300 hover:bg-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
                            <button 
                                onClick={toggleMic}
                                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                title={micOn ? "Mute" : "Unmute"}
                            >
                                {micOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
                            </button>

                            <button 
                                onClick={toggleCamera}
                                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${cameraOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'}`}
                                title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
                            >
                                {cameraOn ? <VideoIcon className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
                            </button>

                            <button 
                                onClick={() => endCall(true)}
                                className="p-4 md:p-5 rounded-xl md:rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-all duration-300 shadow-xl shadow-red-600/30 hover:scale-110 active:scale-95 mx-2"
                                title="End Call"
                            >
                                <Phone className="w-6 h-6 md:w-8 md:h-8 rotate-[135deg]" />
                            </button>

                            <button 
                                onClick={toggleScreenShare}
                                className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 ${isScreenSharing ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                            >
                                <Monitor className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
