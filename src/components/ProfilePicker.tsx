import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Plus } from 'lucide-react';
import { UserProfile } from '@/lib/db';

interface ProfilePickerProps {
    users: UserProfile[];
    onSelect: (userId: number) => void;
    onNew: () => void;
}

const ProfilePicker = ({ users, onSelect, onNew }: ProfilePickerProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8 animate-scale-in">
                <div className="text-center">
                    <h1 className="text-4xl font-black gradient-red-text tracking-tighter mb-2">PRO-LIFTS</h1>
                    <p className="text-muted-foreground">Select your profile to continue</p>
                </div>

                <div className="grid gap-4">
                    {users.map((user) => (
                        <Card
                            key={user.id}
                            className="glass hover:bg-white/10 transition-all cursor-pointer border-white/10 group"
                            onClick={() => user.id && onSelect(user.id)}
                        >
                            <CardContent className="flex items-center p-6 gap-4">
                                <div className="w-16 h-16 rounded-full gradient-red flex items-center justify-center glow-red group-hover:scale-105 transition-transform">
                                    <User className="text-white w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold">{user.name}</h3>
                                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold">
                                        {user.activeSplit || 'No Split Set'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {users.length < 2 && (
                        <Button
                            variant="glass"
                            className="h-24 rounded-2xl border-dashed border-2 flex flex-col gap-2 hover:border-primary/50"
                            onClick={onNew}
                        >
                            <Plus className="w-6 h-6 text-primary" />
                            <span>Add Profile</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePicker;
