import React, { useState } from 'react';
import StatusOverlay from './StatusOverlay';
import SVG from './SVG';

interface Props {
    anime: any;
    importedData: any;
}

const GridCard: React.FC<Props> = ({ anime, importedData }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    const coverUrl = anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium;

    return (
        <a
            href={`https://myanimelist.net/anime/${anime.idMal}`}
            target="_blank"
            rel="noreferrer"
            className="group w-full flex flex-col rounded-xl bg-transparent py-1 sm:py-2 px-1 hover:scale-[1.05] transition duration-300"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="relative w-full aspect-[2/3] mb-1.5 sm:mb-3 group/cover">
                {imageLoaded ? (
                    <img
                        src={coverUrl}
                        alt={anime.title?.romaji}
                        className="w-full h-full object-cover rounded-md"
                        loading="lazy"
                    />
                ) : (
                    <>
                        <div className="w-full h-full rounded-md skeleton bg-[#151f2e]"></div>
                        <img
                            src={coverUrl}
                            alt=""
                            className="hidden"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </>
                )}
                <StatusOverlay anime={anime} importedData={importedData} />
            </div>

            <div className="mb-1 sm:mb-2 flex flex-row items-start">
                <div
                    className={`w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] my-1 sm:mt-1.5 sm:mb-1 mr-1.5 shrink-0 rounded-full ${anime.status === 'RELEASING' ? 'bg-lime-400' :
                        anime.status === 'FINISHED' ? 'bg-blue-400' :
                            anime.status === 'CANCELLED' ? 'bg-red-400' :
                                'bg-orange-300'
                        }`}
                ></div>
                <div
                    className="text-xs sm:text-sm font-semibold transition-colors duration-300 line-clamp-2 max-w-full min-h-[32px] sm:min-h-[40px]"
                    style={{
                        color: isHovering ? (anime.coverImage?.color || '#60a5fa') : '#9fadbd'
                    }}
                    title={anime.title?.english || anime.title?.romaji}
                >
                    {anime.title?.english || anime.title?.romaji}
                </div>
            </div>

            <div className="flex flex-row items-start flex-wrap gap-1.5 sm:gap-1.5">
                <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-[#151f2e] text-[#8ba0b2] group-hover:text-white px-1.5 py-0.5 transition-colors duration-300">
                    {anime.format === "TV_SHORT" ? "TV_S" : (anime.format || 'TV')}
                </div>

                {anime.startDate?.year && (
                    <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-[#151f2e] text-[#8ba0b2] group-hover:text-white px-1.5 py-0.5 transition-colors duration-300">
                        {anime.startDate.year}
                    </div>
                )}

                {anime.episodes && (
                    <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-[#151f2e] text-[#8ba0b2] group-hover:text-white px-1.5 py-0.5 transition-colors duration-300">
                        {anime.episodes} {anime.episodes === 1 ? 'ep' : 'eps'}
                    </div>
                )}

                {anime.averageScore && (
                    <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-[#151f2e] text-[#8ba0b2] group-hover:text-white px-1.5 py-0.5 inline-flex items-center gap-1 transition-colors duration-300">
                        <SVG name="star" size="" className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                        {anime.averageScore}%
                    </div>
                )}

                {anime.popularity && (
                    <div className="text-[10px] sm:text-sm font-bold font-mono rounded-sm bg-[#151f2e] text-[#8ba0b2] group-hover:text-white px-1.5 py-0.5 inline-flex items-center gap-1 transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" viewBox="0 0 640 512" fill="currentColor">
                            <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
                        </svg>
                        {anime.popularity >= 1000 ? (anime.popularity / 1000).toFixed(1) + 'k' : anime.popularity}
                    </div>
                )}
            </div>
        </a>
    );
};

export default GridCard;
