import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';

dotenv.config();

const main = async () => {
    console.log('Starting OpenAI test...');
    console.log('API Key found:', !!process.env.OPENAI_API_KEY);
    
    try {
        const chat = new ChatOpenAI({
            modelName: "gpt-3.5-turbo",
            temperature: 0,
        });

        console.log('ChatOpenAI instance created');

        const response = await chat.invoke([
            { role: 'user', content: 'Say hello!' }
        ]);

        console.log('Response received:', response);
    } catch (error) {
        console.error('Error:', error);
    }
};

console.log('Script started');
main().catch(error => {
    console.error('Top level error:', error);
}).finally(() => {
    console.log('Script finished');
}); 