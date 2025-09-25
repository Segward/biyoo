const { EmbedBuilder } = require('discord.js');
const { createTicketChannel, closeTicketChannel, deleteTicketChannel, transcribeTicketChannel } = require('./ticket.js');

const onCloseTicketButtonClick = async (interaction) => {
  await closeTicketChannel(interaction);
}

const onDeleteTicketButtonClick = async (interaction) => {
  await deleteTicketChannel(interaction);
}

const onTranscribeTicketButtonClick = async (interaction) => {
  await transcribeTicketChannel(interaction);
}

const onTicketModalSubmit = async (interaction) => {
  await createTicketChannel(interaction);
}

const onButtonClick = async (interaction) => {
  const id = interaction.customId;
  if (id.startsWith('close-ticket')) {
    await onCloseTicketButtonClick(interaction);
  } else if (id.startsWith('delete-ticket')) {
    await onDeleteTicketButtonClick(interaction);
  } else if (id.startsWith('transcribe-ticket')) {
    await onTranscribeTicketButtonClick(interaction);
  } else {
    console.log('Unknown button id:', id);
  }
}

const onModalInteraction = async (interaction) => {
  const id = interaction.customId;
  if (id === 'ticket-modal') {
    await onTicketModalSubmit(interaction);
  } else {
    console.log('Unknown modal id:', id);
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
  }
}

const handleInteraction = async (interaction) => {
  if (interaction.isButton()) {
    await onButtonClick(interaction);
  } else if (interaction.isChatInputCommand()) {
    await onChatInput(interaction);
  } else if (interaction.isModalSubmit()) {
    await onModalInteraction(interaction);
  } else {
    console.log('Unknown interaction type');
  }
}

module.exports = { handleInteraction };
