import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import SVG from '../../components/SVG';
import { importAnimeList } from '../../utils/importAnimeList';
import { OAuth } from '../../utils/OAuth';

const ByList: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginType, setLoginType] = useState('none');
    const [accessToken, setAccessToken] = useState('');

    const [isImporting, setIsImporting] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importError, setImportError] = useState('');
    const [importedData, setImportedData] = useState<any>(null);

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

    const logout = async () => {
        await fetch('/auth/logout', { method: 'POST' });
        setIsLoggedIn(false);
        setLoginType('none');
        setImportSuccess(false);
        setImportedData(null);
    };

    const syntaxHighlightJson = (json: string): string => {
        if (!json) return "";
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match: string): string => {
                let cls = "text-white"; // default
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "text-yellow-400"; // key
                    } else {
                        cls = "text-green-400"; // string
                    }
                } else if (/true|false/.test(match)) {
                    cls = "text-blue-400"; // booleans
                } else if (/null/.test(match)) {
                    cls = "text-gray-400"; // null
                } else {
                    cls = "text-purple-400"; // numbers
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await fetch('/auth/status', { credentials: 'include' });
            const { isLoggedIn: logged, accessToken: token, loginType: type } = await status.json();

            setIsLoggedIn(logged);
            setLoginType(type);
            setAccessToken(token || "");

            // Preload images trick from original code
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#090311] to-[#141634] text-white bg-fixed">
            <Navbar color="#a78bfa" />

            <section className="bg-transparent relative text-white overflow-hidden">
                <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">
                    
                    <div className={`text-left w-full max-w-3xl transition-opacity duration-500 ${isLoaded ? 'animate-fade-in-top opacity-100' : 'opacity-0'}`}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                            <span className="text-purple-300 text-3xl sm:text-4xl font-black font-newtegomin">
                                Recommendation using your lists
                            </span>
                        </h1>

                        <p className="text-white/70 text-lg sm:text-lg mb-6 font-mono leading-relaxed">
                            Import your anime lists from AniList or MyAnimeList to receive personalized recommendations based on the genres you watch most, how you've rated them, and more. 
                        </p>

                        {/* Login status */}
                        {isLoggedIn ? (
                            <>
                                <div className="flex items-center mb-4 text-green-400 font-mono gap-2">
                                    <SVG name="checkmark" size="w-5 h-5" />
                                    <span>You are already logged in via</span>
                                    {loginType === "AniList" ? (
                                        <SVG name="anilist" size="w-4.5 h-4.5" />
                                    ) : loginType === "MyAnimeList" ? (
                                        <SVG name="mal" size="w-8 h-8" />
                                    ) : null}
                                </div>
                                <div className="flex flex-row gap-3">
                                    {!importSuccess ? (
                                        <button 
                                            onClick={handleListImport} 
                                            className="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2"
                                            disabled={isImporting}
                                        >
                                            {isImporting ? (
                                                <>
                                                    <SVG name="loader" size="w-5 h-5" className="animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <SVG name="import" size="w-5 h-5" />
                                                    Import Lists
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button className="px-4 py-[8.5px] bg-green-400/30 hover:bg-green-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                                            <SVG name="star" size="w-5 h-5" />
                                            Recommend
                                        </button>
                                    )}
                                    <button onClick={logout} className="px-4 py-[8.5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2" >
                                        <SVG name="logout" size="w-5 h-5" />
                                        Logout
                                    </button>
                                </div>
                                {importError && <p className="mt-3 text-red-400 font-mono">{importError}</p>}
                                {importSuccess && importedData && (
                                    <div className="mt-3 p-3 bg-white/10 rounded-lg font-mono text-sm max-h-[150px] overflow-y-auto text-white overflow-x-auto">
                                        <p className="mb-2 text-green-400">Imported Lists:</p>
                                        <p className="mb-2 text-green-400"> - Anime completed: {importedData.completed.length}</p>
                                        <p className="mb-2 text-green-400"> - Anime watching: {importedData.current.length}</p>
                                        <p className="mb-2 text-green-400"> - Anime planned: {importedData.planning.length}</p>
                                        <pre className="whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: syntaxHighlightJson(JSON.stringify(importedData, null, 2)) }}></pre>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex items-center mb-4 text-red-400 font-mono">
                                    <SVG name="cross" size="w-5 h-5" />
                                    <span className="ml-2">You are not logged in</span>
                                </div>
                                <div className="flex flex-row gap-3">
                                    <button onClick={() => OAuth("AniList")} className="px-4 py-[5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                                        Connect with <SVG name="anilist" size="w-4.5 h-4.5" />
                                    </button>
                                    <button onClick={() => OAuth("MyAnimeList")} className="px-4 py-[5px] bg-purple-400/30 hover:bg-purple-400/40 rounded-lg text-white font-mono flex items-center gap-2">
                                        Connect with <SVG name="mal" size="w-8 h-8" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {!importSuccess && !importedData && (
                        <div className="flex-shrink-0">
                            {/* Mobile image */}
                            <img
                                src="/img2.png"
                                alt="img2"
                                className={`block lg:hidden w-[350px] sm:w-[350px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg transition-opacity duration-500 mb-3 ${isLoaded ? 'animate-fade-in-top opacity-100' : 'opacity-0'}`}
                            />
                            {/* Desktop image */}
                            <img
                                src="/img3.png"
                                alt="img3"
                                className={`hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg transition-opacity duration-500 ml-3 ${isLoaded ? 'animate-fade-in-bottom opacity-100' : 'opacity-0'}`}
                            />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ByList;
