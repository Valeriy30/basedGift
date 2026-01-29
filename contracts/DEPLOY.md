# Деплой и интеграция Escrow контракта

## Шаг 1: Подготовка окружения

### Установка Foundry (рекомендуемый способ)

```bash
# Установка Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Инициализация Foundry проекта в папке contracts
cd contracts
forge init --no-git
```

### Или используйте Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

## Шаг 2: Установка зависимостей

### Для Foundry

```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### Для Hardhat

```bash
npm install @openzeppelin/contracts
```

## Шаг 3: Настройка конфигурации

### Foundry (foundry.toml)

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"

[rpc_endpoints]
base = "https://mainnet.base.org"
base_sepolia = "https://sepolia.base.org"

[etherscan]
base = { key = "${BASESCAN_API_KEY}" }
```

### Hardhat (hardhat.config.js)

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 84532,
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      base: process.env.BASESCAN_API_KEY,
    },
  },
};
```

## Шаг 4: Деплой контракта

### Используя Foundry

```bash
# Деплой на Base Sepolia (testnet)
forge create --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY \
  --verify \
  src/GiftEscrow.sol:GiftEscrow

# Деплой на Base Mainnet
forge create --rpc-url base \
  --private-key $PRIVATE_KEY \
  --verify \
  src/GiftEscrow.sol:GiftEscrow
```

### Используя Hardhat

```javascript
// scripts/deploy.js
async function main() {
  const GiftEscrow = await ethers.getContractFactory("GiftEscrow");
  const escrow = await GiftEscrow.deploy();
  await escrow.deployed();
  
  console.log("GiftEscrow deployed to:", escrow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

## Шаг 5: Интеграция с фронтендом

### Обновите `client/src/lib/wagmi.ts`

```typescript
// Добавьте адрес контракта
export const ESCROW_CONTRACT_ADDRESS = {
  [base.id]: '0xYourMainnetContractAddress',
  [baseSepolia.id]: '0xYourSepoliaContractAddress',
} as const;

// Добавьте ABI контракта
export const ESCROW_ABI = [
  {
    inputs: [
      { name: 'giftId', type: 'bytes32' },
      { name: 'usdcAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'createUSDCGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'giftId', type: 'bytes32' }],
    name: 'claimGift',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ... остальные функции
] as const;
```

### Создайте хук `client/src/hooks/use-escrow.ts`

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, stringToHex, padHex } from 'viem';
import { ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, USDC_ADDRESS, BASE_CHAIN_ID } from '@/lib/wagmi';

export function useCreateUSDCGift() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createGift = async (giftId: string, amount: string) => {
    // Конвертируем giftId в bytes32
    const giftIdBytes = padHex(stringToHex(giftId), { size: 32 });
    const amountWei = parseUnits(amount, 6); // USDC имеет 6 decimals

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID],
      abi: ESCROW_ABI,
      functionName: 'createUSDCGift',
      args: [giftIdBytes, USDC_ADDRESS[BASE_CHAIN_ID], amountWei],
      chainId: BASE_CHAIN_ID,
    });
  };

  return {
    createGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimGift() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimGift = async (giftId: string) => {
    const giftIdBytes = padHex(stringToHex(giftId), { size: 32 });

    writeContract({
      address: ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID],
      abi: ESCROW_ABI,
      functionName: 'claimGift',
      args: [giftIdBytes],
      chainId: BASE_CHAIN_ID,
    });
  };

  return {
    claimGift,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}
```

### Обновите `CreateGift.tsx`

```typescript
import { useCreateUSDCGift } from '@/hooks/use-escrow';
import { useApproveUSDC } from '@/hooks/use-usdc';

export default function CreateGift() {
  const { approve, isPending: isApproving } = useApproveUSDC();
  const { createGift, isPending: isCreating } = useCreateUSDCGift();

  const handleSubmit = async () => {
    try {
      // 1. Approve USDC для контракта escrow
      await approve(ESCROW_CONTRACT_ADDRESS[BASE_CHAIN_ID], formData.amount);
      
      // 2. Создать подарок в контракте
      await createGift(newGiftId, formData.amount);
      
      // 3. Сохранить в базу данных
      await createGiftMutation.mutateAsync({
        id: newGiftId,
        senderAddress: address,
        tokenType: 'USDC',
        amount: formData.amount,
        // ... остальные поля
      });
    } catch (error) {
      console.error('Error creating gift:', error);
    }
  };
}
```

### Обновите `ClaimGift.tsx`

```typescript
import { useClaimGift } from '@/hooks/use-escrow';

export default function ClaimGift() {
  const { claimGift, isPending, isSuccess, hash } = useClaimGift();

  const handleClaim = async () => {
    try {
      // 1. Вызвать claimGift из контракта
      await claimGift(gift.id);
      
      // 2. Обновить статус в базе данных
      await claimGiftMutation.mutateAsync({
        id: gift.id,
        receiverAddress: address,
        claimTxHash: hash,
      });
      
      toast({ title: 'Gift claimed successfully!' });
    } catch (error) {
      console.error('Error claiming gift:', error);
    }
  };
}
```

## Шаг 6: Тестирование

### Получите testnet токены

1. **Base Sepolia ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. **Base Sepolia USDC**: Свопните ETH на USDC через Uniswap или используйте faucet

### Проверьте контракт

```bash
# Используя cast (Foundry)
cast call $CONTRACT_ADDRESS "getGiftInfo(bytes32)" $GIFT_ID --rpc-url base_sepolia
```

## Шаг 7: Верификация контракта

```bash
# Foundry
forge verify-contract \
  --chain-id 84532 \
  --compiler-version 0.8.20 \
  $CONTRACT_ADDRESS \
  src/GiftEscrow.sol:GiftEscrow \
  --etherscan-api-key $BASESCAN_API_KEY

# Hardhat
npx hardhat verify --network baseSepolia $CONTRACT_ADDRESS
```

## Важные замечания

1. **Approve перед созданием подарка**: Пользователь должен сначала approve USDC для escrow контракта
2. **Gas оптимизация**: Рассмотрите использование batch операций для экономии gas
3. **Security**: Проведите аудит контракта перед деплоем в mainnet
4. **Events**: Используйте события для отслеживания транзакций
5. **Error handling**: Добавьте понятные сообщения об ошибках для пользователей

## Полезные ссылки

- [Base Docs](https://docs.base.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Base Explorer](https://basescan.org/)
