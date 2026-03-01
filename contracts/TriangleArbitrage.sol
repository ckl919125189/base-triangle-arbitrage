// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TriangleArbitrage
 * @dev Base 链三角套利合约 - 闪电贷版本
 * 
 * 路由: USDT → ETH → WBTC → USDT
 * 
 * 工作原理:
 * 1. 通过 Aave V3 闪电贷借出 USDT
 * 2. 在 DEX 1: USDT 兑换 ETH
 * 3. 在 DEX 2: ETH 兑换 WBTC
 * 4. 在 DEX 3: WBTC 兑换 USDT
 * 5. 归还闪电贷 + 手续费
 * 6. 赚取差额利润
 */
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IUniswapV3Router {
    function exactInputSingle(
        bytes memory path,
        address recipient,
        uint256 deadline,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint160 sqrtPriceLimitX96
    ) external payable returns (uint256 amountOut);
}

interface IAavePool {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

contract TriangleArbitrage is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ 配置 ============
    address public owner;
    
    // 代币地址 (Base Mainnet)
    address public constant USDT = 0x4e5aF12fE1a6f1E1a3aF1c2E3D4F5A6B7C8D9E0; // 替换为真实地址
    address public constant WETH = 0x4200000000000000000000000000000000000006;
    address public constant WBTC = 0x47aB3bCD6f2A2E7b6cF3eD4E5F6A7B8C9D0E1F2; // 替换为真实地址
    
    // Aave Pool (Base Mainnet)
    address public constant AAVE_POOL = 0xA238Dd80C259a72e81d7e9314Ae79880607cE185;
    
    // DEX Router (Uniswap V3)
    address public constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;

    // 回调地址（自己）
    address public immutable CALLBACK;
    
    // 手续费 (0.09% for flash loan)
    uint256 public constant FLASH_LOAN_FEE = 9e14; // 0.0009 = 0.09%
    
    // 最小利润阈值 (防止Dust攻击)
    uint256 public constant MIN_PROFIT = 1e6; // 1 USDT
    
    // 事件
    event ArbitrageExecuted(
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit,
        uint256 timestamp
    );
    event ArbitrageFailed(string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        CALLBACK = address(this);
    }

    /**
     * @dev 执行三角套利
     * @param amount 闪电贷金额
     */
    function execute(uint256 amount) external onlyOwner nonReentrant {
        // 1. 发起闪电贷
        address[] memory assets = new address[](1);
        assets[0] = USDT;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0; // 不需要保持负债
        
        // 编码参数
        bytes memory params = abi.encode(amount);
        
        // 调用闪电贷
        IAavePool(AAVE_POOL).flashLoan(
            CALLBACK,
            assets,
            amounts,
            modes,
            address(0),
            params,
            0
        );
    }

    /**
     * @dev 闪电贷回调函数
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external nonReentrant returns (bool) {
        require(msg.sender == AAVE_POOL, "Only Aave");
        require(initiator == address(this), "Only self");
        
        uint256 amount = amounts[0];
        uint256 fee = premiums[0];
        
        // 解码参数
        // params 不需要，这里保留兼容性
        
        // 2. 授权 USDT
        IERC20(USDT).forceApprove(AAVE_POOL, amount + fee);
        
        // 3. 执行三角套利交易
        uint256 profit = _executeTriangle(amount);
        
        // 4. 检查利润
        if (profit > MIN_PROFIT) {
            // 转出利润到 owner
            IERC20(USDT).safeTransfer(owner, profit);
            
            emit ArbitrageExecuted(amount, amount + fee + profit, profit, block.timestamp);
        } else {
            emit ArbitrageFailed("Profit too low");
        }
        
        // 5. 归还闪电贷 + 费用（已经授权）
        // 剩余的 USDT 会被保留
        
        return true;
    }

    /**
     * @dev 三角套利核心逻辑
     * @param amount 输入金额 (USDT)
     * @return profit 利润
     */
    function _executeTriangle(uint256 amount) internal returns (uint256) {
        // 步骤 1: USDT -> ETH (通过 Uniswap V3)
        IERC20(USDT).forceApprove(UNISWAP_ROUTER, amount);
        
        uint256 ethAmount = _swap(
            USDT,
            WETH,
            amount,
            1 // 最小输出设为1，防止失败
        );
        
        // 步骤 2: ETH -> WBTC
        IERC20(WETH).forceApprove(UNISWAP_ROUTER, ethAmount);
        
        uint256 wbtcAmount = _swap(
            WETH,
            WBTC,
            ethAmount,
            1
        );
        
        // 步骤 3: WBTC -> USDT
        IERC20(WBTC).forceApprove(UNISWAP_ROUTER, wbtcAmount);
        
        uint256 usdtAmount = _swap(
            WBTC,
            USDT,
            wbtcAmount,
            amount + 10 // 最小输出要覆盖成本
        );
        
        // 计算利润
        uint256 profit = usdtAmount - amount;
        
        return profit;
    }

    /**
     * @dev 简单 swap (使用 Uniswap V3)
     */
    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMinimum
    ) internal returns (uint256) {
        // 简化版本：实际需要 encodePath
        // 实际部署需要根据路由选择最佳 DEX
        
        // 这里需要根据具体 DEX 实现
        // 示例使用 Uniswap V3:
        
        bytes memory path = abi.encodePacked(
            tokenIn,
            uint24(3000), // fee tier
            tokenOut
        );
        
        return IUniswapV3Router(UNISWAP_ROUTER).exactInputSingle(
            path,
            address(this),
            block.timestamp + 300,
            amountIn,
            amountOutMinimum,
            0
        );
    }

    /**
     * @dev 紧急提款
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner, balance);
    }

    /**
     * @dev 回收 ETH
     */
    receive() external payable {}
}
