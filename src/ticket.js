const { ChannelType, PermissionsBitField } = require('discord.js'); 

const createTicketsCategory = async (guild) => {
  return await guild.channels.create({
    name: "tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const hasTicket = (guild, user) => {
  let category = guild.channels.cache.find(
    c => c.name === "tickets" && c.type === ChannelType.GuildCategory); 
  if (!category) 
    return false;

  const channelName = `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 20);

  return guild.channels.cache.find(c => c.name === channelName && c.parentId === category.id);
};

const createTicket = async (guild, user, issue) => {
  let category = guild.channels.cache.find(
    c => c.name === "tickets" && c.type === ChannelType.GuildCategory); 
  if (!category) {
    category = await createTicketsCategory(guild);
  }

  const channelName = `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 20);

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
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.ReadMessageHistory],
      },
    ],
  });
}

const createClosedTicketsCategory = async (guild) => {
  return await guild.channels.create({
    name: "closed-tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const closeTicket = async (guild, channel, user) => {
  const member = await guild.members.fetch(user.id);
  if (!member.permissions.has(PermissionsBitField.Flags.Administrator))
    await channel.permissionOverwrites.edit(user.id, { ViewChannel: false });

  let closedCategory = guild.channels.cache.find(
    c => c.name === "closed-tickets" && c.type === ChannelType.GuildCategory); 
  if (!closedCategory) {
    closedCategory = await createClosedTicketsCategory(guild);
  }

  await channel.setParent(closedCategory.id);
}

module.exports = {
  hasTicket,
  createTicket,
  closeTicket,
};
