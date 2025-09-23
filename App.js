const dotenv = require("dotenv");
const {REST, Routes, Client, Events, GatewayIntentBits, Collection} = require("discord.js");
const commands = require("./src/cmds.js");
const {dbAddUser, dbGetUser} = require("./src/dbm.js");
dotenv.config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("No token provided");
}

const client = new Client({intents: [GatewayIntentBits.Guilds]});
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

const clientId = process.env.CLIENT_ID;
if (!clientId) {
  throw new Error("No client ID provided");
}

const rest = new REST().setToken(token);
const data = commands.map((command) => command.data.toJSON());
(async () => {
  try {
    console.log("Registering slash commands");
    await rest.put(
			Routes.applicationCommands(clientId),
			{ body: data },
		);
  } catch (error) {
    console.error(error);
  }
})();

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand())
    return;

  const userId = interaction.user.id;
  let user = await dbGetUser(userId);
  if (!user) {
    user = await dbAddUser(userId);
  }

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
