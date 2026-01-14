import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_OPENROUTER_API_KEY;

async function checkKey() {
    if (!API_KEY) {
        console.error('VITE_OPENROUTER_API_KEY not found');
        return;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/key', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
            },
        });
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error checking key:', error);
    }
}

checkKey();
