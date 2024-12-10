# USDC Yield Aggregator

An intelligent DeFi yield aggregator that:
- Fetches yield rates from multiple protocols (Aave, Compound, Gearbox)
- Calculates gas costs and break-even periods
- Executes optimal yield strategies via Brian API
- Supports multiple chains with bridging cost analysis
- Risk categorization (Safe, Moderate, Aggressive)

## Features
- Real-time gas cost calculations
- Multi-chain support (Ethereum, Arbitrum, Optimism, Base, Polygon, Scroll)
- Break-even analysis for different deposit amounts
- Risk categorization based on TVL
- Automated execution via Brian AI

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your API keys
4. Run the agent: `npm start`

## Environment Variables
Required in `.env`:
- BRIAN_API_KEY
- ALCHEMY_API_KEY
- ETHERSCAN_API_KEY
- WALLET_ADDRESS
- AGENT_PRIVATE_KEY

## Testing
Tests are located in `src/tests/`
Run tests with: `npm test`

## Security
- No sensitive data is stored in the codebase
- All API keys and private keys must be provided via environment variables
- Public APIs only (DeFi Llama, Etherscan)