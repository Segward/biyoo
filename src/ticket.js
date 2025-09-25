const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, AttachmentBuilder } = require('discord.js'); 

const createTicketCategory = async (guild) => {
  return await guild.channels.create({
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

const createTicketLogChannel = async (category) => {
  return await category.guild.channels.create({
    name: 'ticket-logs',
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: category.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createTicketTranscriptChannel = async (category) => {
  return await category.guild.channels.create({
    name: 'ticket-transcripts',
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: category.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}

const createTicketChannel = async (interaction) => {
  const id = `ticket-${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(8, '0')}`;
  const guild = interaction.guild;
  const userId = interaction.user.id;
  const reason = interaction.fields.getTextInputValue('ticket-reason');
  const category = guild.channels.cache.find(c => c.name === 'tickets' 
    && c.type === ChannelType.GuildCategory) || await createTicketCategory(guild);

  const channel = await category.guild.channels.create({
    name: id,
    type: ChannelType.GuildText,
    parent: category.id,
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
    .setTitle('Ticket Created')
    .setDescription(`Ticket created at <#${channel.id}>\nId: ${id}`)
    .setColor('Green')
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });

  const logChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText) || await createTicketLogChannel(category);

  await logChannel.send({ embeds: [embed] });
  embed = new EmbedBuilder()
    .setTitle('Support Ticket')
    .setDescription(`Ticket by <@${userId}>\nId: ${id}\nReason: ${reason}`)
    .setColor('Blue')
    .setTimestamp();

  const closeButton = new ButtonBuilder()
    .setCustomId('close-ticket')
    .setLabel('Close Ticket')
    .setStyle('Danger');

  const row = new ActionRowBuilder().addComponents(closeButton);
  await channel.send({ embeds: [embed], components: [row] });
}

const closeTicketChannel = async (interaction) => {
  const channel = interaction.channel;
  const guild = interaction.guild;
  const userId = interaction.user.id;
  let id = channel.name;
  if (id.startsWith('closed-ticket-'))
    return interaction.reply({ content: 'This ticket is already closed.', ephemeral: true });

  const embed = new EmbedBuilder()
    .setTitle('Ticket Closed')
    .setDescription(`Ticket closed by <@${userId}>\nId: ${id}`)
    .setColor('Orange')
    .setTimestamp();

  const deleteButton = new ButtonBuilder()
    .setCustomId('delete-ticket')
    .setLabel('Delete Ticket')
    .setStyle('Danger');

  const transcribeButton = new ButtonBuilder()
    .setCustomId('transcribe-ticket')
    .setLabel('Transcribe Ticket')
    .setStyle('Primary');

  const row = new ActionRowBuilder().addComponents(deleteButton, transcribeButton);
  await interaction.reply({ embeds: [embed], components: [row] });

  id = `closed-${id}`;
  await channel.setName(id);
  await channel.permissionOverwrites.edit(userId, { deny: [PermissionsBitField.Flags.SendMessages] });

  const category = guild.channels.cache.find(c => c.name === 'tickets' 
    && c.type === ChannelType.GuildCategory) || await createTicketCategory(guild);

  const logChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText) || await createTicketLogChannel(category);

  await logChannel.send({ embeds: [embed] });
}

const deleteTicketChannel = async (interaction) => {
  const channel = interaction.channel;
  const guild = interaction.guild;
  const userId = interaction.user.id;

  const id = channel.name.replace('closed-', '');
  const embed = new EmbedBuilder()
    .setTitle('Ticket Deleted')
    .setDescription(`Ticket deleted by <@${userId}>\nId: ${id}`)
    .setColor('Red')
    .setTimestamp();

  const category = guild.channels.cache.find(c => c.name === 'tickets' 
    && c.type === ChannelType.GuildCategory) || await createTicketCategory(guild);

  const logChannel = guild.channels.cache.find(c => c.name === 'ticket-logs' 
    && c.type === ChannelType.GuildText) || await createTicketLogChannel(category);

  await logChannel.send({ embeds: [embed] });
  await channel.delete();
}

const getTicketChannelMessages = async (channel) => {
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
  return messages.reverse();
}

const createTranscriptAttachment = (messages) => {
  let html = '<html><body>';
  messages.forEach(msg => {
    html += `<p><strong>${msg.author.tag} (${msg.createdAt.toLocaleString()}):</strong> ${msg.content}`;
    if (msg.attachments.size > 0) {
      msg.attachments.forEach(attachment => {
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
          html += `<br><img src="${attachment.url}" alt="Image" style="max-width:300px;">`;
        } else if (attachment.contentType && attachment.contentType.startsWith('video/')) {
          html += `<br><video controls style="max-width:300px;"><source src="${attachment.url}" type="${attachment.contentType}">Your browser does not support the video tag.</video>`;
        } else if (attachment.contentType && attachment.contentType.startsWith('audio/')) {
          html += `<br><audio controls><source src="${attachment.url}" type="${attachment.contentType}">Your browser does not support the audio element.</audio>`;
        } else {
          html += `<br><a href="${attachment.url}">${attachment.name}</a>`;
        }
      });
    }

    if (msg.embeds.length > 0) {
      msg.embeds.forEach(embed => {
        if (embed.title)
          html += `<br><em>Embed Title:</em> ${embed.title}`;
        if (embed.description)
          html += `<br><em>Embed Description:</em> ${embed.description}`;
        if (embed.url)
          html += `<br><em>Embed URL:</em> <a href="${embed.url}">${embed.url}</a>`;
        if (embed.image)
          html += `<br><img src="${embed.image.url}" alt="Embed Image" style="max-width:300px;">`;
        if (embed.thumbnail)
          html += `<br><img src="${embed.thumbnail.url}" alt="Embed Thumbnail" style="max-width:100px;">`;
      });
    }

    if (msg.stickers.size > 0) {
      msg.stickers.forEach(sticker => {
        html += `<br><img src="${sticker.url}" alt="Sticker" style="max-width:100px;">`;
      });
    }

    html += '</p>';
  });

  html += '</body></html>';
  const buffer = Buffer.from(html, 'utf-8');
  return new AttachmentBuilder(buffer, { name: 'transcript.html' });
}

const transcribeTicketChannel = async (interaction) => {
  const channel = interaction.channel;
  const guild = interaction.guild;
  const userId = interaction.user.id;

  const messages = await getTicketChannelMessages(channel);
  if (messages.length === 0) {
    return interaction.reply({ content: 'No messages to transcribe.', ephemeral: true });
  }

  const attachment = createTranscriptAttachment(messages);
  const embed = new EmbedBuilder()
    .setTitle('Ticket Transcribed')
    .setDescription(`Ticket transcribed by <@${userId}>\nId: ${channel.name}`)
    .setColor('Purple')
    .setTimestamp();

  const category = guild.channels.cache.find(c => c.name === 'tickets' 
    && c.type === ChannelType.GuildCategory) || await createTicketCategory(guild);

  const transcriptChannel = guild.channels.cache.find(c => c.name === 'ticket-transcripts' 
    && c.type === ChannelType.GuildText) || await createTicketTranscriptChannel(category);

  await transcriptChannel.send({ embeds: [embed], files: [attachment] });
  await interaction.reply({ embeds: [embed] });
}

module.exports = { createTicketChannel, closeTicketChannel, deleteTicketChannel, transcribeTicketChannel };
