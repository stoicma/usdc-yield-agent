import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log('Script started');
    
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('API Key found');

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    console.log('Making API call...');

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello!' }],
            model: 'gpt-3.5-turbo',
        });

        console.log('Response:', completion.choices[0].message);
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('Script finished');
}

main().catch(console.error); 