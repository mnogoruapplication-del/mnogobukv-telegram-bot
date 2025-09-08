const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const GAME_URL = process.env.GAME_URL || 'https://your-app.netlify.app';

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не установлен!');
    process.exit(1);
}

// Создание бота и сервера
const bot = new TelegramBot(BOT_TOKEN, {polling: true});
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('🤖 Бот запускается...');

// Команда /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'Друг';
    
    bot.sendMessage(chatId, `🎯 **Что умеет этот бот?**

Здравствуйте, ${userName}! Спасибо что выбрали нас! :)

Это бот, который раздает подарки нашим покупателям.

Чтобы забрать подарок, нужно нажать на кнопку "начать" и сыграть в небольшую игру! 

🎮 Готовы начать?`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {text: '🎮 Начать игру', web_app: {url: GAME_URL}}
                ],
                [
                    {text: '💡 Помощь', callback_data: 'help'},
                    {text: '💰 Баланс', callback_data: 'balance'}
                ],
                [
                    {text: '🆘 Поддержка', callback_data: 'support'}
                ]
            ]
        }
    });
});

// Обработка inline кнопок
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    // Убираем "загрузка" с кнопки
    bot.answerCallbackQuery(callbackQuery.id);
    
    switch(data) {
        case 'help':
            sendHelpMessage(chatId);
            break;
            
        case 'balance':
            bot.sendMessage(chatId, `💰 **Проверка баланса**

Для просмотра актуального баланса:
1️⃣ Откройте игру
2️⃣ Авторизуйтесь номером карты  
3️⃣ Баланс отобразится в приложении

🎯 Играйте и зарабатывайте бонусы!`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        {text: '🎮 Открыть игру', web_app: {url: GAME_URL}},
                        {text: '🏠 В главное меню', callback_data: 'start'}
                    ]]
                }
            });
            break;
            
        case 'support':
            bot.sendMessage(chatId, `🆘 **Техническая поддержка**

📞 **Контакты:**
• Email: support@club.com
• Время: Пн-Пт 9:00-18:00

❓ **Частые проблемы:**
• Не работает авторизация? Проверьте номер карты
• Не начисляются бонусы? Попробуйте переавторизацию  
• Игра не загружается? Перезапустите бота

💬 **Или просто напишите нам здесь!**`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        {text: '🎮 Открыть игру', web_app: {url: GAME_URL}},
                        {text: '🏠 В главное меню', callback_data: 'start'}
                    ]]
                }
            });
            break;
            
        case 'start':
            // Возврат в главное меню
            const userName = callbackQuery.from.first_name || 'Друг';
            bot.sendMessage(chatId, `🎯 **Что умеет этот бот?**

Здравствуйте, ${userName}! Спасибо что выбрали нас! :)

Это бот, который раздает подарки нашим покупателям.

Чтобы забрать подарок, нужно нажать на кнопку "начать" и сыграть в небольшую игру! 

🎮 Готовы начать?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: '🎮 Начать игру', web_app: {url: GAME_URL}}
                        ],
                        [
                            {text: '💡 Помощь', callback_data: 'help'},
                            {text: '💰 Баланс', callback_data: 'balance'}
                        ],
                        [
                            {text: '🆘 Поддержка', callback_data: 'support'}
                        ]
                    ]
                }
            });
            break;
    }
});

// Функция помощи
function sendHelpMessage(chatId) {
    bot.sendMessage(chatId, `🎯 **ПРАВИЛА ИГРЫ**

📝 **Как играть:**
🔸 Угадайте слово из 5 букв за 6 попыток
🔸 Цвета подсказывают:
  🟢 **Зеленый** - буква на правильном месте
  🟡 **Желтый** - буква есть в слове, но не там  
  ⚫ **Серый** - буквы нет в слове

💰 **Бонусы:**
🏆 **Победа:** +50 бонусов  
🎯 **Участие:** +10 бонусов
💎 **Тратьте бонусы в нашем клубе!**

🔐 **Авторизация:**
• Введите номер карты клуба
• Укажите дату рождения
• Прогресс сохранится автоматически`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    {text: '🎮 Играть сейчас!', web_app: {url: GAME_URL}}
                ],
                [
                    {text: '💰 Баланс', callback_data: 'balance'},
                    {text: '🏠 В главное меню', callback_data: 'start'}
                ]
            ]
        }
    });
}

// API для мини-приложения
app.post('/api/auth', async (req, res) => {
    try {
        const { card_number, birth_date, telegram_user_id } = req.body;
        console.log('🔐 Попытка авторизации:', { card_number, telegram_user_id });

        if (card_number && birth_date) {
            res.json({
                success: true,
                user: {
                    name: 'Тестовый Пользователь',
                    balance: 125.50,
                    card_number: card_number
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Неверные данные карты'
            });
        }
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Игровые события
app.post('/api/game-events', async (req, res) => {
    try {
        const eventData = req.body;
        console.log('🎮 Игровое событие:', eventData);
        res.json({ success: true, message: 'Событие сохранено' });
    } catch (error) {
        console.error('❌ Ошибка события:', error);
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// Статус сервера
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        bot_status: 'running'
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Wordly Telegram Bot Server',
        status: 'running',
        endpoints: ['/health', '/api/auth', '/api/game-events']
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🤖 Telegram бот активен`);
    console.log(`🎮 Game URL: ${GAME_URL}`);
});

// Обработка ошибок
bot.on('error', (error) => {
    console.error('❌ Ошибка бота:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});
