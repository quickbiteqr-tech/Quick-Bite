'use client';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function VideoTile() {
  // Motion values to track mouse position relative to the center (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Springs for buttery smooth physics
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Map mouse movement to 3D rotation (-4 to 4 degrees)
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  // Moving up (negative Y) tilts the tablet up (positive rotateX)
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);

  // Map mouse movement to the position of the glass glare
  const glareX = useTransform(smoothX, [-0.5, 0.5], ['-50%', '50%']);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ['-20%', '20%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates to a range of -0.5 to 0.5
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      className="relative flex items-center justify-center lg:col-span-1 lg:row-span-2 min-h-[300px] lg:min-h-0 w-full h-full"
      style={{ perspective: 2000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{ 
          rotateX, 
          rotateY,
          transformStyle: "preserve-3d"
        }}
        className="relative w-full h-full overflow-hidden bg-black border-[8px] md:border-[12px] border-[#0a0a0a] rounded-[2rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_30px_60px_rgba(0,0,0,0.6)] group"
      >
        {/* Hardware Frame Sensors / Camera Notch */}
        <div className="absolute top-2 md:top-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 z-30 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_#6DBE45] animate-[pulse_3s_ease-in-out_infinite]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-white/5 ring-1 ring-inset ring-white/10 shadow-inner"></div>
        </div>
        
        {/* Inner Screen Area */}
        <div className="relative w-full h-full bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
          >
            <source src="/images/QrCode (2).mp4" type="video/mp4" />
          </video>
          
          {/* Inner bezel shadow simulating depth between glass and screen */}
          <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] pointer-events-none z-10"></div>
          
          {/* Hardware Accelerated Interactive Glass Glare */}
          <motion.div 
            style={{ 
              x: glareX, 
              y: glareY,
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.03) 50%, transparent 55%)'
            }}
            className="absolute -inset-[150%] w-[300%] h-[300%] z-20 pointer-events-none mix-blend-screen"
          />
        </div>
      </motion.div>
    </div>
  );
}