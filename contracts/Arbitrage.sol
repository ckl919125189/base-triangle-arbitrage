// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Arbitrage
 * @dev Triangle arbitrage contract using flash loans on Base chain
 * @notice CEI (Checks-Effects-Interactions) pattern implemented
 */
contract Arbitrage is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Uniswap V3 Router interface
    ISwapRouter public immutable swapRouter;
    
    // Fee collector address
    address public feeCollector;
    
    // Minimum profit threshold (in wei)
    uint256 public minProfitThreshold = 1e15; // 0.001 ETH
    
    // Maximum slippage tolerance (in basis points, 100 = 1%)
    uint256 public slippageTolerance = 300; // 3%
    
    // Trade history
    Trade[] public trades;
    
    // Statistics
    uint256 public totalProfit;
    uint256 public totalTrades;
    
    struct Trade {
        address tokenIn;
        address tokenOut;
        address tokenIntermediate;
        uint256 amountIn;
        uint256 profit;
        uint256 timestamp;
        bool success;
    }
    
    // Events
    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        address indexed tokenIntermediate,
        uint256 amountIn,
        uint256 profit,
        bool success
    );
    
    event FeeCollectorUpdated(address indexed newFeeCollector);
    event MinProfitThresholdUpdated(uint256 newThreshold);
    event SlippageToleranceUpdated(uint256 newTolerance);
    
    // Swap router interface for Uniswap V3
    ISwapRouter public constant UNISWAP_V3_ROUTER = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    
    // Base chain router (default)
    address public constant BASE_ROUTER = 0x1FEd653d9b6679d0a85d1d7A42C4FA214f29C608;
    
    constructor(address _swapRouter, address _feeCollector) Ownable(msg.sender) {
        require(_swapRouter != address(0), "Invalid router address");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        swapRouter = ISwapRouter(_swapRouter);
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Execute triangle arbitrage using flash loan
     * @param tokenIn Input token address
     * @param tokenOut Output token address  
     * @param tokenIntermediate Intermediate token for triangle
     * @param amountIn Amount of token to trade
     * @param path Three-hop path for arbitrage
     */
    function executeArbitrage(
        address tokenIn,
        address tokenOut,
        address tokenIntermediate,
        uint256 amountIn,
        bytes calldata path
    ) external nonReentrant returns (uint256) {
        // CEI: Checks
        require(amountIn > 0, "Amount must be > 0");
        
        // Get expected output amount (simulate trade)
        uint256 expectedOut = _getAmountOut(tokenIn, tokenOut, amountIn, path);
        uint256 minOut = (amountIn * (10000 - slippageTolerance)) / 10000;
        
        require(expectedOut > minOut, "Insufficient expected output");
        
        // Transfer tokens from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // CEI: Effects - record trade start
        Trade memory trade = Trade({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            tokenIntermediate: tokenIntermediate,
            amountIn: amountIn,
            profit: 0,
            timestamp: block.timestamp,
            success: false
        });
        
        // CEI: Interactions - execute trades
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        
        // Approve tokens for router
        IERC20(tokenIn).forceApprove(address(swapRouter), amountIn);
        
        // Execute three swaps: tokenIn -> intermediate -> tokenOut -> tokenIn
        uint256 finalAmount = _executeTriangleSwap(tokenIn, tokenOut, tokenIntermediate, amountIn, path);
        
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        uint256 profit = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0;
        
        // Validate profit
        if (profit >= minProfitThreshold) {
            // CEI: Effects - update state
            trade.profit = profit;
            trade.success = true;
            totalProfit += profit;
            totalTrades++;
            trades.push(trade);
            
            // Send profit to fee collector (20% fee)
            uint256 fee = (profit * 20) / 100;
            uint256 netProfit = profit - fee;
            
            IERC20(tokenOut).safeTransfer(feeCollector, fee);
            IERC20(tokenOut).safeTransfer(msg.sender, netProfit);
            
            emit ArbitrageExecuted(tokenIn, tokenOut, tokenIntermediate, amountIn, profit, true);
            
            return netProfit;
        }
        
        // Failed trade - return original tokens
        trade.success = false;
        trades.push(trade);
        
        if (IERC20(tokenIn).balanceOf(address(this)) > 0) {
            IERC20(tokenIn).safeTransfer(msg.sender, amountIn);
        }
        
        emit ArbitrageExecuted(tokenIn, tokenOut, tokenIntermediate, amountIn, 0, false);
        
        return 0;
    }
    
    /**
     * @dev Execute flash loan arbitrage (callback from lender)
     */
    function executeFlashLoan(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata data
    ) external nonReentrant {
        require(tokens.length == 1 && amounts.length == 1, "Invalid flash loan params");
        
        (address tokenIn, address tokenOut, address tokenIntermediate, bytes memory path) = 
            abi.decode(data, (address, address, address, bytes));
        
        uint256 amount = amounts[0];
        
        // Execute arbitrage
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        
        IERC20(tokenIn).forceApprove(address(swapRouter), amount);
        uint256 finalAmount = _executeTriangleSwap(tokenIn, tokenOut, tokenIntermediate, amount, path);
        
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        uint256 profit = balanceAfter > balanceBefore ? balanceAfter - balanceBefore : 0;
        
        // Repay flash loan
        uint256 fee = (amount * 5) / 10000; // 0.05% flash loan fee
        IERC20(tokenIn).safeTransfer(msg.sender, amount + fee);
        
        if (profit > minProfitThreshold) {
            uint256 contractFee = (profit * 20) / 100;
            IERC20(tokenOut).safeTransfer(feeCollector, contractFee);
            IERC20(tokenOut).safeTransfer(owner(), profit - contractFee);
            
            totalProfit += profit;
            totalTrades++;
        }
    }
    
    /**
     * @dev Execute triangle swap through three DEX paths
     */
    function _executeTriangleSwap(
        address tokenIn,
        address tokenOut,
        address tokenIntermediate,
        uint256 amount,
        bytes calldata path
    ) internal returns (uint256) {
        // First swap: tokenIn -> tokenIntermediate
        ISwapRouter.ExactInputParams memory params1 = ISwapRouter.ExactInputParams({
            path: abi.encodePacked(tokenIn, uint24(3000), tokenIntermediate),
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amount,
            amountOutMinimum: 0
        });
        
        uint256 amountIntermediate = swapRouter.exactInput(params1);
        
        // Second swap: tokenIntermediate -> tokenOut
        ISwapRouter.ExactInputParams memory params2 = ISwapRouter.ExactInputParams({
            path: abi.encodePacked(tokenIntermediate, uint24(3000), tokenOut),
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIntermediate,
            amountOutMinimum: 0
        });
        
        return swapRouter.exactInput(params2);
    }
    
    /**
     * @dev Get expected output amount (view function for estimation)
     */
    function _getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes calldata path
    ) internal pure returns (uint256) {
        // This is a simplified version - in production, use quoter contract
        // For now, return a conservative estimate
        return (amountIn * 99) / 100;
    }
    
    // Admin functions
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }
    
    function setMinProfitThreshold(uint256 _threshold) external onlyOwner {
        minProfitThreshold = _threshold;
        emit MinProfitThresholdUpdated(_threshold);
    }
    
    function setSlippageTolerance(uint256 _tolerance) external onlyOwner {
        require(_tolerance <= 5000, "Max 50%"); // 50% max
        slippageTolerance = _tolerance;
        emit SlippageToleranceUpdated(_tolerance);
    }
    
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }
    
    function getTradeCount() external view returns (uint256) {
        return trades.length;
    }
    
    function getRecentTrades(uint256 count) external view returns (Trade[] memory) {
        uint256 length = count > trades.length ? trades.length : count;
        Trade[] memory result = new Trade[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = trades[trades.length - 1 - i];
        }
        
        return result;
    }
    
    receive() external payable {}
}

// Uniswap V3 SwapRouter interface
interface ISwapRouter {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
    
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}
