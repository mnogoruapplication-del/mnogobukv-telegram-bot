const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// Конфигурация
const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const GAME_URL = process.env.GAME_URL || 'https://jolly-druid-a73d54.netlify.app/';
const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL + '/webhook/' + BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN не установлен!');
    process.exit(1);
}

// Создание бота БЕЗ polling
const bot = new TelegramBot(BOT_TOKEN);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('Бот запускается в режиме WEBHOOK...');

// Настройка webhook
async function setupWebhook() {
    try {
        await bot.deleteWebHook();
        console.log('Старый webhook удален');
        
        const webhookSet = await bot.setWebHook(WEBHOOK_URL);
        console.log('Webhook установлен:', webhookSet);
        console.log('Webhook URL:', WEBHOOK_URL);
        
        const webhookInfo = await bot.getWebHookInfo();
        console.log('Webhook статус:', webhookInfo);
        
    } catch (error) {
        console.error('Ошибка настройки webhook:', error);
    }
}

// Webhook endpoint для получения сообщений от Telegram
app.post('/webhook/' + BOT_TOKEN, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Команда /start
bot.on('message', (msg) => {
    if (msg.text === '/start') {
        const chatId = msg.chat.id;
        const userName = msg.from.first_name || 'Друг';
        
        const welcomeText = 'Что умеет этот бот?

Здравствуйте, ' + userName + '! Спасибо что выбрали нас!

Это бот, который раздает подарки нашим покупателям.

Чтобы забрать подарок, нужно нажать на кнопку "начать" и сыграть в небольшую игру!

Готовы начать?';
        
        bot.sendMessage(chatId, welcomeText, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Начать игру', web_app: {url: GAME_URL}}
                    ],
                    [
                        {text: 'Помощь', callback_data: 'help'},
                        {text: 'Баланс', callback_data: 'balance'}
                    ],
                    [
                        {text: 'Поддержка', callback_data: 'support'}
                    ]
                ]
            }
        });
    }
});

// Обработка inline кнопок
bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    bot.answerCallbackQuery(callbackQuery.id);
    
    switch(data) {
        case 'help':
            sendHelpMessage(chatId);
            break;
            
        case 'balance':
            const balanceText = 'Проверка баланса

Для просмотра актуального баланса:
1. Откройте игру
2. Авторизуйтесь номером карты
3. Баланс отобразится в приложении

Играйте и зарабатывайте бонусы!';
            
            bot.sendMessage(chatId, balanceText, {
                reply_markup: {
                    inline_keyboard: [[
                        {text: 'Открыть игру', web_app: {url: GAME_URL}}
                    ]]
                }
            });
            break;
            
        case 'support':
            const supportText = 'Техническая поддержка

Контакты:
• Email: support@club.com
• Время: Пн-Пт 9:00-18:00

Частые проблемы:
• Не работает авторизация? Проверьте номер карты
• Не начисляются бонусы? Попробуйте переавторизацию
• Игра не загружается? Перезапустите бота

Или просто напишите нам здесь!';
            
            bot.sendMessage(chatId, supportText, {
                reply_markup: {
                    inline_keyboard: [[
                        {text: 'Открыть игру', web_app: {url: GAME_URL}}
                    ]]
                }
            });
            break;
    }
});

// Функция помощи
function sendHelpMessage(chatId) {
    const helpText = 'ПРАВИЛА ИГРЫ

Как играть:
• Угадайте слово из 5 букв за 6 попыток
• Цвета подсказывают:
  Зеленый - буква на правильном месте
  Желтый - буква есть в слове, но не там
  Серый - буквы нет в слове

Бонусы:
• Победа: +50 бонусов
• Участие: +10 бонусов
• Тратьте бонусы в нашем клубе!

Авторизация:
• Введите номер карты клуба
• Укажите дату рождения
• Прогресс сохранится автоматически';
    
    bot.sendMessage(chatId, helpText, {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'Играть сейчас!', web_app: {url: GAME_URL}}
                ],
                [
                    {text: 'Баланс', callback_data: 'balance'}
                ]
            ]
        }
    });
}

// API для мини-приложения
app.post('/api/auth', async (req, res) => {
    try {
        const { card_number, birth_date, telegram_user_id } = req.body;
        console.log('Попытка авторизации:', { card_number, telegram_user_id });

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
        console.error('Ошибка авторизации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// Игровые события
app.post('/api/game-events', async (req, res) => {
    try {
        const eventData = req.body;
        console.log('Игровое событие:', eventData);
        res.json({ success: true, message: 'Событие сохранено' });
    } catch (error) {
        console.error('Ошибка события:', error);
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// Статус сервера
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        bot_status: 'webhook',
        webhook_url: WEBHOOK_URL
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Wordly Telegram Bot Server',
        status: 'running',
        mode: 'webhook',
        endpoints: ['/health', '/api/auth', '/api/game-events']
    });
});

// Запуск сервера
app.listen(PORT, async () => {
    console.log('Сервер запущен на порту ' + PORT);
    console.log('Game URL: ' + GAME_URL);
    
    await setupWebhook();
    console.log('Бот готов к работе в режиме webhook');
});

// Обработка ошибок
bot.on('error', (error) => {
    console.error('Ошибка бота:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Получен сигнал завершения работы...');
    try {
        await bot.deleteWebHook();
        console.log('Webhook удален при завершении');
    } catch (error) {
        console.error('Ошибка удаления webhook:', error);
    }
    process.exit(0);
});
