import axios from 'axios';

async function fetchUSDCYields() {
    try {
        console.log('Fetching yields from DeFi Llama...');
        const response = await axios.get('https://yields.llama.fi/pools');
        
        // Add timestamp to see data freshness
        console.log('Data timestamp:', new Date().toISOString());
        
        const lendingPools = response.data.data.filter((pool: any) => {
            return (
                (pool?.symbol === 'USDC') &&
                pool.tvlUsd >= 5000000 &&
                // Lower max APY to be more realistic
                pool.apy <= 10 &&
                pool.ilRisk === 'no'
            );
        });

        const lpPools = response.data.data.filter((pool: any) => {
            return (
                // Must involve USDC
                (pool?.symbol?.includes('USDC')) &&
                // Minimum $2M TVL
                pool.tvlUsd >= 2000000 &&
                // Max 50% APY for LPs
                pool.apy <= 50 &&
                // Must be LP (has IL risk)
                pool.ilRisk === 'yes' &&
                // Only major pairs
                (pool.symbol.includes('ETH') || 
                 pool.symbol.includes('BTC') ||
                 pool.symbol.includes('USDT') ||
                 pool.symbol.includes('DAI'))
            );
        });

        // Sort both by APY
        const sortedLending = lendingPools.sort((a: any, b: any) => b.apy - a.apy);
        const sortedLPs = lpPools.sort((a: any, b: any) => b.apy - a.apy);

        // Add base vs reward APY breakdown
        const formatPools = (pools: any[]) => pools.slice(0, 5).map((pool: any) => ({
            protocol: pool.project,
            chain: pool.chain,
            apy: pool.apy.toFixed(2) + '%',
            baseApy: (pool.apyBase || 0).toFixed(2) + '%',
            rewardApy: (pool.apyReward || 0).toFixed(2) + '%',
            tvl: '$' + (pool.tvlUsd/1000000).toFixed(2) + 'M',
            symbol: pool.symbol
        }));

        console.log('\nTop 5 USDC Lending Opportunities:');
        console.table(formatPools(sortedLending));

        console.log('\nTop 5 USDC LP Opportunities:');
        console.table(formatPools(sortedLPs));

    } catch (error) {
        console.error('Error fetching yields:', error);
        throw error;
    }
}

console.log('Starting yield search...');
fetchUSDCYields().catch(console.error); 