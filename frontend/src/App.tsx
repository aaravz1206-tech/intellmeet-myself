import { useState } from 'react';

export default function Lobby() {
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight text-white">
            Premium video meetings.
          </h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-4">
           <button className="w-full bg-blue-600 py-4 rounded-xl font-bold">New Meeting</button>
           <input 
             className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700" 
             placeholder="Enter code"
             value={roomCode}
             onChange={(e) => setRoomCode(e.target.value)}
           />
        </div>
      </div>
    </div>
  );
}