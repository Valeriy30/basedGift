// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GiftEscrow is ReentrancyGuard, Ownable, ERC721Holder {
    using SafeERC20 for IERC20; 

    struct Gift {
        address sender;
        address tokenAddress;
        uint256 amountOrTokenId;
        bool isNFT;
        bool claimed;
        uint256 createdAt;
    }

    mapping(bytes32 => Gift) public gifts;

    event GiftCreated(bytes32 indexed giftId, address indexed sender, address tokenAddress, uint256 amountOrTokenId, bool isNFT);
    event GiftClaimed(bytes32 indexed giftId, address indexed recipient);
    event GiftRefunded(bytes32 indexed giftId, address indexed sender);

    constructor() Ownable(msg.sender) {}

    function createUSDCGift(bytes32 giftId, address usdcAddress, uint256 amount) external nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(amount > 0, "Amount must be greater than 0");
        require(usdcAddress != address(0), "Invalid token address");

        // Use safeTransferFrom instead of regular transferFrom
        IERC20(usdcAddress).safeTransferFrom(msg.sender, address(this), amount);

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: usdcAddress,
            amountOrTokenId: amount,
            isNFT: false,
            claimed: false,
            createdAt: block.timestamp
        });

        emit GiftCreated(giftId, msg.sender, usdcAddress, amount, false);
    }

    /**
     * @dev Create a gift with native ETH
     * @param giftId Unique gift identifier
     */
    function createETHGift(bytes32 giftId) external payable nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(msg.value > 0, "Amount must be greater than 0");

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: address(0), // address(0) indicates ETH
            amountOrTokenId: msg.value,
            isNFT: false,
            claimed: false,
            createdAt: block.timestamp
        });

        emit GiftCreated(giftId, msg.sender, address(0), msg.value, false);
    }

    function createNFTGift(bytes32 giftId, address nftAddress, uint256 tokenId) external nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(nftAddress != address(0), "Invalid NFT address");

        // Contract can now safely receive NFTs thanks to ERC721Holder
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: nftAddress,
            amountOrTokenId: tokenId,
            isNFT: true,
            claimed: false,
            createdAt: block.timestamp
        });

        emit GiftCreated(giftId, msg.sender, nftAddress, tokenId, true);
    }

    function claimGift(bytes32 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");

        gift.claimed = true;

        if (gift.isNFT) {
            IERC721(gift.tokenAddress).safeTransferFrom(address(this), msg.sender, gift.amountOrTokenId);
        } else {
            // Check if it's ETH (address(0)) or ERC20 token
            if (gift.tokenAddress == address(0)) {
                // Transfer ETH
                (bool success, ) = msg.sender.call{value: gift.amountOrTokenId}("");
                require(success, "ETH transfer failed");
            } else {
                // Transfer ERC20 token
                IERC20(gift.tokenAddress).safeTransfer(msg.sender, gift.amountOrTokenId);
            }
        }

        emit GiftClaimed(giftId, msg.sender);
    }

    /**
     * @dev Refund gift to sender (if not claimed yet)
     * @param giftId Gift ID
     */
    function refundGift(bytes32 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        
        require(gift.sender == msg.sender, "Only sender can refund");
        require(!gift.claimed, "Gift already claimed");

        // Mark as claimed (to prevent double refund)
        gift.claimed = true;

        // Refund to sender
        if (gift.isNFT) {
            IERC721(gift.tokenAddress).transferFrom(
                address(this),
                msg.sender,
                gift.amountOrTokenId
            );
        } else {
            // Check if it's ETH or ERC20
            if (gift.tokenAddress == address(0)) {
                (bool success, ) = msg.sender.call{value: gift.amountOrTokenId}("");
                require(success, "ETH refund failed");
            } else {
                IERC20(gift.tokenAddress).safeTransfer(msg.sender, gift.amountOrTokenId);
            }
        }

        emit GiftRefunded(giftId, msg.sender);
    }

    /**
     * @dev Check gift existence and status
     * @param giftId Gift ID
     */
    function getGiftInfo(bytes32 giftId) 
        external 
        view 
        returns (
            address sender,
            address tokenAddress,
            uint256 amountOrTokenId,
            bool isNFT,
            bool claimed,
            uint256 createdAt
        ) 
    {
        Gift memory gift = gifts[giftId];
        return (
            gift.sender,
            gift.tokenAddress,
            gift.amountOrTokenId,
            gift.isNFT,
            gift.claimed,
            gift.createdAt
        );
    }
}

