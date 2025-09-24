const { ChannelType, PermissionsBitField } = require('discord.js'); 

const hasTicketsCategory = (guild) => {
  return guild.channels.cache.find(c => c.name === "tickets" && c.type === ChannelType.GuildCategory);
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

const closeTicket = async (channel) => {
  await channel.delete();
}

module.exports = {
  hasTicketsCategory,
  createTicketsCategory,
  hasTicket,
  createTicketChannel,
  closeTicket,
};
