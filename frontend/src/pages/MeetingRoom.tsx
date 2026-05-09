import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  MessageSquare, Users, 
  MonitorUp, Sparkles, Send, MonitorX, Copy,
  PenTool
} from 'lucide-react';
import Whiteboard from '../components/Whiteboard';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

interface PeerConnection {
  [key: string]: RTCPeerConnection;
}

export default function MeetingRoom() {
  const { id: meetingId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<PeerConnection>({});
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; stream: MediaStream }[]>([]);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [activeView, setActiveView] = useState<'video' | 'whiteboard'>('video');

  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);
    const userId = Math.random().toString(36).substring(7);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = mediaStream;
        }
        joinRoom(mediaStream);
      })
      .catch((err) => {
        console.error("Failed to get local stream, joining without media", err);
        const emptyStream = new MediaStream();
        setStream(emptyStream);
        joinRoom(emptyStream);
      });

    function joinRoom(mediaStream: MediaStream) {
      socketRef.current?.emit('join-room', { meetingId, userId });

      // When a new user connects
      socketRef.current?.on('user-connected', (socketId: string) => {
        const peer = createPeer(socketId, mediaStream);
        peersRef.current[socketId] = peer;
      });

      // Handle incoming signals (offers, answers, ICE candidates)
      socketRef.current?.on('signal', async (data: { from: string; signal: any }) => {
        const { from, signal } = data;
        let peer = peersRef.current[from];

        if (!peer) {
          peer = addPeer(from, mediaStream);
          peersRef.current[from] = peer;
        }

        if (signal.type === 'offer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          socketRef.current?.emit('signal', { to: from, signal: peer.localDescription });
        } else if (signal.type === 'answer') {
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await peer.addIceCandidate(new RTCIceCandidate(signal));
        }
      });

      socketRef.current?.on('user-disconnected', (socketId: string) => {
        if (peersRef.current[socketId]) {
          peersRef.current[socketId].close();
          delete peersRef.current[socketId];
        }
        setRemoteStreams((prev) => prev.filter((s) => s.id !== socketId));
      });

      // Custom chat events
      socketRef.current?.on('chat-message', (data: { sender: string; text: string }) => {
        setMessages((prev) => [...prev, data]);
      });
    }

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
      Object.values(peersRef.current).forEach((p) => p.close());
    };
  }, [meetingId]);

  const createPeer = (userToSignal: string, stream: MediaStream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', { to: userToSignal, signal: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStreams((prev) => {
        if (!prev.find((s) => s.id === userToSignal)) {
          return [...prev, { id: userToSignal, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socketRef.current?.emit('signal', { to: userToSignal, signal: offer });
    });

    return peer;
  };

  const addPeer = (incomingSignalUser: string, stream: MediaStream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('signal', { to: incomingSignalUser, signal: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setRemoteStreams((prev) => {
        if (!prev.find((s) => s.id === incomingSignalUser)) {
          return [...prev, { id: incomingSignalUser, stream: event.streams[0] }];
        }
        return prev;
      });
    };

    return peer;
  };

  const toggleMute = () => {
    if (stream && stream.getAudioTracks().length > 0) {
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      setIsMuted(!stream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (stream && stream.getVideoTracks().length > 0) {
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      setIsVideoOff(!stream.getVideoTracks()[0].enabled);
    }
  };

  const stopScreenShare = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);
      });
    }

    if (userVideoRef.current) {
      userVideoRef.current.srcObject = stream;
    }

    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      screenTrack.onended = () => {
        stopScreenShare();
      };

      Object.values(peersRef.current).forEach((peer) => {
        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
      });

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = screenStream;
      }
      
      setIsScreenSharing(true);
      setActiveView('video'); // Focus back on video if sharing screen
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const endCall = () => {
    stream?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach(track => track.stop());
    navigate('/dashboard');
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const msg = { sender: 'You', text: chatInput };
      setMessages((prev) => [...prev, msg]);
      socketRef.current?.emit('chat-message', { ...msg, meetingId });
      setChatInput('');
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden relative">
      {/* Animated Mesh Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-80' : ''}`}>
        
        {/* Top Header */}
        <div className="h-20 px-6 flex items-center justify-between absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-slate-950/90 to-transparent">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900/60 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-xl">
              <span className="text-white font-bold tracking-wider">{meetingId}</span>
              <div className="w-px h-5 bg-white/20"></div>
              <button 
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                title="Copy Invite Link"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm font-medium">Copy</span>
              </button>
            </div>
            {aiEnabled && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-2xl text-sm font-medium backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <Sparkles className="w-4 h-4" />
                AI Assistant
              </motion.div>
            )}
          </div>
        </div>

        {/* Content Area (Video Grid or Whiteboard) */}
        <div className="flex-1 p-6 flex flex-col justify-center items-center relative z-0 mt-20 mb-28 w-full h-full">
          
          {activeView === 'whiteboard' ? (
            <div className="w-full h-full flex flex-col relative gap-4">
              {/* Floating PIP Video Strip */}
              <div className="flex gap-4 overflow-x-auto w-full pb-2 scrollbar-hide">
                 <div className="relative w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/20 shadow-xl flex-shrink-0">
                    <video 
                      ref={userVideoRef} 
                      autoPlay muted playsInline
                      className={`w-full h-full object-cover ${isVideoOff && !isScreenSharing ? 'hidden' : ''}`} 
                      style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/60 backdrop-blur-md px-2 py-0.5 rounded text-white text-xs font-medium">You</div>
                 </div>
                 {remoteStreams.map((remote) => (
                    <div key={remote.id} className="relative w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-xl flex-shrink-0">
                      <video 
                        autoPlay playsInline
                        ref={(vid) => { if (vid) vid.srcObject = remote.stream }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
              </div>
              
              {/* Whiteboard */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 w-full relative z-10"
              >
                <Whiteboard socket={socketRef.current} meetingId={meetingId} />
              </motion.div>
            </div>
          ) : (
            /* Video Grid */
            <div className="w-full h-full flex flex-col md:flex-row gap-6 justify-center items-center">
              {/* Local User */}
              <div className={`relative w-full max-w-4xl aspect-video bg-slate-900 rounded-[2rem] overflow-hidden border transition-all ${isScreenSharing ? 'border-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.3)]' : 'border-white/10 shadow-2xl'}`}>
                <video 
                  ref={userVideoRef} 
                  autoPlay 
                  muted 
                  playsInline
                  className={`w-full h-full object-cover ${isVideoOff && !isScreenSharing ? 'hidden' : ''}`} 
                  style={{ transform: isScreenSharing ? 'none' : 'scaleX(-1)' }}
                />
                {isVideoOff && !isScreenSharing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                      Y
                    </div>
                  </div>
                )}
                <div className="absolute bottom-6 left-6 bg-slate-950/60 backdrop-blur-xl px-4 py-2 rounded-xl text-white text-sm font-medium border border-white/10 flex items-center gap-2 shadow-lg">
                  {isScreenSharing && <MonitorUp className="w-4 h-4 text-blue-400" />}
                  {isScreenSharing ? 'You (Presenting)' : 'You'}
                </div>
              </div>

              {/* Remote Users */}
              {remoteStreams.length > 0 && (
                <div className="flex flex-col gap-4 w-full md:w-80">
                  {remoteStreams.map((remote, idx) => (
                    <div key={remote.id} className="relative w-full aspect-video bg-slate-900 rounded-[1.5rem] overflow-hidden border border-white/10 shadow-xl">
                      <video 
                        autoPlay 
                        playsInline
                        ref={(vid) => { if (vid) vid.srcObject = remote.stream }}
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute bottom-4 left-4 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium border border-white/10">
                        Participant {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Floating Control Dock */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-3 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
          >
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>
            
            <button 
              onClick={toggleVideo}
              disabled={isScreenSharing}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group ${isVideoOff || isScreenSharing ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 opacity-50' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              {isVideoOff || isScreenSharing ? <VideoOff className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <VideoIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>
            
            <button 
              onClick={toggleScreenShare}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group hidden md:block ${isScreenSharing ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              {isScreenSharing ? <MonitorX className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <MonitorUp className="w-6 h-6 group-hover:scale-110 transition-transform" />}
            </button>
            
            <div className="w-px h-10 bg-white/10 mx-2"></div>

            <button 
              onClick={() => setActiveView(activeView === 'video' ? 'whiteboard' : 'video')}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group hidden md:block ${activeView === 'whiteboard' ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              <PenTool className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group ${aiEnabled ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-4 rounded-2xl transition-all flex items-center justify-center group ${isSidebarOpen ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/15 text-white'}`}
            >
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
            
            <div className="w-px h-10 bg-white/10 mx-2"></div>
            
            <button 
              onClick={endCall}
              className="px-6 py-4 bg-red-600 hover:bg-red-500 rounded-2xl transition-all text-white font-medium shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
            >
              Leave
            </button>
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar (Chat & Participants) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 w-80 h-full bg-slate-900/95 backdrop-blur-3xl border-l border-white/10 flex flex-col z-40 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]"
          >
            {/* Sidebar Header */}
            <div className="flex p-3 border-b border-white/10">
              <button 
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'chat' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
              <button 
                onClick={() => setSidebarTab('participants')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 ${sidebarTab === 'participants' ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}
              >
                <Users className="w-4 h-4" />
                People
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {sidebarTab === 'chat' ? (
                <div className="space-y-5">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                      Say hello to the room! 👋
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[11px] text-slate-500 mb-1 font-medium px-1">{msg.sender}</span>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'You' ? 'bg-blue-600 text-white rounded-tr-sm shadow-md shadow-blue-900/20' : 'bg-slate-800 text-white rounded-tl-sm border border-white/5'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white shadow-lg">Y</div>
                    <div>
                      <p className="text-white text-sm font-semibold">You</p>
                      <p className="text-slate-400 text-xs">Host</p>
                    </div>
                  </div>
                  {remoteStreams.map((_, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-white/5">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white">P</div>
                      <div>
                        <p className="text-white text-sm font-semibold">Participant {i + 1}</p>
                        <p className="text-slate-400 text-xs">Guest</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Input */}
            {sidebarTab === 'chat' && (
              <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur-md">
                <form onSubmit={sendMessage} className="relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 rounded-xl transition-all text-white"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
