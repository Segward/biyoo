const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require("discord.js");
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

const hasTicketsCategory = async (guild) => {
  return guild.channels.cache.find(
    c => c.name.toLowerCase() === "tickets" && c.type === ChannelType.GuildCategory
  );
}

const createTicketsCategory = async (guild) => {
  const supportRole = guild.roles.cache.find(r => r.name.toLowerCase() === "meow");
  return await guild.channels.create({
    name: "tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: supportRole.id,
        allow: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages, 
          PermissionsBitField.Flags.ManageChannels],
      },
      {
        id: guild.client.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels],
      },
    ],
  });
}

const hasTicket = (guild, category, user) => {
  const channelName = `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 20);

  return guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
};

const createTicketChannel = async (guild, category, user, issue) => {
  const channelName = `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 20);

  const supportRole = guild.roles.cache.find(r => r.name.toLowerCase() === "meow");
  return guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, 
        PermissionsBitField.Flags.SendMessages],
      },
      {
        id: guild.client.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels],
      },
      {
        id: supportRole.id,
        allow: [PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels],
      },
    ],
  });
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
    let category = await hasTicketsCategory(guild);
    if (!category) {
      category = await createTicketsCategory(guild, interaction.user);
    }

    const issue = interaction.options.getString("issue");
    let channel = await hasTicket(guild, category, interaction.user);
    if (channel) {
      await interaction.reply(`You already have a ticket: ${channel}`);
      return;
    }

    channel = await createTicketChannel(guild, category, interaction.user, issue);
    await channel.send(`Ticket created by <@${interaction.user.id}>: ${issue}`);
    await interaction.reply(`Your ticket has been created: ${channel}`);
  }
}

const closeTicket = {
  data: new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Close the current ticket"),

  async execute(interaction) {
    const user = interaction.user;
    if (!interaction.member.permissions.has("Administrator")) {
      await interaction.reply("You do not have permission to close this ticket.");
      return;
    }

    const channel = interaction.channel;
    if (!(channel.parent && channel.parent.name.toLowerCase() === "tickets")) {
      await interaction.reply("This command can only be used in a ticket channel.");
      return;
    }

    await channel.delete();
  }
}

const commands = [coins, addCoins, subCoins, ticket, closeTicket];
module.exports = commands;
