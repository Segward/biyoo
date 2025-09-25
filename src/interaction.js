const { EmbedBuilder } = require('discord.js');
const { createTicketChannel, closeTicketChannel, deleteTicketChannel } = require('./ticket.js');

const onCloseTicketButtonClick = async (interaction) => {
  interaction.deferUpdate();
  const guild = interaction.guild;
  const channel = interaction.channel;
  await closeTicketChannel(guild, channel, interaction.user.id);
}

const onDeleteTicketButtonClick = async (interaction) => {
  interaction.deferUpdate();
  const channel = interaction.channel;
  await deleteTicketChannel(channel, interaction.user.id);
}

const onButtonClick = async (interaction) => {
  const id = interaction.customId;
  if (id.startsWith('close-ticket')) {
    await onCloseTicketButtonClick(interaction);
  } else if (id.startsWith('delete-ticket')) {
    await onDeleteTicketButtonClick(interaction);
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
  }
}

const onTicketModalSubmit = async (interaction) => {
  const reason = interaction.fields.getTextInputValue('ticket-reason');
  const ticketId = `ticket-${Math.floor(Math.random() * 0x100000000).
    toString(16).padStart(8, '0')}`;
  const channel = await createTicketChannel(interaction.guild, 
    ticketId, interaction.user.id, reason);

  const embed = new EmbedBuilder()
    .setTitle('Ticket Created')
    .setDescription(`Your ticket has been created: ${channel}`)
    .setColor(0x00FF00)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

const onModalInteraction = async (interaction) => {
  const id = interaction.customId;
  if (id === 'ticket-modal') {
    await onTicketModalSubmit(interaction);
  } else {
    console.log('Unknown modal id:', id);
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
