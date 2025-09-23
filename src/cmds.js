const { SlashCommandBuilder } = require('discord.js');

const ping = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    await interaction.reply('Pong!');
  }
}

const echo = {
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Replies with your input!')
    .addStringOption(option => 
      option.setName('input')
        .setDescription('The input to echo back')
        .setRequired(true)),
  async execute(interaction) {
    const input = interaction.options.getString('input');
    await interaction.reply(input);
  }
}

const commands = [ping, echo];
module.exports = commands;
