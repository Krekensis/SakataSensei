import React from 'react';
import Navbar from '../../components/Navbar';

const ByAnime: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#090311] to-[#141634] text-white">
            <Navbar color="#a78bfa" />
            <div className="flex flex-col items-center justify-center pt-32 px-6">
                <h1 className="text-4xl font-bold font-newtegomin mb-4 text-purple-300">Recommend by Anime</h1>
                <p className="text-xl font-mono text-gray-400">Coming soon...</p>
            </div>
        </div>
    );
};

export default ByAnime;
