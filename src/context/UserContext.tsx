import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, UserProfile } from '@/lib/db';

interface UserContextType {
    currentUser: UserProfile | null;
    allUsers: UserProfile[];
    loading: boolean;
    switchUser: (userId: number) => void;
    refreshUsers: () => Promise<void>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshUsers = async () => {
        setLoading(true);
        try {
            const users = await db.users.toArray();
            setAllUsers(users);

            const lastUserId = localStorage.getItem('prolifts_active_user');
            if (lastUserId) {
                const foundUser = users.find(u => u.id === parseInt(lastUserId, 10));
                if (foundUser) {
                    setCurrentUser(foundUser);
                }
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUsers();
    }, []);

    const switchUser = (userId: number) => {
        const user = allUsers.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('prolifts_active_user', String(userId));
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('prolifts_active_user');
    };

    return (
        <UserContext.Provider value={{ currentUser, allUsers, loading, switchUser, refreshUsers, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
