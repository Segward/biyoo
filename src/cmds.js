const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createTicket, closeTicket } = require("./ticket.js");
const { dbCreateTicket } = require("./db.js");

const ticket = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a support ticket")
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Describe your reason")
        .setRequired(true)),

  async execute(interaction) {
    const ticketId = `ticket-${Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0')}`;
    const reason = interaction.options.getString("reason");
    await dbCreateTicket(ticketId, interaction.user.id, reason);
  }
}

const commands = [coins, addCoins, subCoins, ticket];
module.exports = commands;
