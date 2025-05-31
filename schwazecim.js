const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
const config = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[UYARI] ${filePath} komut dosyasında gerekli özellikler eksik.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const rest = new REST().setToken(config.token);

async function deployCommands() {
    try {
        console.log(`${commands.length} komut yükleniyor...`);

        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log(`${data.length} komut başarıyla yüklendi!`);
    } catch (error) {
        console.error('Komutları yüklerken bir hata oluştu:', error);
    }
}

client.once('ready', () => {
    deployCommands();
});

client.login(config.token);
