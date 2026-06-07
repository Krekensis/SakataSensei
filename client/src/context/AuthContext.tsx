import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isCheckingAuth: boolean;
    isLoggedIn: boolean;
    loginType: string;
    accessToken: string;
    logout: () => Promise<void>;
    isServerOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginType, setLoginType] = useState('none');
    const [accessToken, setAccessToken] = useState('');
    const [isServerOnline, setIsServerOnline] = useState(true);

    useEffect(() => {
        fetch('/auth/status', { credentials: 'include' })
            .then(res => {
                if (!res.ok) throw new Error("Server response not ok");
                return res.json();
            })
            .then(data => {
                setIsLoggedIn(data.isLoggedIn);
                setLoginType(data.loginType);
                setAccessToken(data.accessToken || "");
                setIsServerOnline(true);
            })
            .catch(err => {
                console.error("Auth check failed:", err);
                setIsServerOnline(false);
            })
            .finally(() => setIsCheckingAuth(false));
    }, []);

    const logout = async () => {
        await fetch('/auth/logout', { method: 'POST' });
        setIsLoggedIn(false);
        setLoginType('none');
        setAccessToken('');
    };

    if (!isCheckingAuth && !isServerOnline) {
        return (
            <div className="min-h-screen bg-[#02020f] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h1 className="text-4xl md:text-5xl font-black mb-4 font-newtegomin tracking-wider text-[#60a5fa]">Connection Lost</h1>
                <p className="text-[#8ba0b2] text-lg md:text-xl max-w-lg mb-8 leading-relaxed">
                    Sakata Sensei's backend servers are currently offline or unreachable. Please check your connection or try again later.
                </p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-3 bg-[#151f2e] hover:bg-[#1e293b] border border-white/10 rounded-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isCheckingAuth, isLoggedIn, loginType, accessToken, logout, isServerOnline }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
