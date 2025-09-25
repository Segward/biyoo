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
    parent: ticketCategory,
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

  let embed = new EmbedBuilder()
    .setTitle(`Ticket #${id}`)
    .setDescription(`Hello <@${userId}>, a staff member will be with you shortly.\n\n${reason}\n`)
    .setColor(0x00AE86)
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId(`close-${id}`)
    .setLabel('Close Ticket')
    .setStyle('Danger');

  const row = new ActionRowBuilder()
    .addComponents(button);

  await channel.send({ embeds: [embed], components: [row] });
  embed = new EmbedBuilder()
    .setTitle(`Ticket Created`)
    .setDescription(`Ticket ${channel} created by <@${userId}>\n\n${reason}\n`)
    .setColor(0x00AE86)
    .setTimestamp();

  let logChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText);
  if (!logChannel)
    logChannel = await createTicketLogChannel(guild);
  logChannel.send({ embeds: [embed] });
  return channel;
}

const closeTicketChannel = async (guild, channel, userId) => {
  const id = channel.name;
  let embed = new EmbedBuilder()
    .setTitle(`Ticket Closed`)
    .setDescription(`Ticket ${channel} closed by <@${userId}>`)
    .setColor(0xFFA500)
    .setTimestamp();

  const deleteButton = new ButtonBuilder()
    .setCustomId(`delete-${id}`)
    .setLabel('Delete Ticket')
    .setStyle('Danger');

  const transcriptButton = new ButtonBuilder()
    .setCustomId(`transcript-${id}`)
    .setLabel('Get Transcript')
    .setStyle('Primary');

  const row = new ActionRowBuilder()
    .addComponents(deleteButton, transcriptButton);

  let closedTicketCategory = guild.channels.cache.find(c => c.name === 'closed-tickets' 
    && c.type === ChannelType.GuildCategory);
  if (!closedTicketCategory)
    closedTicketCategory = await createClosedTicketCategory(guild);
  await channel.setParent(closedTicketCategory.id);
  await channel.send({ embeds: [embed], components: [row] });
  await channel.permissionOverwrites.edit(userId, { deny: [PermissionsBitField.Flags.ViewChannel] });

  embed = new EmbedBuilder()
    .setTitle(`Ticket Closed`)
    .setDescription(`Ticket ${channel} closed by <@${userId}>`)
    .setColor(0xFFA500)
    .setTimestamp();

  let logChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText);
  if (!logChannel)
    logChannel = await createTicketLogChannel(guild);
  logChannel.send({ embeds: [embed] });
}

const deleteTicketChannel = async (channel, userId) => {
  const split = channel.name.split('-');
  const id = split[1];
  const embed = new EmbedBuilder()
    .setTitle(`Ticket Deleted`)
    .setDescription(`Ticket ${id} deleted by <@${userId}>`)
    .setColor(0xFF0000)
    .setTimestamp();

  const logChannel = channel.guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText);
  logChannel.send({ embeds: [embed] });
  await channel.delete();
}

module.exports = { createTicketChannel, closeTicketChannel, deleteTicketChannel };
