# 🚀 Быстрый старт для разработки

Если у вас проблемы с подключением к PostgreSQL/Supabase, используйте локальную SQLite базу для разработки.

## Вариант 1: Локальная SQLite база (рекомендуется для разработки)

### 1. Установите better-sqlite3

```bash
npm install better-sqlite3 @types/better-sqlite3
```

### 2. Обновите server/db.ts

Замените содержимое на:

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { gifts } from '@shared/schema';

const sqlite = new Database('local.db');
export const db = drizzle(sqlite, { schema: { gifts } });
```

### 3. Создайте таблицу вручную

```bash
sqlite3 local.db "CREATE TABLE IF NOT EXISTS gifts (
  id TEXT PRIMARY KEY,
  sender_address TEXT NOT NULL,
  receiver_address TEXT,
  token_type TEXT NOT NULL,
  token_address TEXT,
  token_id TEXT,
  amount TEXT,
  message TEXT,
  theme TEXT NOT NULL DEFAULT 'default',
  visual_assets TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  escrow_tx_hash TEXT,
  claim_tx_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);"
```

### 4. Запустите приложение

```bash
npm run dev
```

Приложение будет доступно по адресу http://localhost:5000

## Вариант 2: Использовать PostgreSQL

### Настройте Supabase

1. Создайте новый проект на https://supabase.com
2. Скопируйте Connection Pooler URL из Settings → Database
3. Обновите `.env`:

```env
DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Примените схему

```bash
npm run db:push
```

## Тестирование функционала

### 1. Подключение кошелька

- Используйте MetaMask, Coinbase Wallet или другой Web3 кошелек
- Переключитесь на Base Sepolia testnet (Chain ID: 84532)
- Получите testnet токены: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### 2. Получение testnet USDC

Свопните немного ETH на USDC через:
- https://app.uniswap.org/swap (переключитесь на Base Sepolia)
- Или используйте faucet если доступен

### 3. Создание подарка

1. Нажмите "Create Gift"
2. Выберите USDC и введите сумму
3. Кастомизируйте с градиентом и стикерами
4. Создайте ссылку

### 4. Тестирование получения

1. Скопируйте ссылку
2. Откройте в новом окне/браузере
3. Подключите другой кошелек
4. Claim подарок

## Известные ограничения (текущая версия)

⚠️ **Важно**: Текущая версия использует упрощенную логику:

1. **Нет escrow контракта** - средства не блокируются
2. **Прямой трансфер** - транзакция происходит при claim
3. **Отправитель должен быть онлайн** - для выполнения трансфера

Для продакшена необходимо:
- Задеплоить escrow контракт (см. `contracts/GiftEscrow.sol`)
- Интегрировать с контрактом (см. `contracts/DEPLOY.md`)
- Добавить NFT API интеграцию

## Следующие шаги

1. ✅ Протестируйте создание подарка с USDC
2. ✅ Проверьте градиенты и стикеры
3. ⬜ Задеплойте escrow контракт
4. ⬜ Интегрируйте escrow в приложение
5. ⬜ Добавьте NFT функционал
6. ⬜ Добавьте Base Account интеграцию

## Помощь

Если возникли проблемы:
1. Проверьте console в браузере (F12)
2. Убедитесь что кошелек подключен к Base Sepolia
3. Проверьте что у вас есть testnet ETH и USDC
4. Проверьте .env файл
