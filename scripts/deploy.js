const { ethers } = require('hardhat');
const config = require('../config');

async function main() {
  console.log('Deploying Arbitrage contract...');
  
  const [deployer] = await ethers.getSigners();
  console.log('Deployer:', deployer.address);
  console.log('Balance:', (await deployer.getBalance()).toString());
  
  // Get router address from config
  const routerAddress = config.swapRouter;
  const feeCollector = config.feeCollector || deployer.address;
  
  console.log('Router:', routerAddress);
  console.log('Fee Collector:', feeCollector);
  
  const Arbitrage = await ethers.getContractFactory('Arbitrage');
  
  const arbitrage = await Arbitrage.deploy(routerAddress, feeCollector);
  
  await arbitrage.deployed();
  
  console.log('Arbitrage deployed to:', arbitrage.address);
  
  // Verify contract on Blockscout
  if (network.name !== 'hardhat' && network.name !== 'localhost') {
    console.log('Waiting for block confirmation...');
    await arbitrage.deployTransaction.wait(5);
    
    try {
      await run('verify:verify', {
        address: arbitrage.address,
        constructorArguments: [routerAddress, feeCollector],
      });
      console.log('Contract verified');
    } catch (e) {
      console.log('Verification failed:', e.message);
    }
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: arbitrage.address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  
  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('Deployment saved to:', deploymentFile);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
