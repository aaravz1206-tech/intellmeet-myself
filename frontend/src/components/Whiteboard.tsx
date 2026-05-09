import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

interface WhiteboardProps {
  socket: Socket | null;
  meetingId: string | undefined;
}

interface DrawData {
  meetingId: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
  isEraser: boolean;
}

export default function Whiteboard({ socket, meetingId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [color, setColor] = useState('#3b82f6'); // blue-500
  const [strokeWidth] = useState(3);
  const lastPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Resize
  useEffect(() => {
    const resizeCanvas = () => {
      if (canvasRef.current && containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Set actual canvas size
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        // Optionally, could redraw an image data cache here to preserve drawing on resize
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleDraw = (data: DrawData) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.width, data.isEraser, false);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on('draw', handleDraw);
    socket.on('clear-board', handleClear);

    return () => {
      socket.off('draw', handleDraw);
      socket.off('clear-board', handleClear);
    };
  }, [socket]);

  const drawLine = (x0: number, y0: number, x1: number, y1: number, c: string, w: number, isEraser: boolean, emit: boolean) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = isEraser ? '#ffffff' : c; // Eraser draws white (or clear, but since bg is white, white works well)
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (!emit || !socket || !meetingId) return;
    
    // Convert to relative coordinates so drawing is consistent across different screen sizes
    const w_width = canvas.width;
    const h_height = canvas.height;

    socket.emit('draw', {
      meetingId,
      x0: x0 / w_width,
      y0: y0 / h_height,
      x1: x1 / w_width,
      y1: y1 / h_height,
      color: c,
      width: w,
      isEraser,
    });
  };

  // The receiver needs to scale relative coordinates back to their canvas size
  useEffect(() => {
    if (!socket) return;
    const handleDrawRelative = (data: any) => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const w = canvas.width;
       const h = canvas.height;
       drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width, data.isEraser, false);
    };
    
    socket.on('draw', handleDrawRelative);
    return () => { socket.off('draw', handleDrawRelative); }
  }, [socket]);


  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    lastPos.current = getPointerPos(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const currentPos = getPointerPos(e);
    
    // For eraser, making it slightly thicker
    const w = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
    
    drawLine(lastPos.current.x, lastPos.current.y, currentPos.x, currentPos.y, color, w, tool === 'eraser', true);
    lastPos.current = currentPos;
  };

  const onPointerUp = () => {
    setIsDrawing(false);
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      socket?.emit('clear-board', meetingId);
    }
  };

  const colors = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
      
      {/* Whiteboard Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full h-full relative cursor-crosshair bg-slate-900"
        style={{ touchAction: 'none' }} // Prevent scrolling on mobile while drawing
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerOut={onPointerUp}
          className="absolute inset-0 bg-transparent"
        />
      </div>

      {/* Toolbar inside the whiteboard */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl z-10">
        
        {/* Tools */}
        <div className="flex bg-slate-950/50 rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setTool('pencil')}
            className={`p-2 rounded-lg transition-colors ${tool === 'pencil' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Pencil"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            title="Eraser"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        {/* Colors */}
        <div className="flex gap-1 px-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pencil'); }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c && tool === 'pencil' ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-white/10"></div>

        {/* Clear Button */}
        <button
          onClick={clearBoard}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Clear Board"
        >
          <Trash2 className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
}
