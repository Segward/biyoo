const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { dbAddUser, dbGetUser, dbAddCoins, dbSubCoins} = require("./dbm.js");
const { createTicket, closeTicket } = require("./ticket.js");

const coins = {
  data: new SlashCommandBuilder()
    .setName("coins")
    .setDescription("Replies with your coin balance!")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to check the balance of")
        .setRequired(false)),

  async execute(interaction) {
    let userId = interaction.user.id;
    if (interaction.options.getUser("user"))
      userId = interaction.options.getUser("user").id;

    const user = await dbGetUser(userId);
    await interaction.reply(`You have ${user.coins} coins.`);
  }
}

const addCoins = {
  data: new SlashCommandBuilder()
    .setName("addcoins")
    .setDescription("Add coins to a user")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The amount of coins to add")
        .setRequired(true))
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to add coins to")
        .setRequired(false)),

  async execute(interaction) {
    let userId = interaction.user.id;
    if (interaction.options.getUser("user"))
      userId = interaction.options.getUser("user").id;

    const amount = interaction.options.getInteger("amount");
    if (amount <= 0) {
      await interaction.reply("Amount must be positive.");
      return;
    }

    await dbAddCoins(userId, amount);
    await interaction.reply(`Added ${amount} coins to <@${userId}>.`);
  }
}

const subCoins = {
  data: new SlashCommandBuilder()
    .setName("subcoins")
    .setDescription("Subtract coins from a user")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("The amount of coins to subtract")
        .setRequired(true))
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to subtract coins from")
        .setRequired(false)),

  async execute(interaction) {
    let userId = interaction.user.id;
    if (interaction.options.getUser("user"))
      userId = interaction.options.getUser("user").id;

    const amount = interaction.options.getInteger("amount");
    if (amount <= 0) {
      await interaction.reply("Amount must be positive.");
      return;
    }

    const user = await dbGetUser(userId);
    if (user.coins < amount) {
      await interaction.reply("User does not have enough coins.");
      return;
    }

    await dbSubCoins(userId, amount);
    await interaction.reply(`Subtracted ${amount} coins from <@${userId}>.`);
  }
}

const ticket = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a support ticket")
    .addStringOption(option =>
      option.setName("issue")
        .setDescription("Describe your issue")
        .setRequired(true)),

  async execute(interaction) {
    const guild = interaction.guild;
    const issue = interaction.options.getString("issue");

    const embed = new EmbedBuilder()
      .setTitle("Support Ticket")
      .setDescription(`Ticket created by <@${interaction.user.id}>\nIssue: ${issue}`)
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({ text: `Ticket for ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
      .addComponents(closeButton);

    const channel = await createTicket(guild, interaction.user, issue);
    await channel.send({embeds: [embed], components: [row]});

    const filter = i => i.customId === 'close_ticket' && i.user.id === interaction.user.id;
    const time = 60 * 60 * 24 * 7 * 1000;
    const collector = channel.createMessageComponentCollector({ filter, time });

    let deleted = false;
    collector.on('collect', async i => {
      deleted = true;
      await i.deferUpdate();
      await closeTicket(guild, channel, interaction.user);
    });

    collector.on('end', async i => {
      if (deleted)
        return;

      await closeTicket(guild, channel, interaction.user);
    });

    await interaction.reply({ 
      content: `Your ticket has been created: ${channel}`, 
      ephemeral: true });
  }
}

const commands = [coins, addCoins, subCoins, ticket];
module.exports = commands;
