import React from 'react';

interface Props {
    anime: any;
}

const ListCard: React.FC<Props> = ({ anime }) => {
    return (
        <a
            href={`https://myanimelist.net/anime/${anime.idMal}`}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col sm:flex-row relative rounded-md overflow-hidden bg-[#0d1525] shadow-md cursor-pointer h-56 transition-colors p-3"
        >
            {/* Banner Background */}
            {anime.bannerImage && (
                <>
                    <div
                        className="absolute inset-0 z-0 opacity-20 grayscale bg-cover bg-center transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-50"
                        style={{ backgroundImage: `url(${anime.bannerImage})` }}
                    />
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0d1525] via-[#0d1525]/80 to-transparent transition-colors duration-500" />
                </>
            )}

            <div className="w-[120px] sm:w-[135px] flex-shrink-0 relative h-full rounded shadow-sm overflow-hidden z-10">
                <img src={anime.coverImage?.large} alt={anime.title?.romaji} className="object-cover w-full h-full" loading="lazy" />
            </div>

            <div className="pl-5 py-2 pr-2 flex flex-col flex-1 relative z-10 overflow-hidden">
                <div className="flex justify-between items-start gap-4 shrink-0">
                    <div className="flex-1 min-w-0 flex flex-col">
                        {anime.title?.native && (
                            <span className="text-[11px] text-[#8ba0b2] font-newtegomin mb-0.5 truncate opacity-70 group-hover:opacity-100 transition-opacity">
                                {anime.title.native}
                            </span>
                        )}
                        <h3
                            className="font-bold text-lg truncate font-sans"
                            title={anime.title?.english || anime.title?.romaji}
                            style={{
                                color: anime.coverImage?.color || '#60a5fa'
                            }}
                        >
                            {anime.title?.english || anime.title?.romaji}
                        </h3>
                        <div className="text-xs font-semibold text-[#8ba0b2] mt-1 flex items-center gap-2 flex-wrap">
                            {anime.studios?.nodes?.[0]?.name && (
                                <span className="font-bold">{anime.studios.nodes[0].name}</span>
                            )}
                            <span className="px-1.5 py-0.5">{anime.format || 'TV'}</span>
                            <span className="px-1.5 py-0.5">{anime.status ? anime.status.replace('_', ' ') : 'FINISHED'}</span>
                            {anime.startDate?.year && <span className="px-1.5 py-0.5">{anime.startDate?.year}</span>}
                            {anime.episodes && <span className="px-1.5 py-0.5">{anime.episodes} {anime.episodes === 1 ? 'ep' : 'eps'}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-start justify-center gap-2 flex-shrink-0 bg-[#0b1622]/60 backdrop-blur-sm px-3 py-2 rounded min-w-[90px]">
                        {anime.averageScore && (
                            <div className="text-[#9fadbd] text-sm font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0 -ml-[1px]" viewBox="0 0 24 24" fill="currentColor" style={{ color: anime.coverImage?.color || '#60a5fa' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span className="leading-none pt-[1px]">{anime.averageScore}%</span>
                            </div>
                        )}
                        {anime.popularity && (
                            <div className="text-[#9fadbd] text-sm font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 640 512" fill="currentColor" style={{ color: anime.coverImage?.color || '#60a5fa' }}>
                                    <path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" />
                                </svg>
                                <span className="leading-none pt-[1px]">{anime.popularity >= 1000 ? (anime.popularity / 1000).toFixed(1) + 'k' : anime.popularity}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="mt-3 mb-2 text-[13px] text-[#8ba0b2] leading-relaxed overflow-y-auto custom-scrollbar-hidden flex-1 max-w-[95%] sm:max-w-[85%] lg:max-w-[75%]"
                    dangerouslySetInnerHTML={{ __html: anime.description || 'No synopsis available.' }}
                />

                <div className="mt-auto pt-2 flex flex-wrap gap-2 shrink-0">
                    {anime.genres?.slice(0, 3).map((g: string) => (
                        <span key={g}
                            className="text-[11px] font-bold backdrop-blur-sm px-2 py-1 rounded-sm"
                            style={{
                                backgroundColor: anime.coverImage?.color ? `${anime.coverImage.color}26` : '#60a5fa26',
                                color: anime.coverImage?.color || '#60a5fa'
                            }}
                        >
                            {g}
                        </span>
                    ))}
                    {anime.tags?.slice(0, 3).map((t: any) => (
                        <span key={t.name}
                            className="text-[11px] font-bold backdrop-blur-sm px-2 py-1 rounded-sm"
                            style={{
                                backgroundColor: anime.coverImage?.color ? `${anime.coverImage.color}26` : '#60a5fa26',
                                color: anime.coverImage?.color || '#60a5fa'
                            }}
                        >
                            {t.name}
                        </span>
                    ))}
                </div>
            </div>
        </a>
    );
};

export default ListCard;
