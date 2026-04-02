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

    /// @notice Gift expiry period — 14 days after creation
    uint256 public constant GIFT_EXPIRY = 14 days;

    struct Gift {
        address sender;
        address tokenAddress;
        uint256 amountOrTokenId;
        bool isNFT;
        bool claimed;
        bool refunded;
        uint256 createdAt;
        /// @notice keccak256 of the secret known only to the recipient via the claim link.
        ///         Prevents anyone who observes the giftId on-chain from stealing the gift.
        bytes32 claimHash;
    }

    mapping(bytes32 => Gift) public gifts;

    event GiftCreated(bytes32 indexed giftId, address indexed sender, address tokenAddress, uint256 amountOrTokenId, bool isNFT);
    event GiftClaimed(bytes32 indexed giftId, address indexed recipient);
    event GiftRefunded(bytes32 indexed giftId, address indexed sender);
    event GiftExpired(bytes32 indexed giftId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a USDC gift locked with a claim secret.
     * @param giftId    Unique gift identifier (nanoid → bytes32)
     * @param usdcAddress  ERC-20 token address (USDC)
     * @param amount    Token amount (6 decimals for USDC)
     * @param claimHash keccak256 of the secret — only the holder of the secret can claim
     */
    function createUSDCGift(
        bytes32 giftId,
        address usdcAddress,
        uint256 amount,
        bytes32 claimHash
    ) external nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(amount > 0, "Amount must be greater than 0");
        require(usdcAddress != address(0), "Invalid token address");
        require(claimHash != bytes32(0), "claimHash required");

        IERC20(usdcAddress).safeTransferFrom(msg.sender, address(this), amount);

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: usdcAddress,
            amountOrTokenId: amount,
            isNFT: false,
            claimed: false,
            refunded: false,
            createdAt: block.timestamp,
            claimHash: claimHash
        });

        emit GiftCreated(giftId, msg.sender, usdcAddress, amount, false);
    }

    /**
     * @dev Create a gift with native ETH locked with a claim secret.
     * @param giftId    Unique gift identifier
     * @param claimHash keccak256 of the secret
     */
    function createETHGift(bytes32 giftId, bytes32 claimHash) external payable nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(msg.value > 0, "Amount must be greater than 0");
        require(claimHash != bytes32(0), "claimHash required");

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: address(0),
            amountOrTokenId: msg.value,
            isNFT: false,
            claimed: false,
            refunded: false,
            createdAt: block.timestamp,
            claimHash: claimHash
        });

        emit GiftCreated(giftId, msg.sender, address(0), msg.value, false);
    }

    /**
     * @dev Create an NFT gift locked with a claim secret.
     * @param giftId       Unique gift identifier
     * @param nftAddress   ERC-721 contract address
     * @param tokenId      NFT token ID
     * @param claimHash    keccak256 of the secret
     */
    function createNFTGift(
        bytes32 giftId,
        address nftAddress,
        uint256 tokenId,
        bytes32 claimHash
    ) external nonReentrant {
        require(gifts[giftId].sender == address(0), "Gift ID already exists");
        require(nftAddress != address(0), "Invalid NFT address");
        require(claimHash != bytes32(0), "claimHash required");

        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);

        gifts[giftId] = Gift({
            sender: msg.sender,
            tokenAddress: nftAddress,
            amountOrTokenId: tokenId,
            isNFT: true,
            claimed: false,
            refunded: false,
            createdAt: block.timestamp,
            claimHash: claimHash
        });

        emit GiftCreated(giftId, msg.sender, nftAddress, tokenId, true);
    }

    /**
     * @dev Claim a gift by providing the secret from the claim link.
     *      Verifies: keccak256(abi.encodePacked(secret)) == gift.claimHash
     * @param giftId  Gift ID
     * @param secret  The secret value embedded in the claim link (?s=...)
     */
    function claimGift(bytes32 giftId, bytes32 secret) external nonReentrant {
        Gift storage gift = gifts[giftId];
        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(
            keccak256(abi.encodePacked(secret)) == gift.claimHash,
            "Invalid secret"
        );
        require(
            block.timestamp < gift.createdAt + GIFT_EXPIRY,
            "Gift has expired"
        );

        gift.claimed = true;

        if (gift.isNFT) {
            IERC721(gift.tokenAddress).safeTransferFrom(address(this), msg.sender, gift.amountOrTokenId);
        } else {
            if (gift.tokenAddress == address(0)) {
                (bool success, ) = msg.sender.call{value: gift.amountOrTokenId}("");
                require(success, "ETH transfer failed");
            } else {
                IERC20(gift.tokenAddress).safeTransfer(msg.sender, gift.amountOrTokenId);
            }
        }

        emit GiftClaimed(giftId, msg.sender);
    }

    /**
     * @dev Refund gift to sender (sender-initiated, before expiry and before claim).
     * @param giftId Gift ID
     */
    function refundGift(bytes32 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];

        require(gift.sender == msg.sender, "Only sender can refund");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");

        gift.refunded = true;

        _transferToSender(gift);

        emit GiftRefunded(giftId, msg.sender);
    }

    /**
     * @dev Refund expired gift — anyone can trigger after 14 days.
     *      Funds are returned to the original sender.
     * @param giftId Gift ID
     */
    function refundExpiredGift(bytes32 giftId) external nonReentrant {
        Gift storage gift = gifts[giftId];

        require(gift.sender != address(0), "Gift does not exist");
        require(!gift.claimed, "Gift already claimed");
        require(!gift.refunded, "Gift already refunded");
        require(block.timestamp >= gift.createdAt + GIFT_EXPIRY, "Gift has not expired yet");

        gift.refunded = true;

        _transferToSender(gift);

        emit GiftExpired(giftId);
        emit GiftRefunded(giftId, gift.sender);
    }

    /**
     * @dev Internal helper — transfer gift assets back to sender.
     */
    function _transferToSender(Gift storage gift) internal {
        if (gift.isNFT) {
            IERC721(gift.tokenAddress).transferFrom(
                address(this),
                gift.sender,
                gift.amountOrTokenId
            );
        } else {
            if (gift.tokenAddress == address(0)) {
                (bool success, ) = gift.sender.call{value: gift.amountOrTokenId}("");
                require(success, "ETH refund failed");
            } else {
                IERC20(gift.tokenAddress).safeTransfer(gift.sender, gift.amountOrTokenId);
            }
        }
    }

    /**
     * @dev Read gift metadata.
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
            bool refunded,
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
            gift.refunded,
            gift.createdAt
        );
    }
}
