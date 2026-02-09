# Интеграция Coinbase Developer Platform (CDP)

## 📋 Обзор изменений

Выполнена точечная интеграция CDP в проект Based Gift с сохранением текущей бизнес-логики и UI.

## ✅ Реализованные улучшения

### 1. Гибридный RPC с fallback (wagmi.ts)
**Проблема:** Ошибки 429 (Rate Limited) от Alchemy при отправке транзакций.

**Решение:**
- Настроен fallback транспорт в Wagmi v2
- **Приоритет 1:** CDP RPC (`https://api.developer.coinbase.com/rpc/v1/base/${CDP_API_KEY}`)
- **Приоритет 2:** Alchemy RPC (резервный)
- Автоматическое переключение при недоступности основного провайдера

**Файлы:** `client/src/lib/wagmi.ts`

### 2. Smart Wallet с Passkeys (App.tsx + Navbar.tsx)
**Проблема:** Необходимость установки MetaMask/Rabby для новых пользователей.

**Решение:**
- Интегрирован `OnchainKitProvider` в App.tsx
- Заменена кнопка подключения на компоненты `Wallet`, `Identity` из OnchainKit
- Добавлен `coinbaseWallet` connector с режимом `smartWalletOnly`
- Пользователи могут создавать кошелек через FaceID/TouchID (Passkeys)

**Файлы:** 
- `client/src/App.tsx`
- `client/src/components/Navbar.tsx`
- `client/src/lib/wagmi.ts`

### 3. Paymaster - газ за счет приложения
**Проблема:** Пользователи должны иметь ETH для оплаты газа транзакций.

**Решение:**
- Внедрена поддержка Paymaster через `capabilities` в Wagmi v2
- Транзакции `approve` и `createGift` спонсируются приложением через CDP Paymaster
- Используется фиксированный `gas: BigInt(120000)` для избежания лишних `eth_estimateGas` запросов

**Файлы:**
- `client/src/hooks/use-usdc.ts` - approve с Paymaster
- `client/src/hooks/use-escrow.ts` - createUSDCGift и createETHGift с Paymaster

### 4. Исправление загрузки NFT изображений (use-nft.ts)
**Проблема:** Битые IPFS изображения NFT.

**Решение:**
- Реализована функция `getIPFSUrl()` с fallback логикой
- Шлюзы пробуются поочередно:
  1. `nftstorage.link`
  2. `dweb.link`
  3. `ipfs.io`
- Таймаут 5 секунд для каждого шлюза

**Файлы:** `client/src/hooks/use-nft.ts`

### 5. Оптимизация UX
**Проблема:** Избыточные запросы к RPC и API при переключении вкладок.

**Решение:**
- Установлен `pollingInterval: 12000` (12 секунд) в `useWaitForTransactionReceipt`
- Установлен глобальный `staleTime: 300000` (5 минут) в QueryClient
- Снижена нагрузка на RPC при мониторинге транзакций

**Файлы:**
- `client/src/lib/queryClient.ts`
- `client/src/hooks/use-escrow.ts`
- `client/src/hooks/use-usdc.ts`
- `client/src/hooks/use-nft.ts`

### 6. Coinbase Onramp - покупка USDC в приложении
**Проблема:** Пользователю нужно идти на биржу для покупки USDC.

**Решение:**
- Интегрирован компонент `FundButton` из OnchainKit
- Кнопка "Buy USDC" появляется, когда баланс недостаточен
- Пользователь платит картой или через Apple/Google Pay прямо в интерфейсе

**Файлы:** `client/src/pages/CreateGift.tsx`

## 🔧 Настройка

### 1. Получите CDP API Key
1. Перейдите на https://portal.cdp.coinbase.com/projects/api-keys
2. Создайте новый проект
3. Скопируйте API Key

### 2. Обновите переменные окружения
Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Заполните переменные:
```env
VITE_CDP_API_KEY=your_cdp_api_key_here
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_ALCHEMY_MAINNET_URL=https://base-mainnet.g.alchemy.com/v2/your_key
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Установите зависимости
```bash
npm install
```

### 4. Запустите проект
```bash
npm run dev
```

## 📦 Новые зависимости

- `@coinbase/onchainkit` v1.1.2 - Компоненты для Smart Wallet, Identity, Fund
- Обновлены импорты для `coinbaseWallet` connector из `wagmi/connectors`

## 🧪 Тестирование

1. **RPC Fallback:**
   - Отключите Alchemy RPC в `.env`
   - Убедитесь, что транзакции работают через CDP RPC

2. **Smart Wallet:**
   - Попробуйте подключиться через Coinbase Smart Wallet
   - Создайте кошелек с помощью Passkeys (FaceID/TouchID)

3. **Paymaster:**
   - Создайте подарок с 0 ETH балансом
   - Транзакции должны проходить без запроса газа

4. **IPFS Images:**
   - Проверьте загрузку NFT изображений в секции выбора NFT

5. **Onramp:**
   - Введите сумму больше вашего баланса USDC
   - Кнопка "Buy USDC" должна появиться

## ⚠️ Важно

- **Не удаляйте** существующий Alchemy RPC - он работает как fallback
- **Не меняйте** структуру компонентов - все изменения точечные
- **Используйте** Wagmi v2 синтаксис (никаких устаревших хуков)
- CDP Paymaster может требовать whitelist вашего контракта в dashboard

## 🔍 Структура изменений

```
client/src/
├── lib/
│   ├── wagmi.ts            ✅ CDP RPC, coinbaseWallet connector
│   └── queryClient.ts      ✅ staleTime: 300000
├── hooks/
│   ├── use-nft.ts          ✅ IPFS fallback gateways
│   ├── use-usdc.ts         ✅ Paymaster для approve
│   └── use-escrow.ts       ✅ Paymaster для createGift
├── pages/
│   └── CreateGift.tsx      ✅ FundButton для Onramp
├── components/
│   └── Navbar.tsx          ✅ OnchainKit Wallet компоненты
└── App.tsx                 ✅ OnchainKitProvider
```

## 📚 Ресурсы

- [Base Documentation](https://docs.base.org/get-started/base)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [CDP Portal](https://portal.cdp.coinbase.com/)
- [Wagmi v2 Documentation](https://wagmi.sh/)

## 🐛 Известные ограничения

1. OnchainKit требует React 19, но проект использует React 18 (установлено с `--legacy-peer-deps`)
2. Paymaster может не работать на Base Mainnet без whitelist контракта
3. Onramp доступен не во всех странах (проверьте на portal.coinbase.com)

## 💡 Следующие шаги

1. Получите CDP API Key и настройте `.env`
2. Добавьте escrow контракт в whitelist Paymaster (если планируете mainnet)
3. Протестируйте все функции на Base Sepolia
4. Разверните на production с Base Mainnet

---

**Статус:** ✅ Интеграция завершена  
**Версия:** 1.0.0  
**Дата:** 2026-02-06
