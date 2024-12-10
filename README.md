# USDC Yield Aggregator (Sepolia Testnet)

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
- Currently configured for Sepolia testnet

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your API keys
4. Run the agent: `npm start`

## Environment Variables
Required in `.env`:
- BRIAN_API_KEY - Brian AI API key
- OPENAI_API_KEY - OpenAI API key for AI operations
- ETHERSCAN_API_KEY - Etherscan API for gas calculations
- ALCHEMY_API_KEY - Alchemy API for Sepolia interactions
- WALLET_ADDRESS - Your Sepolia testnet wallet address
- AGENT_PRIVATE_KEY - Your Sepolia testnet wallet private key
- SEPOLIA_RPC_URL - Sepolia testnet RPC URL (Alchemy)

## Testing
Tests are located in `src/tests/`
Run tests with: `npm test`

## Security
- No sensitive data is stored in the codebase
- All API keys and private keys must be provided via environment variables
- Uses DeFi Llama's public API and authenticated services (Etherscan, Alchemy)
- Currently configured for Sepolia testnet only - do not use with mainnet keys