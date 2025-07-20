const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  // Existing commands
  new SlashCommandBuilder()
    .setName('embed_create')
    .setDescription('Create a new editable embed')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the embed').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('embed_list')
    .setDescription('List all saved embeds'),

  new SlashCommandBuilder()
    .setName('embed_delete')
    .setDescription('Delete a saved embed')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the embed').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('embed_send')
    .setDescription('Send a saved embed to this channel')
    .addStringOption(opt =>
      opt.setName('name').setDescription('Name of the embed').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Submit a new order')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Type your user!').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item ordered').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mop').setDescription('Method of payment').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('amount').setDescription('Amount ordered').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('orders')
    .setDescription('View or search order logs')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Filter by user')
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Filter by item')
    )
    .addStringOption(opt =>
      opt.setName('status').setDescription('Filter by status (pending, paid, etc.)')
    )
    .addIntegerOption(opt =>
      opt.setName('page').setDescription('Page number (for pagination)')
    ),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(opt =>
      opt.setName('message').setDescription('Message to say').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Send ticket creation button'),

  // Loyalty card commands
  new SlashCommandBuilder()
    .setName('stamp')
    .setDescription('Manually add a stamp to a user\'s loyalty card')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to stamp').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('card')
    .setDescription('Show your or another user\'s loyalty card')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view')
    ),

  new SlashCommandBuilder()
    .setName('redeem')
    .setDescription('Redeem your loyalty card if full')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🚀 Deploying slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands deployed.');
  } catch (err) {
    console.error('❌ Error deploying commands:', err);
  }
})();
