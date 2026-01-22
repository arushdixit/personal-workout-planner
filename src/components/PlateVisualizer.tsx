import { cn } from '@/lib/utils';

interface PlateVisualizerProps {
    weight: number;
    unit: 'kg' | 'lbs';
    barWeight?: number;
    showLabels?: boolean;
}

const KG_PLATES = [
    { weight: 25, color: 'bg-red-500', width: 'w-3' },
    { weight: 20, color: 'bg-blue-500', width: 'w-3' },
    { weight: 15, color: 'bg-yellow-500', width: 'w-2.5' },
    { weight: 10, color: 'bg-green-500', width: 'w-2' },
    { weight: 5, color: 'bg-white', width: 'w-1.5' },
    { weight: 2.5, color: 'bg-gray-400', width: 'w-1' },
    { weight: 1.25, color: 'bg-gray-600', width: 'w-0.5' },
];

const LB_PLATES = [
    { weight: 45, color: 'bg-red-500', width: 'w-4' },
    { weight: 35, color: 'bg-blue-500', width: 'w-3.5' },
    { weight: 25, color: 'bg-green-500', width: 'w-3' },
    { weight: 10, color: 'bg-yellow-500', width: 'w-2' },
    { weight: 5, color: 'bg-white', width: 'w-1.5' },
    { weight: 2.5, color: 'bg-gray-400', width: 'w-1' },
];

const PlateVisualizer = ({
    weight,
    unit,
    barWeight = unit === 'kg' ? 20 : 45,
    showLabels = true,
}: PlateVisualizerProps) => {
    const plates = unit === 'kg' ? KG_PLATES : LB_PLATES;
    const totalWeightPerSide = (weight - barWeight) / 2;

    if (totalWeightPerSide <= 0) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="h-8 bg-gray-700 rounded w-8 flex items-center justify-center text-xs">
                    {barWeight}
                </div>
                <span>Bar only</span>
            </div>
        );
    }

    const plateCount: Record<number, number> = {};
    let remaining = totalWeightPerSide;

    for (const plate of plates) {
        if (plate.weight > remaining) continue;
        const count = Math.floor(remaining / plate.weight);
        if (count > 0) {
            plateCount[plate.weight] = count;
            remaining -= count * plate.weight;
        }
    }

    return (
        <div className="flex items-center gap-1">
            {/* Left side plates */}
            <div className="flex items-center gap-0.5">
                {Object.entries(plateCount)
                    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                    .map(([plateWeight, count]) => {
                        const plate = plates.find(p => p.weight === parseFloat(plateWeight));
                        if (!plate) return null;
                        return (
                            <div key={plateWeight} className="flex gap-0.5">
                                {Array.from({ length: count }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            plate.color,
                                            plate.width,
                                            'h-8 rounded-sm border border-black/20'
                                        )}
                                        title={`${plateWeight} ${unit}`}
                                    />
                                ))}
                            </div>
                        );
                    })}
            </div>

            {/* Bar */}
            <div
                className="h-2 bg-gradient-to-b from-gray-400 to-gray-600 rounded"
                style={{ width: `${barWeight * 1.5}px` }}
            />

            {/* Right side plates (mirrored) */}
            <div className="flex items-center gap-0.5">
                {Object.entries(plateCount)
                    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
                    .map(([plateWeight, count]) => {
                        const plate = plates.find(p => p.weight === parseFloat(plateWeight));
                        if (!plate) return null;
                        return (
                            <div key={plateWeight} className="flex gap-0.5">
                                {Array.from({ length: count }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            plate.color,
                                            plate.width,
                                            'h-8 rounded-sm border border-black/20'
                                        )}
                                        title={`${plateWeight} ${unit}`}
                                    />
                                ))}
                            </div>
                        );
                    })}
            </div>

            {/* Weight label */}
            {showLabels && (
                <span className="text-xs text-muted-foreground ml-2">
                    {weight} {unit}
                </span>
            )}
        </div>
    );
};

export default PlateVisualizer;
