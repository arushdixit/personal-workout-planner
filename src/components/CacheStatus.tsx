import { RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CacheStatusState = 'fresh' | 'stale' | 'needsSync' | 'error' | 'offline';

interface CacheStatusProps {
    state: CacheStatusState;
    lastSynced?: string;
    pendingSync?: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function CacheStatus({
    state,
    lastSynced,
    pendingSync = 0,
    onRefresh,
    isRefreshing = false
}: CacheStatusProps) {
    const getStatusInfo = () => {
        switch (state) {
            case 'fresh':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/20',
                    text: 'Synced',
                };
            case 'stale':
                return {
                    icon: RefreshCw,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/20',
                    text: 'Stale',
                };
            case 'needsSync':
                return {
                    icon: AlertCircle,
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-500/10',
                    borderColor: 'border-orange-500/20',
                    text: `Pending${pendingSync > 1 ? ` (${pendingSync})` : ''}`,
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/20',
                    text: 'Sync Failed',
                };
            case 'offline':
                return {
                    icon: WifiOff,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/10',
                    borderColor: 'border-gray-500/20',
                    text: 'Offline',
                };
            default:
                return {
                    icon: RefreshCw,
                    color: 'text-gray-400',
                    bgColor: 'bg-gray-500/10',
                    borderColor: 'border-gray-500/20',
                    text: 'Syncing...',
                };
        }
    };

    const formatLastSynced = (dateString?: string): string => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;

    return (
        <div className="flex items-center gap-2">
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium glass',
                    statusInfo.bgColor,
                    statusInfo.borderColor,
                    'border'
                )}
            >
                <Icon className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                <span className={cn(statusInfo.color)}>{statusInfo.text}</span>
            </div>
            {lastSynced && (
                <span className="text-xs text-muted-foreground">
                    {formatLastSynced(lastSynced)}
                </span>
            )}
            {(state === 'stale' || state === 'error') && onRefresh && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-7 w-7"
                    aria-label="Refresh"
                >
                    <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
                </Button>
            )}
        </div>
    );
}
