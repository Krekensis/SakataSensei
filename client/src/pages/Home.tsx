import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TrendingAnime from '../components/TrendingAnime';
import '../index.css'; // Global CSS

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const goTo = (path: string) => {
        navigate(path);
    };

    return (
        <>
            <Navbar />
            <section className="min-h-screen bg-linear-to-br from-[#02020f] to-[#122545] relative text-white overflow-hidden">
                <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-30 pb-5 gap-1">
                    <div className={`text-left w-full max-w-3xl transition-opacity duration-500 ${isLoaded ? 'animate-fade-in-top opacity-100' : 'opacity-0'}`}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
                            <span className="text-blue-400 text-5xl sm:text-6xl font-black font-newtegomin">Sakata Sensei,</span><br />
                            <span className="text-white font-newtegomin">オススメはなんですか ??</span>
                        </h1>

                        <p className="text-white/70 text-lg sm:text-lg mb-6 font-mono leading-relaxed">
                            Sometimes you just don't know what to watch. Get personalized anime recommendations
                            from Sakata Sensei based on your watched list, find shows similar to your
                            favorites, or explore using AI-powered chat queries.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <button onClick={() => goTo("/recommend/by-list")} className="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono px-3 py-1.5 rounded-xl shadow-lg transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3 6h2v2H3V6zm4 0h14v2H7V6zM3 11h2v2H3v-2zm4 0h14v2H7v-2zM3 16h2v2H3v-2zm4 0h14v2H7v-2z" />
                                </svg>
                                Your lists
                            </button>

                            <button onClick={() => goTo("/recommend/by-anime")} className="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono px-3 py-1.5 rounded-xl shadow-lg transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 64 64">
                                    <circle cx="24" cy="32" r="18" fill="#60a5fa" fillOpacity="0.5" />
                                    <circle cx="40" cy="32" r="18" fill="#60a5fa" fillOpacity="0.5" />
                                </svg>
                                Similar anime
                            </button>

                            <button onClick={() => goTo("/recommend/by-chat")} className="flex items-center gap-2 bg-blue-900/60 hover:bg-blue-800/60 font-mono pr-3 pl-2.5 py-1.5 rounded-xl shadow-lg transition">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 64 64">
                                    <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" fontSize="40" fill="#60a5fa" fontWeight="bold" fontFamily="sans-serif"> AI </text>
                                </svg>
                                Query based
                            </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {/* Mobile image */}
                        <img
                            src="/img2.png"
                            alt="img2"
                            className={`block lg:hidden w-[350px] sm:w-[350px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg transition-opacity duration-500 mb-3 ${isLoaded ? 'animate-fade-in-top opacity-100' : 'opacity-0'}`}
                        />

                        {/* Desktop image */}
                        <img
                            src="/img1.png"
                            alt="img1"
                            className={`hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg transition-opacity duration-500 ml-3 ${isLoaded ? 'animate-fade-in-bottom opacity-100' : 'opacity-0'}`}
                        />
                    </div>
                </div>

                {/* Trending Anime */}
                <div className={`transition-all duration-500 mt-5 mb-10 px-6 sm:px-10 lg:px-27 ${isLoaded ? "animate-fade-in-bottom opacity-100" : "opacity-0"}`}>
                    <TrendingAnime />
                </div>
            </section>
        </>
    );
};

export default Home;
