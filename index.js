import "dotenv/config";
import { Client, IntentsBitField } from "discord.js";
import { OpenAI } from "openai";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

// Instantiate openAI with API key
const openai = new OpenAI({apiKey: process.env.OPENAIAPI_KEY})

// Check if discord bot is initialized
client.on('ready', () => {
    console.log("GPT-bot is online!");
})

// Respond if message is posted in channel
client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== process.env.DISCORD_CHANNEL_ID || message.content.startsWith("!")) {
        return;
    }

    let conversationLog = [{ role: 'system', content: "Retard helper :3"}];

    try {
        // UX feature, let bot imitiate typing
        await message.channel.sendTyping();

        // Log previous messages so user can have a conversation
        let prevMessages = await message.channel.messages.fetch({ limit: 15 });
        prevMessages.reverse();

        prevMessages.forEach((msg) => {
            if (msg.content.startsWith('!') || (msg.author.id !== client.user.id && message.author.bot)) {
                return;
            }

            if (msg.author.id == client.user.id) {
                conversationLog.push({
                    role: 'assistant',
                    content: msg.content,
                    name: msg.author.username
                    .replace(/\s+/g, '_') // Clean up usernames, remove whitespaces
                    .replace(/[^\w\s]/gi, ''), // Clean up usernames, remove special characters
                });
            }
      
            if (msg.author.id == message.author.id) {
                conversationLog.push({
                    role: 'user',
                    content: msg.content,
                    name: message.author.username
                    .replace(/\s+/g, '_')
                    .replace(/[^\w\s]/gi, ''),
                });
            }
        });

        // Await for openai API response before sending the message reply
        const result = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
            // max_tokens: 256, // limit token usage
        })
        .catch((error) => {
            message.reply(`OPENAI ERR: ${error}`);
            console.log(`OPENAI ERR: ${error}`);
        });

        message.reply(result.choices[0].message.content);
    } catch (error) {
        message.reply(`ERR: ${error}`);
        console.log(`ERR: ${error}`);
    }
});

// Login discord bot with specific generated token from .env
client.login(process.env.BOT_TOKEN);