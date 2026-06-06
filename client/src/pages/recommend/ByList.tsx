import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import SVG from '../../components/SVG';
import { importAnimeList } from '../../utils/importAnimeList';
import { OAuth } from '../../utils/OAuth';
import { FilterSidebar, defaultFilters } from '../../components/FilterSidebar';
import type { FilterState } from '../../components/FilterSidebar';
import Recommendations from '../../components/Recommendations';
import { fetchAniListBatch } from '../../utils/fetchAniListBatch';

const ByList: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginType, setLoginType] = useState('none');
    const [accessToken, setAccessToken] = useState('');

    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importError, setImportError] = useState('');
    const [importedData, setImportedData] = useState<any>(null);

    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendError, setRecommendError] = useState('');
    const [selectedModel, setSelectedModel] = useState<'v2' | 'v3'>('v2');

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

        try {
            const data = await importAnimeList(loginType, accessToken);
            setImportedData(data);
            setImportSuccess(true);
        } catch (error) {
            console.error("Error importing anime list:", error);
            setImportError("Failed to import anime list. Please try again.");
        } finally {
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
                throw new Error("Failed to get recommendations from backend");
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
        } catch (error) {
            console.error(error);
            setRecommendError("Failed to fetch recommendations. Please try again.");
        } finally {
            setIsRecommending(false);
        }
    };

    const logout = async () => {
        await fetch('/auth/logout', { method: 'POST' });
        setIsLoggedIn(false);
        setLoginType('none');
        setImportSuccess(false);
        setImportedData(null);

        setEnrichedRecommendations(null);
    };

    const handleModelChange = (newModel: 'v2' | 'v3') => {
        setSelectedModel(newModel);
        handleRecommend(newModel);
    };

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await fetch('/auth/status', { credentials: 'include' });
            const { isLoggedIn: logged, accessToken: token, loginType: type } = await status.json();

            setIsLoggedIn(logged);
            setLoginType(type);
            setAccessToken(token || "");

            const imagesToLoad = Array.from(document.images)
                .filter(img => !img.complete)
                .map(img => new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                }));
            await Promise.all(imagesToLoad);

            setTimeout(() => {
                setIsLoaded(true);
            }, 100);
        };

        fetchStatus();
    }, []);

    // If we have recommendations, render the dashboard
    if (enrichedRecommendations) {
        return (
            <div className="flex flex-col h-screen bg-linear-to-br from-[#02020f] to-[#122545] text-white overflow-hidden font-sans">
                <Navbar color="#3db4f2" />
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
            <Navbar color="#3db4f2" />

            <section className="bg-transparent relative text-white overflow-hidden">
                <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1 max-w-[1400px] mx-auto">

                    <div className={`text-left w-full max-w-3xl transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 text-[#9fadbd]">
                            Recommendations
                        </h1>

                        <p className="text-[#8ba0b2] text-base sm:text-lg mb-8 leading-relaxed max-w-2xl">
                            Import your anime lists from AniList or MyAnimeList to receive personalized recommendations based on your unique tastes.
                        </p>

                        {isLoggedIn ? (
                            <>
                                <div className="flex items-center mb-6 text-green-400 font-semibold gap-2 bg-[#151f2e] w-max px-4 py-2 rounded-md shadow-sm">
                                    <SVG name="checkmark" size="w-4 h-4" />
                                    <span>Logged in via</span>
                                    {loginType === "AniList" ? (
                                        <SVG name="anilist" size="w-4 h-4" />
                                    ) : loginType === "MyAnimeList" ? (
                                        <SVG name="mal" size="w-6 h-6" />
                                    ) : null}
                                </div>
                                <div className="flex flex-row gap-3 flex-wrap">
                                    {!importSuccess ? (
                                        <button
                                            onClick={handleListImport}
                                            className="px-5 py-2.5 bg-[#3db4f2] hover:bg-[#3db4f2]/90 rounded-md text-white font-semibold flex items-center gap-2 transition-colors shadow-sm"
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
                                                className="px-5 py-2.5 bg-[#3db4f2] hover:bg-[#3db4f2]/90 rounded-md text-white font-semibold flex items-center gap-2 transition-colors shadow-sm"
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
                                    <button onClick={logout} className="px-5 py-2.5 bg-[#151f2e] hover:bg-[#1f293d] rounded-md text-[#9fadbd] hover:text-white font-semibold flex items-center gap-2 transition-colors shadow-sm" >
                                        <SVG name="logout" size="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                                {importError && <p className="mt-4 text-red-400 font-medium">{importError}</p>}
                                {importSuccess && importedData && (
                                    <div className="mt-6 p-5 bg-[#151f2e] rounded-md text-sm max-h-[200px] overflow-y-auto text-[#8ba0b2] overflow-x-auto shadow-sm">
                                        <p className="mb-2 text-[#9fadbd] font-bold">Imported Lists Successfully:</p>
                                        <p className="mb-1"> • Completed: {importedData.completed?.length || 0}</p>
                                        <p className="mb-1"> • Watching: {importedData.current?.length || 0}</p>
                                        <p className="mb-1"> • Planned: {importedData.planning?.length || 0}</p>
                                    </div>
                                )}
                                {recommendError && <p className="mt-4 text-red-400 font-medium">{recommendError}</p>}
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
                                        Login with <SVG name="mal" size="w-6 h-6" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {!importSuccess && !importedData && !enrichedRecommendations && (
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
                    )}
                </div>
            </section>
        </div>
    );
};

export default ByList;
