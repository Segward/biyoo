const { EmbedBuilder, AttachmentBuilder, ChannelType, PermissionsBitField } = require('discord.js'); 

const createTicketsCategory = async (guild) => {
  const category = await guild.channels.create({
    name: "tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });

  const transcript = await guild.channels.create({
    name: "ticket-transcript",
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ]
  });

  const logs = await guild.channels.create({
    name: "ticket-logs",
    type: ChannelType.GuildText,
    parent: category,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ]
  });

  return category;
}

const transcribeTicket = async (guild, channel) => {
  if (channel.type !== ChannelType.GuildText)
    return;

  let messages = [];
  let lastId;

  while (true) {
    const options = { limit: 100 };
    if (lastId) {
      options.before = lastId;
    }

    const fetchedMessages = await channel.messages.fetch(options);
    messages = messages.concat(Array.from(fetchedMessages.values()));
    if (fetchedMessages.size !== 100) {
      break;
    }
    lastId = fetchedMessages.last().id;
  }

  messages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  let transcript = `Transcript of #${channel.name}\n\n`;
  for (const message of messages) {
    const time = new Date(message.createdTimestamp).toLocaleString();
    const author = message.author.tag;
    let content = message.content || "";

    if (message.attachments.size > 0) {
      message.attachments.forEach(attachment => {
        content += ` [Attachment: ${attachment.url}]`;
      });
    }

    if (message.embeds.length > 0) {
      message.embeds.forEach(embed => {
        const title = embed.title ? `Title: ${embed.title}\n` : "";
        const description = embed.description ? `Description: ${embed.description}\n` : "";
        const url = embed.url ? `URL: ${embed.url}\n` : "";
        const footer = embed.footer ? `Footer: ${embed.footer.text}\n` : "";
        content += ` [Embed: \n${title}${description}${url}${footer}]`;
      });
    }

    transcript += `[${time}] ${author}: ${content}\n`;
  }

  const buffer = Buffer.from(transcript, 'utf-8');
  const attachment = new AttachmentBuilder(buffer, { 
    name: `${channel.name}-transcript.txt` });
  const transcriptChannel = guild.channels.cache.find(
    c => c.name === "ticket-transcript" && c.type === ChannelType.GuildText);
  await transcriptChannel.send({ files: [attachment] });
};

const createTicket = async (guild, user, issue) => {
  let category = guild.channels.cache.find(
    c => c.name === "tickets" && c.type === ChannelType.GuildCategory); 
  if (!category) {
    category = await createTicketsCategory(guild);
  }

  const channelName = `ticket-${Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0')}`;
  const embed = new EmbedBuilder()
    .setTitle(`Created ${channelName}`)
    .setDescription(`Ticked created by ${user.tag}.\nIssue: ${issue}`)
    .setColor(0x00AE86)
    .setTimestamp();

  const ticketLogsChannel = guild.channels.cache.find(
    c => c.name === "ticket-logs" && c.type === ChannelType.GuildText);
  await ticketLogsChannel.send({ embeds: [embed] });
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
  await transcribeTicket(guild, channel);
  const embed = new EmbedBuilder()
    .setTitle(`Closed ${channel.name}`)
    .setDescription(`Ticked by ${user.tag} has been closed.`)
    .setColor(0xFF0000)
    .setTimestamp();

  const ticketLogsChannel = guild.channels.cache.find(
    c => c.name === "ticket-logs" && c.type === ChannelType.GuildText);
  await ticketLogsChannel.send({ embeds: [embed] });
}

module.exports = {
  createTicket,
  closeTicket,
};
