import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db, UserProfile } from '@/lib/db';
import { supabase } from '@/lib/supabaseClient';
import { pullUserExercises } from '@/lib/syncManager';
import { pullWorkoutSessions } from '@/lib/workoutSyncManager';
import { convertWeight } from '@/lib/units';
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
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const lastSyncedUserId = React.useRef<string | null>(null);

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

            if (event === 'SIGNED_OUT') {
                lastSyncedUserId.current = null;
                setCurrentUser(null);
                setAllUsers([]);
                setLoading(false);
                return;
            }

            if (user) {
                // Guard: Prevent duplicate sync for the same user within the same session
                if (lastSyncedUserId.current === user.id) {
                    console.log('[Auth] Duplicate user ID detected, skipping sync logic');
                    setLoading(false);
                    return;
                }

                lastSyncedUserId.current = user.id;
                setLoading(true);
                // Start pulling exercises immediately as it only needs supabase userId
                pullUserExercises(user.id).catch(console.error);

                try {
                    const users = await db.users.where('supabaseUserId').equals(user.id).toArray();
                    console.log('[Auth] Found profiles:', users.length, users);
                    setAllUsers(users);
                    if (users.length > 0) {
                        setCurrentUser(users[0]);
                        // Workout data still needs local user ID
                        pullWorkoutSessions(user.id, users[0].id!).catch(console.error);
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
                            // Exercise and workout data is imported on app mount in Index.tsx
                            pullUserExercises(user.id).catch(console.error);
                            pullWorkoutSessions(user.id, userId as number).catch(console.error);
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

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!currentUser || !currentUser.id) return;

        let finalUpdates = { ...updates };
        const oldUnit = currentUser.unitPreference || 'kg';
        const newUnit = updates.unitPreference;

        // Handle weight conversion if unit changes
        if (newUnit && newUnit !== oldUnit) {
            const newWeight = convertWeight(currentUser.weight, oldUnit, newUnit);
            finalUpdates.weight = newWeight;

            // Convert all historical sessions
            const sessions = await db.workout_sessions.where('userId').equals(currentUser.id).toArray();
            console.log(`[UserContext] Converting ${sessions.length} sessions to ${newUnit}`);

            for (const session of sessions) {
                let sessionChanged = false;
                const updatedExercises = session.exercises.map(ex => {
                    let exChanged = false;
                    const updatedSets = ex.sets.map(s => {
                        if (s.unit !== newUnit) {
                            sessionChanged = true;
                            exChanged = true;
                            return {
                                ...s,
                                weight: convertWeight(s.weight, s.unit || 'kg', newUnit),
                                unit: newUnit
                            };
                        }
                        return s;
                    });
                    return exChanged ? { ...ex, sets: updatedSets } : ex;
                });

                if (sessionChanged) {
                    await db.workout_sessions.update(session.id!, { exercises: updatedExercises });
                }
            }
        }

        await db.users.update(currentUser.id, finalUpdates);
        const updatedProfile = { ...currentUser, ...finalUpdates };
        setCurrentUser(updatedProfile);
        setAllUsers(prev => prev.map(u => u.id === currentUser.id ? updatedProfile : u));

        // Update user metadata in Supabase
        if (supabaseUser) {
            await supabase.auth.updateUser({
                data: finalUpdates
            });
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setAllUsers([]);
        setIsAuthenticated(false);
    };

    const refreshUsersCallback = useCallback(
        () => refreshUsers(supabaseUser?.id),
        [supabaseUser?.id] // eslint-disable-line react-hooks/exhaustive-deps
    );

    return (
        <UserContext.Provider value={{
            currentUser,
            allUsers,
            loading,
            refreshing,
            isAuthenticated,
            switchUser,
            refreshUsers: refreshUsersCallback,
            signIn,
            signUp,
            logout,
            setSupabaseUser,
            updateProfile
        }}>
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
