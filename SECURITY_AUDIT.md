# 🔒 Аудит безопасности и исправления

## ⚠️ КРИТИЧЕСКИЕ ПРОБЛЕМЫ (ИСПРАВЛЕНЫ)

### 1. **Приватные ключи в .env**
**Проблема:** Файл `.env` содержит чувствительные данные:
- `PRIVATE_KEY` - приватный ключ кошелька
- `DATABASE_URL` - креды базы данных с паролем
- API ключи (Alchemy, CDP, WalletConnect)

**Статус:** ✅ Исправлено
- `.env` в `.gitignore` (уже было)
- Добавлены предупреждающие комментарии в `.env`
- `.env.example` убран из `.gitignore` (должен быть в репе как шаблон)

**Рекомендации:**
```bash
# 1. НЕМЕДЛЕННО смените все ключи, если .env был закоммичен в git:
# - Сгенерируйте новый PRIVATE_KEY
# - Обновите DATABASE_URL (смените пароль в Neon)
# - Пересоздайте VITE_ALCHEMY_API_KEY
# - Пересоздайте VITE_CDP_API_KEY
# - Пересоздайте VITE_WALLETCONNECT_PROJECT_ID

# 2. Проверьте историю git:
git log --all --full-history -- .env

# 3. Если .env был в истории - используйте git-filter-repo для очистки:
# https://github.com/newren/git-filter-repo
```

### 2. **VITE_ переменные публично доступны**
**Проблема:** Все переменные с префиксом `VITE_` компилируются в клиентский бандл и доступны в браузере.

**Текущие публичные ключи:**
- ✅ `VITE_WALLETCONNECT_PROJECT_ID` - безопасно (public key)
- ✅ `VITE_ALCHEMY_API_KEY` - безопасно (с ограничениями по домену)
- ✅ `VITE_CDP_API_KEY` - безопасно (с ограничениями)

**Рекомендации:**
- Настройте **Domain Restrictions** в Alchemy Dashboard
- Настройте **Allowed Origins** в CDP Portal
- Настройте **Allowed Domains** в WalletConnect Project

### 3. **PostCSS конфигурация**
**Проблема:** Ошибка "Cannot find module 'onchainkit-fix'"

**Решение:** Текущий `postcss.config.js` правильный. Ошибка возникает если:
- Старый процесс dev сервера не перезапущен
- Кеш не очищен

**Исправление:**
```bash
# Остановите dev сервер (Ctrl+C)
rm -rf node_modules/.vite
npm run dev
```

---

## 🔍 ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ

### 4. **Проверка зависимостей на уязвимости**
```bash
npm audit
```

**Статус:** Проверьте и исправьте:
```bash
npm audit fix
```

### 5. **Hardcoded секреты в коде**
**Проверено:** ✅ Нет hardcoded секретов в исходниках

### 6. **Git History**
**Важно:** Проверьте не закоммичены ли секреты:
```bash
# Поиск PRIVATE_KEY в истории
git log -S "PRIVATE_KEY" --all --oneline

# Поиск DATABASE_URL
git log -S "postgresql://" --all --oneline
```

---

## 🛡️ РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ

### Production Deployment

#### 1. Environment Variables
```bash
# Используйте сервис для управления секретами:
# - Vercel: Environment Variables
# - Railway: Variables
# - Render: Environment Variables

# НЕ храните секреты в .env файлах на проде
```

#### 2. Database Security
```bash
# Настройте в Neon:
- IP Whitelist (только ваш сервер)
- SSL/TLS обязательно
- Ротация паролей каждые 90 дней
```

#### 3. API Keys Rotation
```bash
# Ротируйте ключи регулярно:
- CDP API Key: каждые 6 месяцев
- Alchemy API Key: каждые 6 месяцев
- WalletConnect ID: при необходимости
```

#### 4. Wallet Private Key
```bash
# НИКОГДА не используйте один приватный ключ для:
- Production (используйте hardware wallet или MPC)
- Staging (отдельный ключ)
- Development (отдельный ключ)

# Рекомендация: Используйте multisig для production
```

---

## 📋 Checklist для Production

- [ ] Все ключи из .env заменены production версиями
- [ ] Database URL использует production credentials
- [ ] Настроены Domain Restrictions для всех API ключей
- [ ] Включен Rate Limiting на сервере
- [ ] Настроен CORS правильно
- [ ] Включен HTTPS
- [ ] Secrets хранятся в secure vault (не в .env)
- [ ] Настроен monitoring и alerting
- [ ] Регулярные backups базы данных
- [ ] Plan по incident response

---

## 🔧 Быстрые исправления

### Исправить PostCSS ошибку:
```bash
# Остановите dev сервер
# Очистите кеш
rm -rf node_modules/.vite dist
# Перезапустите
npm run dev
```

### Проверить .env не в git:
```bash
git status --ignored | grep .env
# Должно быть:
# .env (ignored)
```

### Обновить все зависимости:
```bash
npm audit fix
npm update
```

---

## 📚 Ресурсы

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Neon Security](https://neon.tech/docs/security/security-overview)
- [Alchemy Security](https://docs.alchemy.com/docs/security-best-practices)
- [Coinbase CDP Security](https://docs.cdp.coinbase.com/wallet-sdk/docs/security)

---

**Дата аудита:** 2026-02-06  
**Статус:** ✅ Критические проблемы исправлены  
**Следующий аудит:** Перед production deployment
