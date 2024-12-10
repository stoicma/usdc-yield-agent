import { request } from 'undici';
import dotenv from 'dotenv';

dotenv.config();

async function testBrianApi() {
    const apiKey = process.env.BRIAN_API_KEY;
    console.log('API Key loaded:', apiKey?.substring(0, 10) + '...');
    
    if (!apiKey) {
        throw new Error('BRIAN_API_KEY not found in environment variables');
    }

    try {
        const { statusCode, body } = await request('https://api.brianknows.org/api/v0/agent', {
            method: 'POST',
            headers: {
                'x-brian-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'defi',
                address: '0x41b8788C75Ca8f33Fb69Db7698E9cEAc0bd7d043',
                messages: [{
                    sender: 'user',
                    content: 'Create a transaction to stake 1000 USDC on Aave on Ethereum'
                }],
                parameters: {
                    protocol: 'Aave',
                    chain: 'Ethereum',
                    amount: '1000',
                    token: 'USDC'
                }
            })
        });

        console.log('Status code:', statusCode);
        const responseText = await body.text();
        console.log('Response:', responseText);

        try {
            const data = JSON.parse(responseText);
            console.log('Parsed response:', JSON.stringify(data, null, 2));
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
        }
        
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            const errorText = await error.response.body.text();
            console.error('Response:', errorText);
        }
    }
}

console.log('Testing Brian API...');
testBrianApi(); 