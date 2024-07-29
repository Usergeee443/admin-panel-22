const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const MAIN_API_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7251586758:AAGup0Hx_TjQGCWR-pt69WQRroB_lL39g_E';
const SERVER_URL = 'https://admin-bot-test22.vercel.app';

const bot = new TelegramBot(MAIN_API_TOKEN, { polling: true });

let currentOrder = {};

const mainBtn = {
  reply_markup: {
    keyboard: [
      [{ text: '🍔Burgerlar' }]
    ],
    resize_keyboard: true
  }
};

const cancelBtn = {
  reply_markup: {
    keyboard: [
      [{ text: '❌Bekor qilish' }]
    ],
    resize_keyboard: true
  }
};

function getMenu() {
  const { price, count } = currentOrder;
  return {
    inline_keyboard: [
      [
        { text: '➖', callback_data: 'minus' },
        { text: String(count || 0), callback_data: 'narx' },
        { text: '➕', callback_data: 'plus' }
      ],
      [{ text: `${price || 0} sum`, callback_data: 'umumiy' }],
      [{ text: '✅Zakaz berish', callback_data: 'zakaz' }]
    ]
  };
}

async function getBurgersMenu() {
  try {
    const response = await axios.get(`${SERVER_URL}/api/burgers`);
    const burgers = response.data;
    return burgers.map((burger, index) => {
      return [
        { text: burger.name, callback_data: `burger_${index}` }
      ];
    });
  } catch (error) {
    console.error('Error fetching burgers:', error);
    return [];
  }
}

bot.onText(/\/start/, async (msg) => {
  bot.sendMessage(msg.chat.id, '🔽O\'zingizga kerakli bo\'limni tanlang:', mainBtn);
});

bot.on('message', async (msg) => {
  if (msg.text === '🍔Burgerlar') {
    const burgersMenu = await getBurgersMenu();
    bot.sendMessage(msg.chat.id, '🍔 Burger Menu', {
      reply_markup: { inline_keyboard: burgersMenu }
    });
  } else if (msg.text === '❌Bekor qilish') {
    bot.sendMessage(msg.chat.id, 'Menyu', mainBtn);
  } else if (msg.text && msg.chat.type === 'private' && currentOrder.price > 0) {
    bot.sendMessage(msg.chat.id, 'Rahmat, operator siz bilan tez orada bog\'lanadi', mainBtn);
    // Here you would typically send order details to an admin or save them
    currentOrder = {};
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;

  if (action.startsWith('burger_')) {
    const index = parseInt(action.split('_')[1]);
    try {
      const response = await axios.get(`${SERVER_URL}/api/burgers`);
      const burgers = response.data;
      const burger = burgers[index];
      
      currentOrder = {
        name: burger.name,
        price: parseInt(burger.price),
        count: 1,
        photo: burger.photo
      };

      await bot.sendPhoto(msg.chat.id, burger.photo, {
        caption: `${burger.name}\n\n💸Narxi: ${burger.price} sum`,
        reply_markup: getMenu()
      });
      
      bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error('Error fetching burger details:', error);
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Error displaying burger details.' });
    }
  } else if (action === 'minus') {
    if (currentOrder.count > 1) {
      currentOrder.count -= 1;
      currentOrder.price = (currentOrder.price / (currentOrder.count + 1)) * currentOrder.count;
    }
    bot.editMessageReplyMarkup(getMenu(), { chat_id: msg.chat.id, message_id: msg.message_id });
  } else if (action === 'plus') {
    currentOrder.count += 1;
    currentOrder.price = (currentOrder.price / (currentOrder.count - 1)) * currentOrder.count;
    bot.editMessageReplyMarkup(getMenu(), { chat_id: msg.chat.id, message_id: msg.message_id });
  } else if (action === 'zakaz') {
    bot.answerCallbackQuery(callbackQuery.id, { text: '✅Buyurtmangiz qabul qilindi!' });
    bot.sendMessage(msg.chat.id, `✅Sizning buyurtmangiz\n\n🍔${currentOrder.name} ${currentOrder.count} ta\n💸Jami: ${currentOrder.price} sum\n\n📞Siz bilan bog'lanishimiz uchun telefon raqamingizni yozib yuboring!`, cancelBtn);
  }
});

console.log('Bot is running...');