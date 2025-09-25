const { registerCommands } = require("./src/register.js");
const { handleInteraction } = require("./src/interaction.js");
const commands = require("./src/cmds.js");
const { Client, Events, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv").config();

const token = process.env.DISCORD_TOKEN;
if (!token)
  throw new Error("No token provided");

const clientId = process.env.CLIENT_ID;
if (!clientId)
  throw new Error("No client ID provided");

const client = new Client({intents: [
  GatewayIntentBits.Guilds, 
  GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, (c) => {
  registerCommands(client, commands, token);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await handleInteraction(interaction);
});

client.login(token);
