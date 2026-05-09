import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Video, Plus, KeyRound, Calendar, Clock, MoreVertical } from 'lucide-react';
import Navbar from '../components/Navbar';

const mockMeetings = [
  { id: '1', title: 'Weekly Sync', date: 'Today, 10:00 AM', duration: '45 min', participants: 4 },
  { id: '2', title: 'Design Review', date: 'Yesterday, 2:00 PM', duration: '1h 15m', participants: 3 },
  { id: '3', title: 'Client Pitch', date: 'Mon, 11:30 AM', duration: '30 min', participants: 2 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  const handleCreateMeeting = () => {
    // Generate a random meeting ID
    const meetingId = Math.random().toString(36).substring(2, 10);
    navigate(`/meeting/${meetingId}`);
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/meeting/${joinCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-8">Welcome back, Aditya! 👋</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Create Meeting Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none" />
              
              <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">New Meeting</h2>
              <p className="text-slate-400 mb-6">Start an instant meeting and invite others to join.</p>
              
              <button 
                onClick={handleCreateMeeting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
              >
                <Plus className="w-5 h-5" />
                Create Instant Meeting
              </button>
            </div>

            {/* Join Meeting Card */}
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <KeyRound className="w-6 h-6 text-blue-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Join Meeting</h2>
              <p className="text-slate-400 mb-6">Enter a meeting code or link to join an existing room.</p>
              
              <form onSubmit={handleJoinMeeting} className="flex gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter meeting code..."
                  className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all border border-white/5"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Past Meetings List */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Meetings</h2>
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">View All</button>
            </div>
            
            <div className="space-y-4">
              {mockMeetings.map((meeting) => (
                <div key={meeting.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-800/60 transition-colors group">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{meeting.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {meeting.date}</span>
                        <span>•</span>
                        <span>{meeting.duration}</span>
                        <span>•</span>
                        <span>{meeting.participants} participants</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white transition-colors border border-white/5">
                      View Details
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
