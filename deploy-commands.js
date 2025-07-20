const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const commands = [
  // Embed commands
  new SlashCommandBuilder()
    .setName('embed_create')
    .setDescription('Create a new embed')
    .addStringOption(option => option.setName('name').setDescription('Embed name').setRequired(true)),
  new SlashCommandBuilder()
    .setName('embed_list')
    .setDescription('List all saved embeds'),
  new SlashCommandBuilder()
    .setName('embed_delete')
    .setDescription('Delete an embed')
    .addStringOption(option => option.setName('name').setDescription('Embed name').setRequired(true)),
  new SlashCommandBuilder()
    .setName('embed_send')
    .setDescription('Send a saved embed')
    .addStringOption(option => option.setName('name').setDescription('Embed name').setRequired(true)),

  // Order commands
  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Place an order')
    .addUserOption(option => option.setName('user').setDescription('User placing order').setRequired(true))
    .addStringOption(option => option.setName('item').setDescription('Item to order').setRequired(true))
    .addStringOption(option => option.setName('mop').setDescription('Method of payment').setRequired(true))
    .addStringOption(option => option.setName('amount').setDescription('Amount').setRequired(true)),
  new SlashCommandBuilder()
    .setName('orders')
    .setDescription('View orders')
    .addUserOption(option => option.setName('user').setDescription('Filter by user'))
    .addStringOption(option => option.setName('item').setDescription('Filter by item'))
    .addStringOption(option => option.setName('status').setDescription('Filter by status'))
    .addIntegerOption(option => option.setName('page').setDescription('Page number')),

  // Ticket command
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Show ticket creation button'),

  // Say command
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a message as the bot')
    .addStringOption(option => option.setName('message').setDescription('Message to send').setRequired(true)),

  // Loyalty card commands
  new SlashCommandBuilder()
    .setName('stamp')
    .setDescription('Add a stamp to a user\'s loyalty card (admin only)')
    .addUserOption(option => option.setName('user').setDescription('User to stamp').setRequired(true)),
  new SlashCommandBuilder()
    .setName('card')
    .setDescription('Show your or another user\'s loyalty card')
    .addUserOption(option => option.setName('user').setDescription('User to view')),
  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem your loyalty card if full')
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('🚀 Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands.map(command => command.toJSON()) },
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
