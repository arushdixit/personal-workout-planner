import { useState } from 'react';
import { User, LogOut, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/db';

interface ProfileProps {
    currentUser: UserProfile | null;
}

const Profile = ({ currentUser }: ProfileProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: currentUser?.name || '',
        activeSplit: currentUser?.activeSplit || 'PPL',
        unitPreference: currentUser?.unitPreference || 'kg',
        weight: currentUser?.weight || 70,
        height: currentUser?.height || 175,
        age: currentUser?.age || 25,
    });
    const { updateProfile, logout } = useUser();

    const handleSave = async () => {
        await updateProfile(editData as Partial<UserProfile>);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 animate-slide-up pb-24">
            <div className="glass-card p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 gradient-red opacity-50" />
                <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-red flex items-center justify-center glow-red relative">
                    <User className="w-12 h-12 text-white" />
                    <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-pulse-slow" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">{currentUser?.name}</h2>
                <p className="text-primary uppercase text-xs font-black tracking-[0.2em] mt-2">
                    {currentUser?.activeSplit} Athlete
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Profile Identity</Label>
                    {!isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="h-7 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-primary/10"
                        >
                            <Edit className="w-3 h-3 mr-1" /> Edit Profile
                        </Button>
                    )}
                </div>

                <div className="glass-card divide-y divide-white/5">
                    {isEditing ? (
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-muted-foreground">Display Name</Label>
                                <Input
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 h-12 rounded-xl"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Measurement Unit</Label>
                                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                                        {['kg', 'lbs'].map(u => (
                                            <button
                                                key={u}
                                                onClick={() => setEditData({ ...editData, unitPreference: u as 'kg' | 'lbs' })}
                                                className={cn(
                                                    "flex-1 py-2 text-xs font-black uppercase rounded-lg transition-all",
                                                    editData.unitPreference === u ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground"
                                                )}
                                            >
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Training Split</Label>
                                    <Select
                                        value={editData.activeSplit}
                                        onValueChange={v => setEditData({ ...editData, activeSplit: v as any })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="glass border-white/10">
                                            <SelectItem value="PPL">Push Pull Legs</SelectItem>
                                            <SelectItem value="UpperLower">Upper/Lower</SelectItem>
                                            <SelectItem value="FullBody">Full Body</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Weight</Label>
                                    <div className="relative group">
                                        <Input
                                            type="number"
                                            value={editData.weight}
                                            onChange={e => setEditData({ ...editData, weight: parseFloat(e.target.value) })}
                                            className="bg-white/5 border-white/10 h-11 rounded-xl text-center w-full"
                                        />
                                        <div className="absolute right-2 top-0 bottom-0 flex items-center pointer-events-none">
                                            <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{editData.unitPreference}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Height (cm)</Label>
                                    <Input
                                        type="number"
                                        value={editData.height}
                                        onChange={e => setEditData({ ...editData, height: parseFloat(e.target.value) })}
                                        className="bg-white/5 border-white/10 h-11 rounded-xl text-center"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground">Age</Label>
                                    <Input
                                        type="number"
                                        value={editData.age}
                                        onChange={e => setEditData({ ...editData, age: parseInt(e.target.value) })}
                                        className="bg-white/5 border-white/10 h-11 rounded-xl text-center"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl">Cancel</Button>
                                <Button onClick={handleSave} className="flex-1 h-12 rounded-xl gradient-red glow-red border-none font-bold">Save Changes</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Current Unit</span>
                                <span className="text-sm font-black uppercase text-white">{currentUser?.unitPreference || 'kg'}</span>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Body Weight</span>
                                <span className="text-sm font-black text-white">{currentUser?.weight} {currentUser?.unitPreference || 'kg'}</span>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Height</span>
                                <span className="text-sm font-black text-white">{currentUser?.height} cm</span>
                            </div>
                            <div className="p-4 flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Age</span>
                                <span className="text-sm font-black text-white">{currentUser?.age} Years</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {!isEditing && (
                <Button
                    variant="destructive"
                    className="w-full bg-red-950/20 text-red-500 border-red-900/50 h-14 rounded-2xl font-bold"
                    onClick={() => logout()}
                >
                    <LogOut className="w-4 h-4 mr-2" /> Logout Account
                </Button>
            )}
        </div>
    );
};

export default Profile;
