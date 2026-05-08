import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Link as LinkIcon } from 'lucide-react';

export default function Lobby() {
  const [roomCode, setRoomCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode) navigate(`/meeting/${roomCode}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding */}
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Premium video meetings. <br />
            Now free for <span className="text-blue-500">everyone.</span>
          </h1>
          <p className="text-slate-400 text-lg">
            We re-engineered the service we built for secure business meetings, 
            IntellMeet, to make it free and available for all.
          </p>
        </div>

        {/* Right Side: Actions */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-8">
          <button className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02]">
            <Plus className="w-6 h-6" />
            Start a New Meeting
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-sm uppercase">or</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <div className="relative flex-grow">
              <LinkIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Enter a code or link"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3.5 pl-11 pr-4 focus:ring-1 focus:ring-blue-500 outline-none"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
            </div>
            <button disabled={!roomCode} className="px-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl font-semibold transition-all">
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}