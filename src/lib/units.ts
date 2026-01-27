export const KG_TO_LBS = 2.20462;

export function convertWeight(weight: number, from: 'kg' | 'lbs' | string, to: 'kg' | 'lbs' | string): number {
    const fromUnit = from.toLowerCase();
    const toUnit = to.toLowerCase();

    if (fromUnit === toUnit) return weight;

    if (toUnit === 'lbs') {
        return Math.round(weight * KG_TO_LBS);
    } else if (toUnit === 'kg') {
        return Math.round(weight / KG_TO_LBS);
    }

    return weight;
}

export function formatWeight(weight: number, unit: 'kg' | 'lbs' | string): string {
    return `${weight} ${unit.toLowerCase()}`;
}
