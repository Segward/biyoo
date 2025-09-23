const { SlashCommandBuilder } = require("discord.js");
const { dbAddUser, dbGetUser, dbAddCoins, dbSubCoins} = require("./dbm.js");

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

const commands = [coins, addCoins, subCoins];
module.exports = commands;
