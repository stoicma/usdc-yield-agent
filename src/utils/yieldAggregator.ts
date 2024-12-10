import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

interface RawPoolData {
    project: string;
    chain: string;
    symbol: string;
    tvlUsd: number;
    apy: number;
}

interface YieldData {
    protocol: string;
    chain: string;
    apy: string;
    tvl: string;
    symbol: string;
    source: string;
    utilization: string;
    riskCategory: 'Safe' | 'Moderate' | 'Aggressive';
    estimatedGasCosts: string;
    breakEvenDays: string;
}

interface GasCosts {
    deposit: number;
    withdraw: number;
    bridge?: number;  // Optional bridge cost for L2s
}

interface L2GasCosts extends GasCosts {
    bridge: number;  // Required for L2s
}

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

if (!ETHERSCAN_API_KEY) {
    throw new Error('ETHERSCAN_API_KEY not found in environment variables');
}

const GAS_ESTIMATES: Record<string, GasCosts | L2GasCosts> = {
    ethereum: {
        deposit: 220000,  // Gas units
        withdraw: 250000
    },
    arbitrum: {
        deposit: 1.5,    // Direct USD cost
        withdraw: 1.5,
        bridge: 15       // L1 to L2 bridge cost
    },
    optimism: {
        deposit: 0.5,
        withdraw: 0.5,
        bridge: 15
    },
    base: {
        deposit: 0.3,
        withdraw: 0.3,
        bridge: 12
    },
    polygon: {
        deposit: 0.1,
        withdraw: 0.1,
        bridge: 10
    },
    scroll: {
        deposit: 0.5,
        withdraw: 0.5,
        bridge: 12
    }
};

let lastSuccessfulGasPrice: number | null = null;
let lastSuccessfulEthPrice: number | null = null;

interface GasCostResult {
    costs: GasCosts;
    warning?: string;
}

async function getEthereumGasCosts(protocol: string): Promise<GasCostResult> {
    try {
        const gasResponse = await axios.get(
            `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${ETHERSCAN_API_KEY}`
        );
        
        if (gasResponse.data.status !== '1' || !gasResponse.data.result) {
            throw new Error('Failed to fetch gas price from Etherscan');
        }

        const gasPriceGwei = Number(gasResponse.data.result.SafeGasPrice);
        
        const priceResponse = await axios.get(
            `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${ETHERSCAN_API_KEY}`
        );

        if (priceResponse.data.status !== '1' || !priceResponse.data.result) {
            throw new Error('Failed to fetch ETH price from Etherscan');
        }

        const ethPrice = Number(priceResponse.data.result.ethusd);
        console.log(`Current ETH price: $${ethPrice}, Gas price: ${gasPriceGwei} Gwei`);

        lastSuccessfulGasPrice = gasPriceGwei;
        lastSuccessfulEthPrice = ethPrice;

        const gasUnits = GAS_ESTIMATES.ethereum;
        return {
            costs: {
                deposit: (gasUnits.deposit * gasPriceGwei * ethPrice) / 1e9,
                withdraw: (gasUnits.withdraw * gasPriceGwei * ethPrice) / 1e9
            }
        };
    } catch (error) {
        console.error('Error fetching gas costs:', error);
        if (lastSuccessfulGasPrice && lastSuccessfulEthPrice) {
            const gasUnits = GAS_ESTIMATES.ethereum;
            const costs = {
                deposit: (gasUnits.deposit * lastSuccessfulGasPrice * lastSuccessfulEthPrice) / 1e9,
                withdraw: (gasUnits.withdraw * lastSuccessfulGasPrice * lastSuccessfulEthPrice) / 1e9
            };
            return {
                costs,
                warning: `Using last successful gas price (${lastSuccessfulGasPrice} Gwei) and ETH price ($${lastSuccessfulEthPrice})`
            };
        }
        return {
            costs: { deposit: 10, withdraw: 10 },
            warning: 'Using fallback values due to API error'
        };
    }
}

async function getYieldData(): Promise<YieldData[]> {
    try {
        console.log('Fetching yield data via DeFi Llama...');
        
        const response = await axios.get('https://yields.llama.fi/pools');
        const pools = response.data?.data as RawPoolData[];

        if (!Array.isArray(pools)) {
            console.error('Expected array of pools, got:', typeof pools);
            return [];
        }

        const filteredPools = pools.filter((pool: RawPoolData) => {
            const isUSDC = pool.symbol?.toUpperCase() === 'USDC';
            const isLargePool = Number(pool.tvlUsd) > 1000000;
            const isRelevantProtocol = [
                'aave-v3',
                'compound-v3',
                'gearbox'
            ].includes(pool.project?.toLowerCase());

            return isUSDC && isLargePool && isRelevantProtocol;
        });

        const yieldData = await Promise.all(filteredPools.map(async (pool: RawPoolData): Promise<YieldData> => {
            const chain = pool.chain.toLowerCase();
            let gasCosts: GasCosts = { deposit: 0, withdraw: 0 };
            let gasString: string;
            
            if (chain === 'ethereum') {
                const result = await getEthereumGasCosts(pool.project);
                gasCosts = result.costs;
                gasString = `Deposit: $${gasCosts.deposit.toFixed(2)}, Withdraw: $${gasCosts.withdraw.toFixed(2)}`;
                if (result.warning) {
                    gasString += ` (⚠️ ${result.warning})`;
                }
            } else {
                const l2Costs = GAS_ESTIMATES[chain] as L2GasCosts;
                if (l2Costs) {
                    gasString = `Deposit: $${l2Costs.deposit}, Withdraw: $${l2Costs.withdraw}, Bridge: $${l2Costs.bridge}`;
                    gasCosts = l2Costs;
                } else {
                    gasString = 'Costs not available';
                }
            }

            const totalGasCost = chain === 'ethereum' 
                ? gasCosts.deposit + gasCosts.withdraw
                : (gasCosts as L2GasCosts).bridge 
                    ? gasCosts.deposit + gasCosts.withdraw + (gasCosts as L2GasCosts).bridge 
                    : gasCosts.deposit + gasCosts.withdraw;

            return {
                protocol: pool.project.toUpperCase(),
                chain: pool.chain?.charAt(0).toUpperCase() + pool.chain?.slice(1) || 'Unknown',
                apy: (pool.apy || 0).toFixed(2) + '%',
                tvl: '$' + (Number(pool.tvlUsd) / 1000000).toFixed(2) + 'M',
                symbol: 'USDC',
                source: 'DeFi Llama',
                utilization: 'N/A',
                riskCategory: Number(pool.tvlUsd) > 100000000 ? 'Safe' 
                           : Number(pool.tvlUsd) > 10000000 ? 'Moderate'
                           : 'Aggressive',
                estimatedGasCosts: gasString,
                breakEvenDays: `${calculateBreakEvenDays(pool.apy, 10000, totalGasCost)} days`
            };
        }));

        // Sort by APY within each risk category
        const safePools = yieldData
            .filter((p: YieldData) => p.riskCategory === 'Safe')
            .sort((a: YieldData, b: YieldData) => parseFloat(b.apy) - parseFloat(a.apy));
            
        const moderatePools = yieldData
            .filter((p: YieldData) => p.riskCategory === 'Moderate')
            .sort((a: YieldData, b: YieldData) => parseFloat(b.apy) - parseFloat(a.apy));
            
        const aggressivePools = yieldData
            .filter((p: YieldData) => p.riskCategory === 'Aggressive')
            .sort((a: YieldData, b: YieldData) => parseFloat(b.apy) - parseFloat(a.apy));

        console.log('\nUSDC Lending Pools by Risk Category:');
        console.log('\nSafe Pools (>$100M TVL) - Suggested: 80% allocation');
        console.table(safePools);
        
        console.log('\nModerate Pools (>$10M TVL) - Suggested: 15% allocation');
        console.table(moderatePools);
        
        console.log('\nAggressive Pools (>$1M TVL) - Suggested: 5% allocation');
        console.table(aggressivePools);

        return yieldData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function calculateBreakEvenDays(apy: number, amount: number, totalGasCost: number): number {
    const dailyYield = (amount * (apy / 100)) / 365;
    return Math.ceil(totalGasCost / dailyYield);
}

console.log('Starting yield aggregator...');

async function main() {
    try {
        const data = await getYieldData();
        
        // Sort and display by risk category
        const safePools = data.filter(p => p.riskCategory === 'Safe');
        const moderatePools = data.filter(p => p.riskCategory === 'Moderate');
        const aggressivePools = data.filter(p => p.riskCategory === 'Aggressive');

        console.log('\nUSDC Lending Pools by Risk Category:');
        
        console.log('\nSafe Pools (>$100M TVL) - Suggested: 80% allocation');
        console.table(safePools);
        
        console.log('\nModerate Pools (>$10M TVL) - Suggested: 15% allocation');
        console.table(moderatePools);
        
        console.log('\nAggressive Pools (>$1M TVL) - Suggested: 5% allocation');
        console.table(aggressivePools);
    } catch (error) {
        console.error('Error in main:', error);
    }
}

main();

export { getYieldData }; 