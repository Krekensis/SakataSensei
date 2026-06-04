import React, { useEffect, useState } from 'react';
import './TrendingAnime.css';

const TrendingAnime: React.FC = () => {
  const [trending, setTrending] = useState<any[]>([]);
  const [imageLoaded, setImageLoaded] = useState<boolean[]>([]);
  const [hoveringIndex, setHoveringIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/trending');
        const data = await res.json();
        setTrending(data);
        setImageLoaded(new Array(data.length).fill(false));
      } catch (err) {
        console.error("Failed to fetch trending:", err);
      }
    };
    fetchTrending();
  }, []);

  const handleImageLoad = (index: number) => {
    setImageLoaded(prev => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-semibold mb-3">Trending Anime</h3>
      <div className="overflow-x-auto overflow-y-hidden custom-scrollbar py-2">
        <div className="flex gap-2 sm:gap-5 pb-2">
          {trending.length > 0 ? (
            trending.map((anime, index) => (
              <div
                key={anime.id}
                className="group min-w-[130px] sm:min-w-[160px] rounded-xl bg-transparent py-1 sm:py-2 px-1 hover:scale-[1.05] transition duration-300"
                role="presentation"
                onMouseEnter={() => setHoveringIndex(index)}
                onMouseLeave={() => setHoveringIndex(null)}
              >
                {imageLoaded[index] ? (
                  <img
                    src={anime.coverImage.extraLarge}
                    alt={anime.title.romaji}
                    className="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3"
                  />
                ) : (
                  <>
                    <div className="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3 skeleton"></div>
                    <img
                      src={anime.coverImage.extraLarge}
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
                      color: hoveringIndex === index ? (anime.coverImage.color || '#60a5fa') : 'white'
                    }}
                  >
                    {anime.title.english || anime.title.romaji}
                  </div>
                </div>

                <div className="flex flex-row items-left flex-wrap gap-1.5 sm:gap-1.5">
                  <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 transition-colors duration-300">
                    {anime.format === "TV_SHORT" ? "TV_S" : anime.format}
                  </div>

                  <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 transition-colors duration-300">
                    {anime.startDate.year}
                  </div>

                  <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-white/5 text-gray-400 group-hover:text-gray-300 px-1 py-0.5 inline-flex items-center gap-1 transition-colors duration-300">
                    <svg className="w-3 sm:w-4 h-3 sm:h-4 relative -translate-y-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 17.3L7.3 20l1.1-5.2L4 11.5l5.3-.5L12 6l2.7 5 5.3.5-4.4 3.3L16.7 20z" />
                    </svg>
                    {anime.meanScore}
                  </div>
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="min-w-[130px] sm:min-w-[160px] rounded-xl px-1">
                <div className="w-full h-40 sm:h-52 rounded-md mb-1.5 sm:mb-3 skeleton"></div>
                <div className="h-[12px] sm:h-[18px] w-3/4 rounded-sm mb-1.5 sm:mb-3 skeleton"></div>
                <div className="h-[12px] sm:h-[18px] w-2/4 rounded-sm skeleton"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TrendingAnime;
