const { REST, Routes, Collection } = require('discord.js');

const registerCommands = async (client, commands, token) => {
  const rest = new REST().setToken(token);
  const data = commands.map(command => command.data.toJSON());
  (async () => {
    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: data },
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  })();

  client.commands = new Collection();
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }
};

module.exports = { registerCommands };
