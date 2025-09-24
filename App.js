const dotenv = require("dotenv");
const {Client, Events, GatewayIntentBits} = require("discord.js");
const commands = require("./src/cmds.js");
const { registerCommands } = require("./src/register.js");
dotenv.config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("No token provided");
}

const clientId = process.env.CLIENT_ID;
if (!clientId) {
  throw new Error("No client ID provided");
}

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]});
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

await registerCommands(client, commands, token);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand())
    return;

  const c = interaction.client.commands.get(interaction.commandName);
  if (!c) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await c.execute(interaction);
  } catch (error) {
    console.error(error);
  }
});

client.login(token);
