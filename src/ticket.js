const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ChannelType, PermissionsBitField } = require('discord.js'); 

const createTicketLogChannel = async (guild) => {
  return guild.channels.create({
    name: 'ticket-logs',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createTicketTranscriptChannel = async (guild) => {
  return guild.channels.create({
    name: 'ticket-transcripts',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createTicketCategory = async (guild) => {
  return guild.channels.create({
    name: 'tickets',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createClosedTicketCategory = async (guild) => {
  return guild.channels.create({
    name: 'closed-tickets',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createTicketChannel = async (guild, id, userId, reason) => {
  let ticketCategory = guild.channels.cache.find(c => c.name === 'tickets' 
    && c.type === ChannelType.GuildCategory);
  if (!ticketCategory)
    ticketCategory = await createTicketCategory(guild);

  const channel = await guild.channels.create({
    name: id,
    type: ChannelType.GuildText,
    parent: ticketCategory.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: userId,
        allow: [PermissionsBitField.Flags.ViewChannel, 
          PermissionsBitField.Flags.SendMessages, 
          PermissionsBitField.Flags.ReadMessageHistory],
      },
    ]
  });

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${id}`)
    .setDescription(`Ticket created by <@${userId}>`)
    .setColor(0x00AE86)
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId(id)
    .setLabel('Close Ticket')
    .setStyle('Danger');

  const row = new ActionRowBuilder()
    .addComponents(button);

  await channel.send({ embeds: [embed], components: [row] });
  return channel;
}

const closeTicketChannel = async (guild, id, userId) => {
  const channel = guild.channels.cache.find(c => c.name === id 
    && c.type === ChannelType.GuildText);
  if (!channel) 
    return;

  let closedTicketCategory = guild.channels.cache.find(c => c.name === 'closed-tickets' 
    && c.type === ChannelType.GuildCategory);
  if (!closedTicketCategory)
    closedTicketCategory = await createClosedTicketCategory(guild);

  await channel.setParent(closedTicketCategory.id);
  await channel.permissionOverwrites.edit(userId, { deny: [PermissionsBitField.Flags.ViewChannel] });

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${id} Closed`)
    .setDescription(`This ticket has been closed by <@${userId}>`)
    .setColor(0xFF0000)
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [] });
}

module.exports = { createTicketChannel, closeTicketChannel };
