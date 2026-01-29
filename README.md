# 🎁 basedGift

Приложение для отправки цифровых подарков (USDC и NFT) в сети Base через уникальные ссылки.

## ✨ Особенности

- 🎨 **Красивый дизайн** с анимациями и градиентами
- 💰 **Отправка USDC** напрямую на кошелек получателя
- 🖼️ **Отправка NFT** с поддержкой ERC-721
- 🎭 **Кастомизация** с 50+ стикерами и градиентными фонами
- 🔗 **Простой UX** - просто отправьте ссылку
- ⛓️ **Base Network** - быстрые и дешевые транзакции

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL база данных (или Supabase)
- WalletConnect Project ID ([получить здесь](https://cloud.walletconnect.com/))

### Установка

1. **Клонируйте репозиторий**
```bash
git clone <your-repo-url>
cd basedGift
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**

Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

Заполните переменные в `.env`:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=development
```

4. **Настройте базу данных**
```bash
npm run db:push
```

5. **Запустите приложение**
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5000`

## 🏗️ Архитектура

### Технологический стек

**Frontend:**
- React 18 + TypeScript
- Viem + Wagmi (Web3 интеграция)
- Framer Motion (анимации)
- Tailwind CSS + Radix UI (UI компоненты)

**Backend:**
- Express.js
- PostgreSQL + Drizzle ORM
- Vite (сборка)

**Blockchain:**
- Base (Layer 2 Ethereum)
- USDC контракт: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Поддержка Base Sepolia для тестирования

## 📱 Использование

### Создание подарка

1. Нажмите "Create Gift"
2. Подключите кошелек
3. Выберите что отправить (USDC или NFT)
4. Кастомизируйте оформление:
   - Выберите 2 цвета для градиента
   - Добавьте стикер
   - Загрузите фоновое изображение
   - Напишите сообщение
5. Проверьте и создайте ссылку

### Получение подарка

1. Перейдите по ссылке
2. Нажмите на подарок, чтобы открыть
3. Подключите кошелек
4. Нажмите "Claim to Wallet"
5. Подтвердите транзакцию

## ⚠️ Важные замечания

### Текущая реализация

В текущей версии приложение использует **прямой трансфер** от отправителя к получателю. Это означает:

- ❌ Средства НЕ хранятся в эскроу
- ❌ Транзакция происходит только при клейме
- ❌ Отправитель должен быть онлайн для трансфера

### Рекомендации для продакшена

Для полноценного продакшен приложения необходимо:

1. **Создать Escrow контракт** для хранения средств
2. **Реализовать механизм депозита** при создании подарка
3. **Автоматический клейм** без участия отправителя
4. **Интеграция с Base Account** для создания кошельков на лету
5. **NFT API интеграция** (Alchemy, Moralis или SimpleHash)

## 🔧 Следующие шаги для разработки

### 1. Создание Escrow Smart Contract

Создайте смарт-контракт для эскроу:

```solidity
// GiftEscrow.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract GiftEscrow {
    struct Gift {
        address sender;
        address token; // USDC или NFT контракт
        uint256 amount; // Сумма или tokenId
        bool isNFT;
        bool claimed;
    }
    
    mapping(bytes32 => Gift) public gifts;
    
    function createUSDCGift(bytes32 giftId, address token, uint256 amount) external {
        // Депозит USDC в контракт
    }
    
    function createNFTGift(bytes32 giftId, address nftContract, uint256 tokenId) external {
        // Депозит NFT в контракт
    }
    
    function claimGift(bytes32 giftId) external {
        // Трансфер средств получателю
    }
}
```

### 2. Интеграция с Base Account

Добавьте поддержку создания кошельков для новых пользователей:

```typescript
// Используйте Base Account API для создания кошельков
// Документация: https://docs.base.org/base-account/
```

### 3. NFT Gallery

Интегрируйте API для получения NFT пользователя:

```typescript
// Alchemy NFT API
const alchemyApiKey = 'your-api-key';
const baseUrl = `https://base-mainnet.g.alchemy.com/nft/v2/${alchemyApiKey}`;

async function getUserNFTs(walletAddress: string) {
  const response = await fetch(`${baseUrl}/getNFTs?owner=${walletAddress}`);
  return response.json();
}
```

## 📚 Структура проекта

```
basedGift/
├── client/               # Frontend приложение
│   ├── src/
│   │   ├── components/  # UI компоненты
│   │   ├── hooks/       # React hooks (wallet, usdc, nft)
│   │   ├── lib/         # Конфигурация (wagmi)
│   │   ├── pages/       # Страницы приложения
│   │   └── App.tsx      # Главный компонент
│   └── index.html
├── server/              # Backend сервер
│   ├── db.ts           # База данных
│   ├── routes.ts       # API маршруты
│   └── index.ts        # Express сервер
├── shared/             # Общий код
│   ├── schema.ts       # Схема базы данных
│   └── routes.ts       # API типы
└── package.json
```

## 🔐 Безопасность

- ✅ Приватные ключи никогда не покидают кошелек пользователя
- ✅ Все транзакции требуют подтверждения пользователя
- ✅ `.env` файл не коммитится в Git
- ⚠️ Для продакшена используйте escrow контракт

## 🌐 Сети

### Base Mainnet
- Chain ID: `8453`
- RPC: `https://mainnet.base.org`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

### Base Sepolia (Testnet)
- Chain ID: `84532`
- RPC: `https://sepolia.base.org`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 🛠️ Команды

```bash
# Разработка
npm run dev          # Запустить dev сервер

# Сборка
npm run build        # Собрать для продакшена
npm run start        # Запустить продакшен сервер

# База данных
npm run db:push      # Применить изменения схемы

# Проверка типов
npm run check        # TypeScript type checking
```

## 📝 Лицензия

MIT

## 🤝 Вклад

Pull requests приветствуются! Для больших изменений сначала откройте issue для обсуждения.

## 📞 Поддержка

Если у вас есть вопросы или проблемы, создайте issue в репозитории.
