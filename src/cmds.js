const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { createTicketChannel, closeTicketChannel } = require("./ticket.js");

const ticket = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a support ticket"),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('ticket-modal')
      .setTitle('Create a Ticket');

    const reasonInput = new TextInputBuilder()
      .setCustomId('ticket-reason')
      .setLabel("Reason for the ticket")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  }
}

const commands = [ticket];
module.exports = commands;
