import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import SVG from '../../components/SVG';
import { importAnimeList } from '../../utils/importAnimeList';
import { OAuth } from '../../utils/OAuth';
import { useAuth } from '../../context/AuthContext';
import { FilterSidebar, defaultFilters } from '../../components/FilterSidebar';
import type { FilterState } from '../../components/FilterSidebar';
import Recommendations from '../../components/Recommendations';
import { fetchAniListBatch } from '../../utils/fetchAniListBatch';

const ByList: React.FC = () => {
    const { isCheckingAuth, isLoggedIn, loginType, accessToken, logout } = useAuth();
    const [isLoaded, setIsLoaded] = useState(false);

    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importError, setImportError] = useState('');
    const [importedData, setImportedData] = useState<any>(null);

    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendError, setRecommendError] = useState('');
    const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);
    const [selectedModel, setSelectedModel] = useState<'v2' | 'v3'>('v2');
    const [importProgress, setImportProgress] = useState(0);
    const [importLog, setImportLog] = useState('');

    const themeColor = loginType === 'AniList' ? '#3db4f2' : loginType === 'MyAnimeList' ? '#2e51a2' : '#60a5fa';

    // The enriched metadata from AniList
    const [enrichedRecommendations, setEnrichedRecommendations] = useState<any[] | null>(null);

    // Sidebar state
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    // Compute available filter options dynamically from the enriched data
    const availableOptions = useMemo(() => {
        if (!enrichedRecommendations) return { genres: [], tags: [], formats: [], statuses: [], countries: [], studios: [], maxPop: 2000000 };

        const genres = new Set<string>();
        const tags = new Set<string>();
        const formats = new Set<string>();
        const statuses = new Set<string>();
        const countries = new Set<string>();
        const studios = new Set<string>();
        let maxPop = 1000;

        enrichedRecommendations.forEach(anime => {
            if (anime.genres) anime.genres.forEach((g: string) => genres.add(g));
            if (anime.tags) anime.tags.forEach((t: any) => tags.add(t.name));
            if (anime.format) formats.add(anime.format);
            if (anime.status) statuses.add(anime.status);
            if (anime.countryOfOrigin) countries.add(anime.countryOfOrigin);
            if (anime.studios?.nodes) anime.studios.nodes.forEach((s: any) => studios.add(s.name));
            if (anime.popularity && anime.popularity > maxPop) maxPop = anime.popularity;
        });

        return {
            genres: Array.from(genres).sort(),
            tags: Array.from(tags).sort(),
            formats: Array.from(formats).sort(),
            statuses: Array.from(statuses).sort(),
            countries: Array.from(countries).sort(),
            studios: Array.from(studios).sort(),
            maxPop: Math.ceil(maxPop / 1000) * 1000 // Round up to nearest 1000
        };
    }, [enrichedRecommendations]);

    // Update the default popularity filter max when maxPop changes
    useEffect(() => {
        if (enrichedRecommendations && availableOptions.maxPop > 0) {
            setFilters(prev => ({
                ...prev,
                popularityRange: [prev.popularityRange[0], availableOptions.maxPop]
            }));
        }
    }, [availableOptions.maxPop, enrichedRecommendations]);

    const handleListImport = async () => {
        if (!isLoggedIn) {
            setImportError("You need to be logged in to import your anime list.");
            return;
        }

        setIsImporting(true);
        setImportError("");
        setImportSuccess(false);
        setImportProgress(0);
        setImportLog("Connecting to server...");

        try {
            const data = await importAnimeList(loginType, accessToken);
            setImportLog("List retrieved! Unpacking anime entries...");

            // Visual simulation of parsing
            const allEntries = [
                ...(data.completed || []),
                ...(data.planning || []),
                ...(data.current || []),
                ...(data.dropped || []),
                ...(data.onHold || [])
            ];

            const total = allEntries.length;
            if (total === 0) {
                setImportedData(data);
                setImportSuccess(true);
                setIsImporting(false);
                return;
            }

            let currentIndex = 0;
            const batchSize = Math.max(1, Math.floor(total / 20)); // Aim for ~20 visual updates

            const simulateParsing = setInterval(() => {
                currentIndex += batchSize;

                if (currentIndex >= total) {
                    clearInterval(simulateParsing);
                    setImportProgress(100);
                    setImportLog("Import complete! Your list is ready.");
                    setTimeout(() => {
                        setImportedData(data);
                        setImportSuccess(true);
                        setIsImporting(false);
                    }, 500); // Brief pause to show 100%
                } else {
                    const currentAnime = allEntries[currentIndex];
                    const progress = Math.floor((currentIndex / total) * 100);
                    setImportProgress(progress);
                    setImportLog(`Analyzing: ${currentAnime?.englishTitle || currentAnime?.title || 'Unknown Anime'}...`);
                }
            }, 60); // 60ms delay per batch

        } catch (error) {
            console.error("Error importing anime list:", error);
            setImportError("Failed to import anime list. Please try again.");
            setIsImporting(false);
        }
    };

    const handleRecommend = async (modelVersionToUse = selectedModel) => {
        setIsRecommending(true);
        setRecommendError("");

        setEnrichedRecommendations(null);

        try {
            // 1. Get raw MAL IDs and scores from our local backend (top 500)
            const res = await fetch('/api/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // We always tell the backend to NOT exclude watched, because we want to handle that client-side
                body: JSON.stringify({ importedData, excludeWatched: false, modelVersion: modelVersionToUse })
            });

            if (!res.ok) {
                const errData = await res.json();
                const errorObj = new Error(errData.error || "Failed to get recommendations from backend") as any;
                if (errData.estimatedTime !== undefined) {
                    errorObj.estimatedTime = errData.estimatedTime;
                }
                throw errorObj;
            }

            const rawData = await res.json();


            // 2. Extract IDs and batch fetch from AniList
            const malIds = rawData.map((r: any) => r.id);
            const enriched = await fetchAniListBatch(malIds);

            // 3. Merge the ML scores into the enriched AniList data
            const enrichedWithScores = enriched.map(anime => {
                const rawInfo = rawData.find((r: any) => r.id === anime.idMal);
                return { ...anime, mlScore: rawInfo?.score || 0, reasons: rawInfo?.reasons || [] };
            });

            // 4. Sort by ML score descending just in case AniList scrambled the order
            enrichedWithScores.sort((a, b) => b.mlScore - a.mlScore);

            setEnrichedRecommendations(enrichedWithScores);
        } catch (error: any) {
            console.error(error);
            if (error.estimatedTime !== undefined && error.estimatedTime > 0) {
                setEstimatedWaitTime(Math.ceil(error.estimatedTime));
                setRecommendError(`The AI Model is currently waking up! It should be ready in roughly ${Math.ceil(error.estimatedTime)} seconds.`);
            } else {
                setRecommendError(error.message || "Failed to fetch recommendations. Please try again.");
            }
        } finally {
            setIsRecommending(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        setImportSuccess(false);
        setImportedData(null);
        setEnrichedRecommendations(null);
    };

    const handleModelChange = (newModel: 'v2' | 'v3') => {
        setSelectedModel(newModel);
        handleRecommend(newModel);
    };

    useEffect(() => {
        const imagesToLoad = Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
            }));

        Promise.all(imagesToLoad).then(() => {
            setTimeout(() => {
                setIsLoaded(true);
            }, 100);
        });
    }, []);

    // Countdown timer for recommendation model wakeup
    useEffect(() => {
        if (estimatedWaitTime !== null && estimatedWaitTime > 0) {
            const timer = setInterval(() => {
                setEstimatedWaitTime(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        setRecommendError(''); // Clear error when ready
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [estimatedWaitTime]);

    // If we have recommendations, render the dashboard
    if (enrichedRecommendations) {
        return (
            <div className="flex flex-col h-screen bg-linear-to-br from-[#02020f] to-[#122545] text-white overflow-hidden font-sans">
                <Navbar color="#60a5fa" />
                <div className="flex flex-1 overflow-hidden mt-[72px]">
                    <div className="p-6">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            availableOptions={availableOptions}
                        />
                    </div>

                    <Recommendations
                        recommendations={enrichedRecommendations}
                        filters={filters}
                        importedData={importedData}
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-[#02020f] to-[#122545] text-white font-sans">
            <Navbar color="#60a5fa" />

            <section className="bg-transparent relative text-white overflow-hidden">
                <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1 max-w-[1400px] mx-auto">

                    <div className={`text-left w-full max-w-3xl transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 text-[#9fadbd]">
                            Recommendations
                        </h1>

                        <p className="text-[#8ba0b2] text-base sm:text-lg mb-8 leading-relaxed max-w-2xl">
                            Import your anime lists from AniList or MyAnimeList to receive personalized recommendations based on your unique tastes.
                        </p>

                        {isCheckingAuth ? (
                            <div className="flex items-center gap-3 text-[#60a5fa] font-semibold bg-[#151f2e] w-max px-5 py-3 rounded-md shadow-sm">
                                <SVG name="loader" size="w-5 h-5" className="animate-spin" />
                                <span>Connecting to server... (Might take up to a minute if sleeping)</span>
                            </div>
                        ) : isLoggedIn ? (
                            <>
                                <div className="flex items-center mb-6 text-green-400 font-semibold gap-2 bg-[#151f2e] w-max px-4 py-2 rounded-md shadow-sm">
                                    <SVG name="checkmark" size="w-4 h-4" />
                                    <span>Logged in via</span>
                                    {loginType === "AniList" ? (
                                        <SVG name="anilist" size="w-4 h-4" />
                                    ) : loginType === "MyAnimeList" ? (
                                        <SVG name="mal" size="w-7 h-7" />
                                    ) : null}
                                </div>
                                <div className="flex flex-row gap-3 flex-wrap">
                                    {!importSuccess ? (
                                        <button
                                            onClick={handleListImport}
                                            className="px-5 py-2.5 rounded-md text-white font-semibold flex items-center gap-2 transition-all hover:opacity-90 shadow-sm"
                                            style={{ backgroundColor: themeColor }}
                                            disabled={isImporting}
                                        >
                                            {isImporting ? (
                                                <>
                                                    <SVG name="loader" size="w-4 h-4" className="animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <SVG name="import" size="w-4 h-4" />
                                                    Import Lists
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleRecommend(selectedModel)}
                                                disabled={isRecommending}
                                                className="px-5 py-2.5 rounded-md text-white font-semibold flex items-center gap-2 transition-all hover:opacity-90 shadow-sm"
                                                style={{ backgroundColor: themeColor }}
                                            >
                                                {isRecommending ? (
                                                    <>
                                                        <SVG name="loader" size="w-4 h-4" className="animate-spin" />
                                                        Generating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <SVG name="star" size="w-4 h-4" />
                                                        Recommend
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    <button onClick={handleLogout} className="px-5 py-2.5 bg-[#151f2e] hover:bg-[#1f293d] rounded-md text-[#9fadbd] hover:text-white font-semibold flex items-center gap-2 transition-colors shadow-sm" >
                                        <SVG name="logout" size="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                                {importError && <p className="mt-4 text-red-400 font-medium">{importError}</p>}

                                {/* Simulated Progress UI */}
                                {isImporting && !importSuccess && (
                                    <div className="mt-6 w-full max-w-md">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm font-semibold" style={{ color: themeColor }}>{importLog}</span>
                                            <span className="text-sm font-bold text-[#8ba0b2]">{importProgress}%</span>
                                        </div>
                                        <div className="w-full bg-[#151f2e] rounded-full h-2 overflow-hidden shadow-inner">
                                            <div
                                                className="h-2 rounded-full transition-all duration-100 ease-linear shadow-sm"
                                                style={{ width: `${importProgress}%`, backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}

                                {importSuccess && importedData && (() => {
                                    const all = [
                                        ...(importedData.completed || []),
                                        ...(importedData.current || []),
                                        ...(importedData.dropped || []),
                                        ...(importedData.onHold || []),
                                        ...(importedData.planning || [])
                                    ];
                                    const scored = all.filter((a: any) => a.score > 0);
                                    const avgScore = scored.length > 0 ? (scored.reduce((acc: number, curr: any) => acc + curr.score, 0) / scored.length).toFixed(1) : '0';

                                    return (
                                        <div className="mt-6 p-5 bg-[#151f2e]/80 backdrop-blur-sm rounded-lg text-sm max-h-[300px] overflow-y-auto text-[#8ba0b2] shadow-sm">
                                            <p className="mb-3 font-bold text-base flex items-center gap-2">
                                                Imported lists successfully
                                            </p>

                                            <div className="flex gap-3 mb-3">
                                                <div className="flex-1 bg-[#0d1525]/80 p-3 rounded-md flex items-center justify-between">
                                                    <p className="text-xs uppercase tracking-wider text-[#9fadbd]">Total Anime</p>
                                                    <p className="text-xl font-bold text-white">{importedData.totalEntries || all.length}</p>
                                                </div>
                                                <div className="flex-1 bg-[#0d1525]/80 p-3 rounded-md flex items-center justify-between">
                                                    <p className="text-xs uppercase tracking-wider text-[#9fadbd]">Average Score</p>
                                                    <p className="text-xl font-bold text-white flex items-center gap-1.5">
                                                        <SVG name="star" size="w-4 h-4" style={{ color: themeColor }} />
                                                        {avgScore}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                                <div className="bg-[#0d1525] p-3 rounded-md">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1 text-[#9fadbd]">Completed</p>
                                                    <p className="text-base font-bold text-white">{importedData.completed?.length || 0}</p>
                                                </div>
                                                <div className="bg-[#0d1525] p-3 rounded-md">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1 text-[#9fadbd]">Watching</p>
                                                    <p className="text-base font-bold text-white">{importedData.current?.length || 0}</p>
                                                </div>
                                                <div className="bg-[#0d1525] p-3 rounded-md">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1 text-[#9fadbd]">Planned</p>
                                                    <p className="text-base font-bold text-white">{importedData.planning?.length || 0}</p>
                                                </div>
                                                <div className="bg-[#0d1525] p-3 rounded-md">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1 text-[#9fadbd]">Paused</p>
                                                    <p className="text-base font-bold text-white">{importedData.onHold?.length || 0}</p>
                                                </div>
                                                <div className="bg-[#0d1525] p-3 rounded-md">
                                                    <p className="text-[10px] uppercase tracking-wider mb-1 text-[#9fadbd]">Dropped</p>
                                                    <p className="text-base font-bold text-white">{importedData.dropped?.length || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {recommendError && !estimatedWaitTime && <p className="mt-4 text-red-400 font-medium">{recommendError}</p>}

                                {estimatedWaitTime !== null && (
                                    <div className="mt-6 p-4 border rounded-lg max-w-md" style={{ backgroundColor: `${themeColor}1A`, borderColor: `${themeColor}4D` }}>
                                        <div className="flex items-start gap-3">
                                            <SVG name="loader" size="w-5 h-5" className="animate-spin mt-0.5 shrink-0" style={{ color: themeColor }} />
                                            <div>
                                                <p className="font-bold mb-1" style={{ color: themeColor }}>AI Model is Waking Up!</p>
                                                <p className="text-sm text-[#8ba0b2] mb-3">Our recommendation engine went to sleep. It will be ready to serve you in roughly <span className="text-white font-bold">{estimatedWaitTime}</span> seconds.</p>
                                                <div className="w-full bg-[#151f2e] rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="h-1.5 rounded-full transition-all duration-1000 ease-linear"
                                                        style={{ width: `${Math.max(0, 100 - (estimatedWaitTime * 2))}%`, backgroundColor: themeColor }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center mb-6 text-red-400 font-semibold bg-[#151f2e] w-max px-4 py-2 rounded-md shadow-sm">
                                    <SVG name="cross" size="w-4 h-4" />
                                    <span className="ml-2">You are not logged in</span>
                                </div>
                                <div className="flex flex-row gap-4">
                                    <button onClick={() => OAuth("AniList")} className="px-5 py-2.5 bg-[#3db4f2] hover:bg-[#3db4f2]/90 rounded-md text-white font-semibold flex items-center gap-2 transition-colors shadow-sm">
                                        Login with <SVG name="anilist" size="w-4 h-4" />
                                    </button>
                                    <button onClick={() => OAuth("MyAnimeList")} className="px-5 py-2.5 bg-[#2e51a2] hover:bg-[#2e51a2]/90 rounded-md text-white font-semibold flex items-center gap-2 transition-colors shadow-sm">
                                        Login with <SVG name="mal" size="w-7 h-7" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        <img
                            src="/img2.png"
                            alt="img2"
                            className={`block lg:hidden w-[350px] sm:w-[350px] lg:w-[320px] h-auto drop-shadow-xl rounded-md transition-opacity duration-500 mb-3 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                        <img
                            src="/img3.png"
                            alt="img3"
                            className={`hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-xl rounded-md transition-opacity duration-500 ml-3 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ByList;
