import { getYieldData } from './yieldAggregator';
import axios from 'axios';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

export class BrianAgent {
    private readonly BRIAN_API_BASE = 'https://api.brianknows.org/api/v0';

    constructor() {
        console.log('Environment variables loaded:', {
            BRIAN_API_KEY: process.env.BRIAN_API_KEY ? 'Set' : 'Not set',
            WALLET_ADDRESS: process.env.WALLET_ADDRESS ? 'Set' : 'Not set',
            ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ? 'Set' : 'Not set',
            AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY ? 'Set' : 'Not set'
        });
    }

    private async processTransactionData(transactionData: any) {
        const steps = transactionData.result[0].data.steps;
        const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
        const provider = new ethers.JsonRpcProvider(alchemyUrl);
        const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY!, provider);

        console.log("Connected to Sepolia via Alchemy");

        for (const step of steps) {
            const { from, to, data, value, gasLimit } = step;
            const tx = {
                from,
                to,
                data,
                value: ethers.parseUnits(value, 'wei'),
                gasLimit: ethers.parseUnits(gasLimit, 'wei')
            };

            try {
                const txResponse = await wallet.sendTransaction(tx);
                console.log("Transaction Hash:", txResponse.hash);
                console.log("Waiting for confirmation...");
                await txResponse.wait();
                console.log("Transaction confirmed!");
            } catch (error) {
                console.error("Transaction failed:", error);
                throw error;
            }
        }
    }

    async executeStrategy(amount: string): Promise<string> {
        try {
            // Get yield data using the existing aggregator
            const yieldData = await getYieldData();
            
            // Get safe pools and sort by APY
            const safePools = yieldData
                .filter(p => p.riskCategory === 'Safe')
                .sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));

            if (safePools.length === 0) {
                return "No suitable yield opportunities found.";
            }

            const bestPool = safePools[0];
            console.log(`Selected pool: ${bestPool.protocol} on ${bestPool.chain}`);
            console.log(`APY: ${bestPool.apy}, Gas costs: ${bestPool.estimatedGasCosts}`);
            console.log(`Break-even period: ${bestPool.breakEvenDays}`);

            const prompt = `Deposit ${amount} USDC into ${bestPool.protocol} on ${bestPool.chain}`;
            
            const txResponse = await axios.post(
                `${this.BRIAN_API_BASE}/agent/transaction`,
                {
                    prompt,
                    address: process.env.WALLET_ADDRESS,
                    chainId: '11155111' // Sepolia
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-brian-api-key': process.env.BRIAN_API_KEY!
                    }
                }
            );

            await this.processTransactionData(txResponse.data);

            return `Successfully executed yield strategy: ${prompt}
                    APY: ${bestPool.apy}
                    Gas Costs: ${bestPool.estimatedGasCosts}
                    Break-even: ${bestPool.breakEvenDays}`;

        } catch (error) {
            console.error("Error in executeStrategy:", error);
            throw error;
        }
    }

    async query(prompt: string): Promise<string> {
        try {
            if (prompt.toLowerCase().includes('yield') || prompt.toLowerCase().includes('apy')) {
                const yieldData = await getYieldData();
                const safePools = yieldData
                    .filter(p => p.riskCategory === 'Safe')
                    .sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));

                if (safePools.length > 0) {
                    const bestPool = safePools[0];
                    return `Best USDC yield found:
                        Protocol: ${bestPool.protocol}
                        Chain: ${bestPool.chain}
                        APY: ${bestPool.apy}
                        TVL: ${bestPool.tvl}
                        Gas Costs: ${bestPool.estimatedGasCosts}
                        Break-even: ${bestPool.breakEvenDays}`;
                }
                return "No suitable yield opportunities found.";
            }

            const response = await axios.post(
                `${this.BRIAN_API_BASE}/agent/parameters-extraction`,
                { prompt },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-brian-api-key': process.env.BRIAN_API_KEY!
                    }
                }
            );

            return JSON.stringify(response.data.result, null, 2);
        } catch (error) {
            console.error("Error in query:", error);
            throw error;
        }
    }
}

// Add main function for direct testing
if (import.meta.url === `file://${process.argv[1]}`) {
    const agent = new BrianAgent();
    agent.executeStrategy("2").catch(console.error);
} 