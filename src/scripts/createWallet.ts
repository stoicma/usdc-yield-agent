import { ethers } from 'ethers';

function createNewWallet() {
    console.log('Creating new wallet...');
    const wallet = ethers.Wallet.createRandom();
    console.log('Address:', wallet.address);
    console.log('Private Key:', wallet.privateKey);
    console.log('\nIMPORTANT: Save these somewhere safe!');
    console.log('Add them to your .env file as:');
    console.log(`WALLET_ADDRESS=${wallet.address}`);
    console.log(`WALLET_PRIVATE_KEY=${wallet.privateKey}`);
}

createNewWallet(); 