# Fitness Tracker - Image Asset Requirements

## Overview
This document outlines all the image assets needed for the fitness tracker application to replace emoji-based muscle group icons and add exercise images.

## 1. Muscle Group Icons (Priority: HIGH)

These images will replace the emoji icons in the ExerciseDetail "Target" tab. Each muscle group needs a clean, anatomical icon/illustration.

### Required Muscle Group Images:
1. **abs.png** - Abdominal muscles
2. **adductors.png** - Inner thigh/adductor muscles
3. **biceps.png** - Biceps
4. **calves.png** - Calf muscles
5. **chest.png** - Pectoral muscles
6. **deltoids.png** - Shoulder/deltoid muscles
7. **forearm.png** - Forearm muscles
8. **glutes.png** - Gluteal muscles
9. **hamstrings.png** - Hamstring muscles
10. **lats.png** - Latissimus dorsi (back)
11. **lower-back.png** - Lower back muscles
12. **neck.png** - Neck muscles
13. **obliques.png** - Oblique muscles
14. **quadriceps.png** - Quadriceps (front thigh)
15. **traps.png** - Trapezius muscles
16. **triceps.png** - Triceps
17. **tibialis.png** - Tibialis anterior (shin)

### Image Specifications:
- **Format**: PNG with transparent background
- **Size**: 256x256px (will be displayed at 48x48px, so high DPI)
- **Style**: Clean, modern anatomical illustrations
- **Color**: Single color (white or light gray) for easy theming
- **Background**: Transparent

### Recommended Sources:
1. **Flaticon** (https://www.flaticon.com/) - Search for "muscle anatomy icons"
2. **The Noun Project** (https://thenounproject.com/) - Search for specific muscle names
3. **Custom Design** - Use Figma/Illustrator to create consistent set
4. **AI Generation** - Use DALL-E or Midjourney with prompt: "minimalist anatomical icon of [muscle name], white on transparent background, medical illustration style"

## 2. Exercise Images (Priority: MEDIUM)

Exercise images to display when video is not available in ExerciseDetail component.

### Strategy:
Since we have 800+ exercises from Exercemus, we need a scalable approach:

#### Option A: Use Exercise Name to Generate Placeholder
- Create a component that generates a styled placeholder with exercise name
- No downloads needed
- Consistent look across all exercises
- **Recommended for MVP**

#### Option B: Download from Exercemus Repository
- Check if Exercemus has image assets in their repository
- Repository: https://github.com/yuhonas/free-exercise-db
- Look for image URLs in the exercise data

#### Option C: Use External Exercise Image API
- **ExerciseDB API** (https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
- Provides exercise images and GIFs
- Requires API key (free tier available)

#### Option D: Selective Manual Downloads
- Download images only for most popular ~50 exercises
- Use placeholder for others
- Gradually expand library

### Image Specifications (if downloading):
- **Format**: WebP or JPG
- **Size**: 800x600px (4:3 aspect ratio)
- **Quality**: Medium compression for web
- **Storage**: `/public/images/exercises/[exercise-id].webp`

## 3. Implementation Plan

### Phase 1: Muscle Group Icons (Immediate)
1. Download/create 17 muscle group icon images
2. Place in `/public/images/muscles/`
3. Update `ExerciseDetail.tsx` to use images instead of emojis
4. Add fallback to emoji if image fails to load

### Phase 2: Exercise Images (Next)
1. Implement placeholder component for exercises without videos
2. Add image URL field to Exercise interface
3. Create utility to check if exercise has image
4. Optionally: Download images for top 50 exercises

### Phase 3: Video Integration (Current)
- ✅ Already implemented YouTube video embed
- Fallback to exercise image if no video
- Fallback to placeholder if no image

## 4. File Structure

```
public/
  images/
    muscles/
      abs.png
      adductors.png
      biceps.png
      calves.png
      chest.png
      deltoids.png
      forearm.png
      glutes.png
      hamstrings.png
      lats.png
      lower-back.png
      neck.png
      obliques.png
      quadriceps.png
      traps.png
      triceps.png
      tibialis.png
    exercises/
      [exercise-id].webp
      placeholder.svg
```

## 5. Code Changes Required

### Update Exercise Interface (db.ts)
```typescript
export interface Exercise {
  // ... existing fields
  imageUrl?: string; // Path to exercise image
}
```

### Update ExerciseDetail.tsx
Replace emoji-based muscle icons with image-based icons:
```typescript
const getMuscleIcon = (muscleName: string, isPrimary: boolean) => {
  const muscleSlug = muscleName.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={cn(
      "w-12 h-12 rounded-full flex items-center justify-center overflow-hidden",
      isPrimary ? "bg-rose-600/20 border border-rose-600/30" : "bg-orange-400/20 border border-orange-400/30"
    )}>
      <img 
        src={`/images/muscles/${muscleSlug}.png`}
        alt={muscleName}
        className="w-8 h-8 object-contain"
        onError={(e) => {
          // Fallback to emoji if image fails
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
```

### Update Video/Image Area
```typescript
{exercise.tutorialUrl ? (
  // YouTube embed
) : exercise.imageUrl ? (
  <img 
    src={exercise.imageUrl} 
    alt={exercise.name}
    className="absolute inset-0 w-full h-full object-cover"
  />
) : (
  // Placeholder
)}
```

## 6. Next Steps

1. **Provide muscle group images** - Download or create the 17 muscle icon images
2. **Choose exercise image strategy** - Decide on Option A, B, C, or D above
3. **Implement image loading** - Update components to use images
4. **Add error handling** - Ensure graceful fallbacks
5. **Optimize performance** - Lazy load images, use WebP format

## 7. Budget Estimate

- **Muscle Icons**: $0-50 (if purchasing from Flaticon/Noun Project)
- **Exercise Images**: 
  - Option A (Placeholders): $0
  - Option B (Exercemus): $0
  - Option C (API): $0-10/month (free tier available)
  - Option D (Manual): $0 (time investment)

**Recommended**: Start with muscle icons ($0-50) and Option A for exercises ($0)
