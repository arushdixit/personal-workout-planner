import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/lib/enriched-exercemus-data.json', 'utf8'));
const missing = data.exercises
    .filter((ex: any) => !ex.video)
    .map((ex: any) => ex.name);

fs.writeFileSync('missing_videos.json', JSON.stringify(missing, null, 2));
console.log(`Found ${missing.length} exercises missing videos.`);
