import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, UserProfile } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import { importExercemusData } from '@/lib/exercemus';
import { User } from '@supabase/supabase-js';

interface UserContextType {
    currentUser: UserProfile | null;
    allUsers: UserProfile[];
    loading: boolean;
    refreshing: boolean;
    isAuthenticated: boolean;
    switchUser: (userId: number) => void;
    refreshUsers: (supabaseUserId?: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (
        email: string,
        password: string,
        profile: Omit<UserProfile, 'id' | 'supabaseUserId' | 'onboarded' | 'createdAt'>
    ) => Promise<void>;
    logout: () => void;
    setSupabaseUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const refreshUsers = async (supabaseUserId?: string) => {
        if (!currentUser) setLoading(true);
        setRefreshing(true);
        try {
            const users = supabaseUserId
                ? await db.users.where('supabaseUserId').equals(supabaseUserId).toArray()
                : await db.users.toArray();
            setAllUsers(users);

            // Also update currentUser if it's already set to ensure it has latest data (like lastCompletedRoutineId)
            if (currentUser) {
                const updated = users.find(u => u.id === currentUser.id);
                if (updated) setCurrentUser(updated);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const user = session?.user ?? null;
            setSupabaseUser(user);
            setIsAuthenticated(!!user);
            console.log('[Auth] State change:', { event, user: user?.id });

            if (event === 'TOKEN_REFRESHED') {
                console.log('[Auth] Token refreshed, skipping database reload');
                return;
            }

            if (user) {
                setLoading(true);
                try {
                    const users = await db.users.where('supabaseUserId').equals(user.id).toArray();
                    console.log('[Auth] Found profiles:', users.length, users);
                    setAllUsers(users);
                    if (users.length > 0) {
                        setCurrentUser(users[0]);
                        // Ensure exercise data is present for returning user
                        importExercemusData().catch(console.error);
                    } else {
                        console.log('[Auth] No local profile found, checking user metadata');
                        // Try to restore profile from Supabase user metadata
                        const meta = user.user_metadata;
                        if (meta && (meta.name || meta.email)) {
                            const restoredProfile: Omit<UserProfile, 'id'> = {
                                name: meta.name || meta.email,
                                gender: meta.gender || 'male',
                                age: meta.age || 25,
                                height: meta.height || 175,
                                weight: meta.weight || 70,
                                supabaseUserId: user.id,
                                onboarded: meta.onboarded !== undefined ? meta.onboarded : true,
                                createdAt: meta.createdAt || new Date().toISOString(),
                            };
                            const userId = await db.users.add(restoredProfile);
                            const userProfile = await db.users.get(userId as number);
                            setCurrentUser(userProfile);
                            setAllUsers(userProfile ? [userProfile] : []);
                            // Ensure exercise data is present for restored profile
                            importExercemusData().catch(console.error);
                        } else {
                            setCurrentUser(null);
                        }
                    }
                } catch (err) {
                    console.error('[Auth] Error loading profile:', err);
                    setCurrentUser(null);
                } finally {
                    setLoading(false);
                }
            } else {
                console.log('[Auth] No user logged in');
                setCurrentUser(null);
                setAllUsers([]);
                setIsAuthenticated(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const switchUser = (userId: number) => {
        const user = allUsers.find(u => u.id === userId);
        if (user && supabaseUser) {
            setCurrentUser(user);
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
    };

    const signUp = async (
        email: string,
        password: string,
        profile: Omit<UserProfile, 'id' | 'supabaseUserId' | 'onboarded' | 'createdAt'>
    ) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: profile,
            },
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error('Sign up failed');

        const newUser: UserProfile = {
            ...profile,
            supabaseUserId: data.user.id,
            onboarded: true,
            createdAt: new Date().toISOString(),
        };

        await db.users.add(newUser);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setAllUsers([]);
        setIsAuthenticated(false);
    };

    return (
        <UserContext.Provider value={{ currentUser, allUsers, loading, refreshing, isAuthenticated, switchUser, refreshUsers: () => refreshUsers(supabaseUser?.id), signIn, signUp, logout, setSupabaseUser }}>
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
