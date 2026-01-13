import React, { createContext, useContext, useEffect, useState } from 'react';
import { usersDb, UserProfile } from '@/lib/db';

interface UserContextType {
    currentUser: UserProfile | null;
    allUsers: UserProfile[];
    loading: boolean;
    switchUser: (userId: string) => void;
    refreshUsers: () => Promise<void>;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshUsers = async () => {
        try {
            const result = await usersDb.allDocs({ include_docs: true });
            const users = result.rows.map((row: any) => row.doc as UserProfile);
            setAllUsers(users);

            // Restore session if available
            const lastUserId = localStorage.getItem('lastUserId');
            if (lastUserId) {
                const user = users.find(u => u._id === lastUserId);
                if (user) setCurrentUser(user);
            } else if (users.length > 0 && !currentUser) {
                // Just pick one if none selected but users exist
                // Setting it to null instead to trigger profile picker if multiple
                if (users.length === 1) {
                    setCurrentUser(users[0]);
                    localStorage.setItem('lastUserId', users[0]._id);
                }
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUsers();
    }, []);

    const switchUser = (userId: string) => {
        const user = allUsers.find(u => u._id === userId);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('lastUserId', userId);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('lastUserId');
    };

    return (
        <UserContext.Provider value={{ currentUser, allUsers, loading, switchUser, refreshUsers, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
