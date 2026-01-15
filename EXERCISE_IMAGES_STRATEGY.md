# Exercise Images - Strategy Guide

## Current Implementation

The app now supports three levels of media for exercises (in priority order):

1. **YouTube Video** (highest priority) - Embedded from `tutorialUrl` field
2. **Exercise Image** (fallback) - Static image from `imageUrl` field
3. **Placeholder** (last resort) - Generic "No video available" message

## Strategy Options

### Option A: Use Placeholders (RECOMMENDED FOR MVP)
**Effort**: Low | **Cost**: $0 | **Time**: Immediate

Keep the current placeholder implementation. Most exercises from Exercemus already have video URLs, so this is a good starting point.

**Pros:**
- No downloads needed
- Zero cost
- Consistent look
- Works immediately

**Cons:**
- Less visual appeal for exercises without videos

### Option B: Check Exercemus Repository for Images
**Effort**: Medium | **Cost**: $0 | **Time**: 2-4 hours

The Exercemus database might include image URLs. We can check and import them.

**Steps:**
1. Check the `enriched-exercemus-data.json` for image URLs
2. If found, update the import script to include them
3. Images will be loaded from external URLs

**Pros:**
- Free
- Comprehensive coverage
- Maintained by Exercemus team

**Cons:**
- Depends on external hosting
- May not have images for all exercises

### Option C: Use ExerciseDB API
**Effort**: Medium | **Cost**: $0-10/month | **Time**: 4-6 hours

Integrate with ExerciseDB API for exercise images and GIFs.

**API**: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb

**Steps:**
1. Sign up for RapidAPI (free tier available)
2. Get API key
3. Create service to fetch exercise images
4. Cache images locally or use CDN URLs

**Pros:**
- High-quality images and GIFs
- Large database
- Professional quality

**Cons:**
- API rate limits
- Requires API key management
- External dependency

### Option D: Selective Manual Downloads
**Effort**: High | **Cost**: $0 | **Time**: 8-12 hours

Download images for the most popular exercises only.

**Steps:**
1. Identify top 50-100 most used exercises
2. Find images on Google Images, Unsplash, or Pexels
3. Download and optimize for web
4. Store in `/public/images/exercises/`

**Pros:**
- Full control over quality
- No external dependencies
- Can choose best images

**Cons:**
- Time-consuming
- Limited coverage
- Manual maintenance

## Recommended Approach

### Phase 1: Current State ✅
- YouTube videos work
- Placeholder for exercises without videos
- **Status**: COMPLETE

### Phase 2: Check Exercemus Data (Next Step)
1. Inspect `enriched-exercemus-data.json` for image/gif URLs
2. If found, update import to include them
3. Test with a few exercises

### Phase 3: Enhance as Needed
Based on Phase 2 results:
- If Exercemus has good coverage → Use their images
- If coverage is poor → Consider ExerciseDB API or manual downloads

## Implementation Details

### If Adding Image URLs to Database

Update `src/lib/db.ts`:
```typescript
export interface Exercise {
  // ... existing fields
  imageUrl?: string; // URL or path to exercise image
  gifUrl?: string;   // URL to animated GIF (if available)
}
```

Update `src/lib/exercemus.ts`:
```typescript
exercisesToInsert: Exercise[] = data.exercises.map((ex: any) => ({
  // ... existing mappings
  imageUrl: ex.image_url || ex.image || '',
  gifUrl: ex.gif_url || ex.gif || '',
}))
```

Update `src/components/ExerciseDetail.tsx`:
```typescript
{exercise.tutorialUrl ? (
  // YouTube embed
) : exercise.imageUrl ? (
  <img 
    src={exercise.imageUrl} 
    alt={exercise.name}
    className="absolute inset-0 w-full h-full object-cover"
  />
) : exercise.gifUrl ? (
  <img 
    src={exercise.gifUrl} 
    alt={exercise.name}
    className="absolute inset-0 w-full h-full object-cover"
  />
) : (
  // Placeholder
)}
```

## Next Steps

1. **Inspect the data**: Check if Exercemus already provides image URLs
   ```bash
   # Search for image-related fields in the JSON
   grep -i "image\|gif\|photo" src/lib/enriched-exercemus-data.json | head -20
   ```

2. **Test with sample**: If found, test with a few exercises first

3. **Decide on strategy**: Based on findings, choose Option A, B, C, or D

4. **Implement**: Update code as needed

## Testing

After implementation:
1. Open exercise detail page
2. Check exercises with videos (should show video)
3. Check exercises without videos (should show image or placeholder)
4. Verify fallback chain works correctly

## Performance Considerations

- **External URLs**: Faster initial load, but depends on external hosting
- **Local images**: Slower initial load, but more reliable
- **Lazy loading**: Consider implementing for better performance
- **WebP format**: Use for better compression (smaller file sizes)

## Conclusion

**Recommended**: Start with Option A (current placeholders), then explore Option B (check Exercemus data). Only move to Options C or D if needed.

The current implementation with YouTube videos + placeholders is already quite good for an MVP!
