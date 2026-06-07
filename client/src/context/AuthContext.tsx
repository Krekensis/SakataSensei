import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
    isCheckingAuth: boolean;
    isLoggedIn: boolean;
    loginType: string;
    accessToken: string;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loginType, setLoginType] = useState('none');
    const [accessToken, setAccessToken] = useState('');

    useEffect(() => {
        fetch('/auth/status', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setIsLoggedIn(data.isLoggedIn);
                setLoginType(data.loginType);
                setAccessToken(data.accessToken || "");
            })
            .catch(err => console.error("Auth check failed:", err))
            .finally(() => setIsCheckingAuth(false));
    }, []);

    const logout = async () => {
        await fetch('/auth/logout', { method: 'POST' });
        setIsLoggedIn(false);
        setLoginType('none');
        setAccessToken('');
    };

    return (
        <AuthContext.Provider value={{ isCheckingAuth, isLoggedIn, loginType, accessToken, logout }}>
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
