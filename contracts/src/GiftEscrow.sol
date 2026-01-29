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

        // Используем safeTransferFrom вместо обычного transferFrom
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

    function createNFTGift(bytes32 giftId, address nftAddress, uint256 tokenId) external nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");

        // Контракт теперь может безопасно принимать NFT благодаря ERC721Holder
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
            IERC20(gift.tokenAddress).safeTransfer(msg.sender, gift.amountOrTokenId);
        }

        emit GiftClaimed(giftId, msg.sender);
    }

    /**
     * @dev Вернуть подарок отправителю (если не был claimed)
     * @param giftId ID подарка
     */
    function refundGift(bytes32 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];
        
        require(gift.sender == msg.sender, "Only sender can refund");
        require(!gift.claimed, "Gift already claimed");

        // Отмечаем как claimed (чтобы нельзя было повторно вернуть)
        gift.claimed = true;

        // Возврат средств отправителю
        if (gift.isNFT) {
            IERC721(gift.tokenAddress).transferFrom(
                address(this),
                msg.sender,
                gift.amountOrTokenId
            );
        } else {
            require(
                IERC20(gift.tokenAddress).transfer(msg.sender, gift.amountOrTokenId),
                "USDC transfer failed"
            );
        }

        emit GiftRefunded(giftId, msg.sender);
    }

    /**
     * @dev Проверить существование и статус подарка
     * @param giftId ID подарка
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

