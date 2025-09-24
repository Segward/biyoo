const { closeTicketChannel } = require('./ticket.js');

const onTicketButtonClick = async (interaction) => {
  const id = interaction.customId;
  const parts = id.split('-');
  if (parts.length !== 3 || parts[0] !== 'close' || parts[1] !== 'ticket') {
    console.error('Invalid ticket button id:', id);
    return;
  }

  const guild = interaction.guild;
  const ticketId = parts[2];
  const userId = interaction.user.id;
  await closeTicketChannel(guild, ticketId, userId);
}

const onButtonClick = async (interaction) => {
  const id = interaction.customId;
  if (id.startsWith('close-ticket')) {
    onTicketButtonClick(interaction);
  } else {
    console.log('Unknown button id:', id);
  }
}

const onChatInput = async (interaction) => {
  const command = interaction.client.commands.get(
    interaction.commandName);
  if (!command) {
    console.error('No command found for:', interaction.commandName);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('Error executing command:', error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  }
}

const handleInteraction = async (interaction) => {
  if (interaction.type === 'button') {
    await onButtonClick(interaction); 
  } else if (interaction.type === 'chatInput') {
    await onChatInput(interaction);
  } else {
    console.log('Unknown interaction type:', interaction.type);
  }
}

module.exports = { handleInteraction };
