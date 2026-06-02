import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SVG from '../components/SVG';

const ErrorPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoaded, setIsLoaded] = useState(false);

    const errorMessage = searchParams.get('message') || 'An unknown error occurred during authentication.';

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#090311] to-[#141634] text-white bg-fixed">
            <Navbar color="#ef4444" />

            <section className="bg-transparent relative text-white overflow-hidden">
                <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-27 pt-24 lg:pt-36 pb-5 gap-1">

                    <div className={`text-left w-full max-w-3xl transition-opacity duration-500 ${isLoaded ? 'animate-fade-in-top opacity-100' : 'opacity-0'}`}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6 flex items-center gap-4">
                            <SVG name="cross" className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
                            <span className="text-red-400 text-3xl sm:text-4xl font-black font-newtegomin">
                                Authentication Failed
                            </span>
                        </h1>

                        <p className="text-white/70 text-lg sm:text-lg mb-6 font-mono leading-relaxed bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
                            {errorMessage}
                        </p>

                        <div className="flex flex-row gap-3 mt-8">
                            <button
                                onClick={() => navigate('/recommend/by-list')}
                                className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-white font-mono flex items-center gap-2 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-mono flex items-center gap-2 transition-colors"
                            >
                                <SVG name="home" size="w-5 h-5" />
                                Go Home
                            </button>
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {/* Desktop image */}
                        <img
                            src="/img3.png"
                            alt="error-img"
                            className={`hidden lg:block w-[260px] sm:w-[300px] lg:w-[320px] h-auto drop-shadow-2xl rounded-lg transition-opacity duration-500 ml-3 filter grayscale hover:grayscale-0 ${isLoaded ? 'animate-fade-in-bottom opacity-100' : 'opacity-0'}`}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ErrorPage;
