import HeroBackground from './HeroBackground';
import TextTile from './TextTile';
import VideoTile from './VideoTile';
import StatsTile from './StatsTile';
import CtaTile from './CtaTile';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden w-full h-auto min-h-screen lg:min-h-0 lg:h-screen lg:max-h-[900px] flex items-center justify-center pt-32 pb-12 sm:pt-40 sm:pb-20 lg:pt-[6rem] lg:pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background layer completely isolated */}
      <HeroBackground />
      
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[1.3fr_1fr] gap-4 sm:gap-6">
        
        {/* Tile 1: Top Left (2 columns wide) */}
        <TextTile />
        
        {/* Tile 2: Right side (2 rows tall) */}
        <VideoTile />
        
        {/* Tile 3: Bottom Left (1 square) */}
        <StatsTile />
        
        {/* Tile 4: Bottom Middle (1 square) */}
        <CtaTile />

      </div>
    </section>
  );
}