import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import { bodyFront } from '../src/components/anatomy/bodyFront.js';
import { bodyBack } from '../src/components/anatomy/bodyBack.js';

// Muscle groups to generate
const MUSCLE_GROUPS = [
  'abs',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'deltoids',
  'forearm',
  'gluteal',
  'hamstring',
  'lats', // Added lats
  'upper-back',
  'lower-back',
  'neck',
  'obliques',
  'quadriceps',
  'trapezius',
  'triceps',
  'tibialis',
];

// Colors for primary and secondary
const PRIMARY_COLOR = '#DC2626'; // Racing Red (bold)
const SECONDARY_COLOR = '#FCA5A5'; // Light salmon/pink
const ADJACENT_COLOR = '#E5E7EB'; // Lighter gray (Gray 200)

// Define which muscles are adjacent to each target muscle
const ADJACENT_MUSCLES: Record<string, string[]> = {
  'biceps': ['forearm', 'deltoids', 'chest', 'obliques', 'abs', 'triceps', 'head', 'neck'],
  'triceps': ['forearm', 'deltoids', 'upper-back', 'lower-back', 'trapezius'],  // BACK VIEW
  'deltoids': ['chest', 'biceps', 'neck', 'head', 'upper-back', 'trapezius', 'triceps', 'abs', 'obliques'],
  'chest': ['abs', 'obliques', 'deltoids', 'biceps', 'neck', 'triceps'],
  'abs': ['chest', 'obliques', 'deltoids'],
  'obliques': ['abs', 'chest'],
  'quadriceps': ['gluteal', 'adductors', 'calves', 'tibialis', 'feet', 'knees', 'hamstring'],
  'hamstring': ['gluteal', 'lower-back', 'calves'],
  'calves': ['hamstring', 'feet'],
  'gluteal': ['hamstring', 'lower-back', 'upper-back'],
  'forearm': ['biceps', 'triceps', 'hands', 'chest', 'obliques', 'abs'],
  'trapezius': ['upper-back', 'deltoids', 'neck', 'head'],
  'upper-back': ['trapezius', 'lower-back', 'deltoids', 'triceps', 'neck'],
  'lats': ['lower-back', 'deltoids', 'triceps', 'neck', 'upper-back', 'trapezius'], // Using upper-back as base
  'lower-back': ['upper-back', 'gluteal'],
  'neck': ['trapezius', 'deltoids', 'head'],
  'adductors': ['quadriceps'],
  'tibialis': [],
};

// Define crop regions - TIGHT ZOOM on each muscle
// Switching to RIGHT SIDE focus for symmetry muscles where requested (halving)
const CROP_REGIONS: Record<string, string> = {
  'biceps': '380 200 300 400',      // Right Bicep + shoulder + chest + face
  'triceps': '1100 250 300 400',    // Right Tricep (Back) + traps
  'deltoids': '380 150 300 350',    // Right Shoulder + chest + bicep + neck + face
  'chest': '250 280 250 380',       // Full Chest (Keep centered for context)
  'abs': '260 420 220 300',         // Abs centered (x~260-480)
  'obliques': '350 420 200 250',    // Right Obliques
  'quadriceps': '290 650 300 750',  // Right Leg (Centered: x=290, Full length: h=750)
  'hamstring': '950 680 350 500',   // Right Hamstring (Back view, x>900, roughly centered right leg)
  'calves': '930 800 350 600',      // Back Calves + Hamstrings + Feet (Taller)
  'gluteal': '900 400 350 500',     // Both glutes + lower back
  'forearm': '450 400 300 400',     // Right Forearm + tricep + hand + chest
  'trapezius': '950 250 300 300',   // Traps + neck + upper back (Back view)
  'upper-back': '900 250 350 450',  // Upper back + traps + lower back
  'lats': '900 250 350 450',        // Lats (Full back view)
  'lower-back': '900 500 350 300',  // Lower back + upper back + glutes
  'neck': '310 230 80 120',         // Neck + traps + bit of shoulders
  'adductors': '280 700 140 280',   // Adductors + quads
  'tibialis': '280 990 140 230',    // Tibialis (shins)
};

interface BodyPart {
  slug: string;
  color: string;
  path: {
    left?: string[];
    right?: string[];
    common?: string[];
  };
}

async function generateMuscleImage(muscleName: string, isPrimary: boolean = true) {
  console.log(`Generating ${isPrimary ? 'primary' : 'secondary'} image for: ${muscleName}`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 256, height: 256, deviceScaleFactor: 2 });

  // Use imported anatomy data
  const allParts = [...bodyFront, ...bodyBack];

  // Find the muscle part
  let targetSlug = muscleName;
  if (muscleName === 'lats') targetSlug = 'upper-back';
  
  const musclePart = allParts.find(part => part.slug === targetSlug);
  
  if (!musclePart) {
    console.error(`Muscle ${muscleName} not found!`);
    await browser.close();
    return;
  }

  // Choose colors
  const highlightColor = isPrimary ? PRIMARY_COLOR : SECONDARY_COLOR;
  const adjacentColor = ADJACENT_COLOR; // Lighter gray for adjacent muscles

  // Get adjacent muscles for this target
  const adjacentMuscles = ADJACENT_MUSCLES[muscleName] || [];

  // Build SVG paths - only show target + adjacent muscles
  let adjacentPaths = '';
  let highlightPaths = '';
  
  // Render only target and adjacent muscles
  allParts.forEach(part => {
    // Check if this part is the target (handling alias)
    const isTarget = part.slug === targetSlug;
    const isAdjacent = adjacentMuscles.includes(part.slug);
    
    // Skip if not target or adjacent
    if (!isTarget && !isAdjacent) return;
    
    const color = isTarget ? highlightColor : adjacentColor;
    const opacity = isTarget ? 1 : 0.7; // More visible adjacent muscles
    
    if (part.path.common) {
      part.path.common.forEach(p => {
        if (isTarget) {
          highlightPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        } else {
          adjacentPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        }
      });
    }
    if (part.path.left) {
      part.path.left.forEach(p => {
        if (isTarget) {
          highlightPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        } else {
          adjacentPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        }
      });
    }
    if (part.path.right) {
      part.path.right.forEach(p => {
        if (isTarget) {
          highlightPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        } else {
          adjacentPaths += `<path d="${p}" fill="${color}" opacity="${opacity}" />`;
        }
      });
    }
  });
  
  const paths = adjacentPaths + highlightPaths;

  // Get crop region for this muscle
  const viewBox = CROP_REGIONS[muscleName] || '0 0 1400 1400';

  // Create HTML with SVG
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 256px;
            height: 256px;
          }
          svg {
            width: 100%;
            height: 100%;
            filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.3));
          }
          .bg-rect {
            fill: #1F2937;
            opacity: 0.6;
            rx: 12;
          }
        </style>
      </head>
      <body>
        <svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">
          <rect class="bg-rect" x="0" y="0" width="100%" height="100%" />
          ${paths}
        </svg>
      </body>
    </html>
  `;

  await page.setContent(html);
  
  // Output path
  const outputDir = path.join(process.cwd(), 'public', 'images', 'muscles');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const suffix = isPrimary ? '' : '-secondary';
  const outputPath = path.join(outputDir, `${muscleName}${suffix}.png`);
  
  // Screenshot
  await page.screenshot({
    path: outputPath,
    omitBackground: true,
    type: 'png',
  });

  console.log(`✓ Saved: ${outputPath}`);
  
  await browser.close();
}

// Main execution
async function main() {
  const muscleName = process.argv[2];
  const type = process.argv[3]; // 'primary' or 'secondary'
  
  if (muscleName && muscleName !== 'all') {
    // Generate single muscle
    const isPrimary = type !== 'secondary';
    await generateMuscleImage(muscleName, isPrimary);
  } else {
    // Generate all muscles - both primary and secondary
    console.log(`Generating ${MUSCLE_GROUPS.length * 2} muscle images (primary + secondary)...`);
    for (const muscle of MUSCLE_GROUPS) {
      await generateMuscleImage(muscle, true);  // Primary
      await generateMuscleImage(muscle, false); // Secondary
    }
    console.log('✓ All done!');
  }
}

main().catch(console.error);
