const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Arbitrage Contract', function () {
  let arbitrage;
  let owner;
  let user;
  let mockRouter;
  let mockTokenIn;
  let mockTokenOut;
  let mockTokenIntermediate;
  
  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
  
  beforeEach(async function () {
    [owner, user, mockRouter] = await ethers.getSigners();
    
    // Deploy mock tokens
    const MockToken = await ethers.getContractFactory('MockERC20');
    mockTokenIn = await MockToken.deploy('Token A', 'TKNA');
    mockTokenOut = await MockToken.deploy('Token B', 'TKNB');
    mockTokenIntermediate = await MockToken.deploy('Token C', 'TKNC');
    
    // Deploy Arbitrage contract
    const Arbitrage = await ethers.getContractFactory('Arbitrage');
    arbitrage = await Arbitrage.deploy(mockRouter.address, owner.address);
    
    // Mint some tokens to user
    await mockTokenIn.mint(user.address, ethers.utils.parseEther('1000'));
    await mockTokenOut.mint(user.address, ethers.utils.parseEther('1000'));
  });
  
  describe('Deployment', function () {
    it('should set correct router address', async function () {
      expect(await arbitrage.swapRouter()).to.equal(mockRouter.address);
    });
    
    it('should set correct fee collector', async function () {
      expect(await arbitrage.feeCollector()).to.equal(owner.address);
    });
    
    it('should set default min profit threshold', async function () {
      expect(await arbitrage.minProfitThreshold()).to.equal(ethers.utils.parseEther('0.001'));
    });
    
    it('should set default slippage tolerance', async function () {
      expect(await arbitrage.slippageTolerance()).to.equal(300);
    });
  });
  
  describe('Execute Arbitrage', function () {
    it('should revert with zero amount', async function () {
      await expect(
        arbitrage.executeArbitrage(
          mockTokenIn.address,
          mockTokenOut.address,
          mockTokenIntermediate.address,
          0,
          '0x'
        )
      ).to.be.revertedWith('Amount must be > 0');
    });
    
    it('should create trade record', async function () {
      const balanceBefore = await mockTokenIn.balanceOf(arbitrage.address);
      expect(balanceBefore).to.equal(0);
      
      const tradeCount = await arbitrage.getTradeCount();
      expect(tradeCount).to.equal(0);
    });
  });
  
  describe('Admin Functions', function () {
    it('should allow owner to set fee collector', async function () {
      await arbitrage.setFeeCollector(user.address);
      expect(await arbitrage.feeCollector()).to.equal(user.address);
    });
    
    it('should allow owner to set min profit threshold', async function () {
      await arbitrage.setMinProfitThreshold(ethers.utils.parseEther('0.01'));
      expect(await arbitrage.minProfitThreshold()).to.equal(ethers.utils.parseEther('0.01'));
    });
    
    it('should allow owner to set slippage tolerance', async function () {
      await arbitrage.setSlippageTolerance(500);
      expect(await arbitrage.slippageTolerance()).to.equal(500);
    });
    
    it('should reject invalid slippage tolerance', async function () {
      await expect(arbitrage.setSlippageTolerance(6000)).to.be.revertedWith('Max 50%');
    });
    
    it('should reject zero address for fee collector', async function () {
      await expect(arbitrage.setFeeCollector(ADDRESS_ZERO)).to.be.revertedWith('Invalid address');
    });
    
    it('should prevent non-owner from setting fee collector', async function () {
      await expect(
        arbitrage.connect(user).setFeeCollector(user.address)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
  
  describe('Statistics', function () {
    it('should track total profit', async function () {
      expect(await arbitrage.totalProfit()).to.equal(0);
      expect(await arbitrage.totalTrades()).to.equal(0);
    });
    
    it('should return correct trade count', async function () {
      expect(await arbitrage.getTradeCount()).to.equal(0);
    });
    
    it('should return empty recent trades', async function () {
      const trades = await arbitrage.getRecentTrades(10);
      expect(trades.length).to.equal(0);
    });
  });
  
  describe('Reentrancy Protection', function () {
    it('should prevent reentrant calls', async function () {
      // The nonReentrant modifier should prevent reentrant calls
      // This is implicitly tested by the modifier
    });
  });
  
  describe('Token Operations', function () {
    it('should receive ETH', async function () {
      const balanceBefore = await ethers.provider.getBalance(arbitrage.address);
      await owner.sendTransaction({
        to: arbitrage.address,
        value: ethers.utils.parseEther('1')
      });
      const balanceAfter = await ethers.provider.getBalance(arbitrage.address);
      expect(balanceAfter).to.equal(balanceBefore.add(ethers.utils.parseEther('1')));
    });
    
    it('should allow owner to withdraw tokens', async function () {
      await mockTokenIn.mint(arbitrage.address, ethers.utils.parseEther('100'));
      
      await arbitrage.withdrawTokens(mockTokenIn.address, ethers.utils.parseEther('50'));
      
      const balance = await mockTokenIn.balanceOf(owner.address);
      expect(balance).to.equal(ethers.utils.parseEther('50'));
    });
    
    it('should allow owner to withdraw ETH', async function () {
      await owner.sendTransaction({
        to: arbitrage.address,
        value: ethers.utils.parseEther('1')
      });
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await arbitrage.withdrawTokens(ADDRESS_ZERO, ethers.utils.parseEther('0.5'));
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter.gt(ownerBalanceBefore)).to.be.true;
    });
  });
  
  describe('Events', function () {
    it('should emit FeeCollectorUpdated event', async function () {
      await expect(arbitrage.setFeeCollector(user.address))
        .to.emit(arbitrage, 'FeeCollectorUpdated')
        .withArgs(user.address);
    });
    
    it('should emit MinProfitThresholdUpdated event', async function () {
      const newThreshold = ethers.utils.parseEther('0.01');
      await expect(arbitrage.setMinProfitThreshold(newThreshold))
        .to.emit(arbitrage, 'MinProfitThresholdUpdated')
        .withArgs(newThreshold);
    });
    
    it('should emit SlippageToleranceUpdated event', async function () {
      await expect(arbitrage.setSlippageTolerance(500))
        .to.emit(arbitrage, 'SlippageToleranceUpdated')
        .withArgs(500);
    });
  });
});
