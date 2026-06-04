import React, { useState } from 'react';

interface Anime {
  idMal: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    extraLarge: string;
    color: string | null;
  };
  status: string;
  format: string;
  startDate: {
    year: number | null;
  };
  meanScore: number;
  mlScore: number;
}

interface RecommendationGridProps {
  recommendations: Anime[];
}

const RecommendationGrid: React.FC<RecommendationGridProps> = ({ recommendations }) => {
  const [imageLoaded, setImageLoaded] = useState<boolean[]>(new Array(recommendations.length).fill(false));
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  if (recommendations.length === 0) {
    return <div className="text-white font-mono text-center mt-10">No recommendations found. Try importing a list with more entries.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
      {recommendations.map((anime, index) => (
        <div
          key={anime.idMal}
          className="group rounded-xl bg-transparent py-2 px-1 hover:scale-[1.05] transition duration-300"
          role="presentation"
          onMouseEnter={() => setHoveringIndex(index)}
          onMouseLeave={() => setHoveringIndex(null)}
        >
          {imageLoaded[index] ? (
            <img
              src={anime.coverImage?.extraLarge || 'https://via.placeholder.com/225x320?text=No+Image'}
              alt={anime.title?.romaji || 'Anime'}
              className="w-full h-48 sm:h-56 object-cover rounded-md mb-2 sm:mb-3 shadow-lg"
            />
          ) : (
            <>
              <div className="w-full h-48 sm:h-56 rounded-md mb-2 sm:mb-3 bg-white/10 animate-pulse"></div>
              <img
                src={anime.coverImage?.extraLarge || 'https://via.placeholder.com/225x320?text=No+Image'}
                alt=""
                className="hidden"
                onLoad={() => handleImageLoad(index)}
              />
            </>
          )}

          <div className="mb-1 sm:mb-2 flex flex-row items-left">
            <div
              className={`w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] my-1 sm:mt-1.5 sm:mb-1 mr-1.5 shrink-0 rounded-full ${
                anime.status === 'RELEASING' ? 'bg-lime-400' : anime.status === 'FINISHED' ? 'bg-blue-400' : 'bg-orange-300'
              }`}
            ></div>
            <div
              className="text-xs sm:text-sm font-semibold transition-colors duration-300 truncate max-w-full"
              style={{
                color: hoveringIndex === index && anime.coverImage?.color ? anime.coverImage.color : 'white'
              }}
              title={anime.title?.english || anime.title?.romaji}
            >
              {anime.title?.english || anime.title?.romaji || 'Unknown Title'}
            </div>
          </div>

          <div className="flex flex-row items-left flex-wrap gap-1.5">
            <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-purple-300 px-1 py-0.5" title="ML Confidence Score">
              ★ {anime.mlScore ? anime.mlScore.toFixed(2) : '?'}
            </div>
            
            {anime.format && (
              <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 transition-colors duration-300">
                {anime.format === "TV_SHORT" ? "TV_S" : anime.format}
              </div>
            )}

            {anime.startDate?.year && (
              <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 transition-colors duration-300">
                {anime.startDate.year}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendationGrid;
