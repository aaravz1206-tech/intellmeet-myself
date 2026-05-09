import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Video, Shield, Zap, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  {
    icon: <Video className="w-6 h-6 text-blue-400" />,
    title: "HD Video Calls",
    description: "Crystal clear video and audio quality for all your meetings."
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "Instant Rooms",
    description: "Start a meeting instantly with just one click. No downloads required."
  },
  {
    icon: <Shield className="w-6 h-6 text-green-400" />,
    title: "Secure & Private",
    description: "End-to-end encryption ensures your conversations stay private."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    title: "AI Summaries",
    description: "Automatically generate smart summaries and action items."
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center pt-24 px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>IntellMeet AI is now in beta</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            Connect with your team <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              anywhere, anytime.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Experience next-generation video conferencing with AI-powered insights, secure connections, and beautiful design.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-lg transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)]">
              Start a Meeting
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold text-lg transition-all">
              Join with Code
            </Link>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto mt-24 mb-12"
        >
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors">
              <div className="p-3 bg-slate-900 rounded-lg inline-block mb-4 border border-white/10">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
