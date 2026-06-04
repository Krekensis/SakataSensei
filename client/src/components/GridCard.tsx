import React, { useState } from 'react';

interface Props {
    anime: any;
}

const GridCard: React.FC<Props> = ({ anime }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    return (
        <a
            href={`https://myanimelist.net/anime/${anime.idMal}`}
            target="_blank"
            rel="noreferrer"
            className="group w-full flex flex-col rounded-xl bg-transparent py-1 sm:py-2 px-1 hover:scale-[1.05] transition duration-300"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {imageLoaded ? (
                <img
                    src={anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium}
                    alt={anime.title?.romaji}
                    className="w-full aspect-[2/3] object-cover rounded-md mb-1.5 sm:mb-3"
                    loading="lazy"
                />
            ) : (
                <>
                    <div className="w-full aspect-[2/3] rounded-md mb-1.5 sm:mb-3 skeleton bg-[#151f2e]"></div>
                    <img
                        src={anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium}
                        alt=""
                        className="hidden"
                        onLoad={() => setImageLoaded(true)}
                    />
                </>
            )}

            <div className="mb-1 sm:mb-2 flex flex-row items-start">
                <div
                    className={`w-[8px] h-[8px] sm:w-[9px] sm:h-[9px] my-1 sm:mt-1.5 sm:mb-1 mr-1.5 shrink-0 rounded-full ${anime.status === 'RELEASING' ? 'bg-lime-400' : anime.status === 'FINISHED' ? 'bg-blue-400' : 'bg-orange-300'
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

            <div className="flex flex-row items-left flex-wrap gap-1.5 sm:gap-1.5">
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
                        <svg className="w-3 sm:w-4 h-3 sm:h-4 relative -translate-y-[1px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 17.3L7.3 20l1.1-5.2L4 11.5l5.3-.5L12 6l2.7 5 5.3.5-4.4 3.3L16.7 20z" />
                        </svg>
                        {anime.averageScore}
                    </div>
                )}
            </div>
        </a>
    );
};

export default GridCard;
