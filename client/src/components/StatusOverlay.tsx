import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addAnimeToPlanningList } from '../utils/updateList';

interface StatusOverlayProps {
    anime: any;
    importedData: any;
}

const StatusOverlay: React.FC<StatusOverlayProps> = ({ anime, importedData }) => {
    const { isLoggedIn, loginType, accessToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // We maintain a local optimistic state for when the user successfully adds it
    const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

    const animeColor = anime.coverImage?.color || '#60a5fa';

    // Determine current status
    let currentStatus = optimisticStatus;

    if (!currentStatus && importedData) {
        if (importedData.completed?.some((item: any) => item.id === anime.idMal)) {
            currentStatus = 'COMPLETED';
        } else if (importedData.planning?.some((item: any) => item.id === anime.idMal)) {
            currentStatus = 'PLANNING';
        } else if (importedData.current?.some((item: any) => item.id === anime.idMal)) {
            currentStatus = 'CURRENT'; // Technically they are watching it, so maybe don't show +
        } else if (importedData.dropped?.some((item: any) => item.id === anime.idMal)) {
            currentStatus = 'DROPPED';
        } else if (importedData.onHold?.some((item: any) => item.id === anime.idMal)) {
            currentStatus = 'ON_HOLD';
        }
    }

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) return;

        // Use AL ID if logged into AniList, otherwise MAL ID
        const targetId = loginType === 'AniList' ? anime.id : anime.idMal;

        setIsLoading(true);
        const success = await addAnimeToPlanningList(targetId, loginType, accessToken);
        setIsLoading(false);

        if (success) {
            setOptimisticStatus('PLANNING');
        }
    };

    if (isLoading) {
        return (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-[#11161d]/90 p-1 sm:p-1.5 rounded-lg opacity-100 transition-opacity z-10 pointer-events-none shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" style={{ color: animeColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
            </div>
        );
    }

    if (currentStatus === 'COMPLETED') {
        return (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-[#11161d]/90 p-1 sm:p-1.5 rounded-lg opacity-90 transition-opacity z-10 pointer-events-none shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: animeColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        );
    }

    if (currentStatus === 'PLANNING' || currentStatus === 'CURRENT' || currentStatus === 'DROPPED' || currentStatus === 'ON_HOLD') {
        // If it's anything else in their list, we'll show a bookmark (can adjust later if we want distinct icons)
        return (
            <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-[#11161d]/90 p-1 sm:p-1.5 rounded-lg opacity-90 transition-opacity z-10 pointer-events-none shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: animeColor }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            </div>
        );
    }

    // Default: Show plus icon if logged in
    if (!isLoggedIn) return null;

    return (
        <div
            onClick={handleAdd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-[#11161d]/80 p-1 sm:p-1.5 rounded-lg opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-[#11161d]/90 z-10 shadow-md"
            title="Add to Planning List"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors" style={{ color: isHovered ? animeColor : '#8ba0b2' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </div>
    );
};

export default StatusOverlay;
