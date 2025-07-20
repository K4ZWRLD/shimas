const {
  Client, GatewayIntentBits, Partials, ActivityType,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  EmbedBuilder, InteractionType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const EMBED_FILE = './embeds.json';
const ORDER_LOG_FILE = './orders.json';
const ORDER_CHANNEL_ID = '1387118236126019656';
const TICKET_CATEGORY_ID = '1306843108918689805';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setPresence({
    status: 'dnd',
    activities: [{ name: 'boost shimas!', type: ActivityType.Playing }]
  });
});

function loadEmbeds() {
  if (!fs.existsSync(EMBED_FILE)) fs.writeFileSync(EMBED_FILE, '{}');
  return JSON.parse(fs.readFileSync(EMBED_FILE));
}
function saveEmbeds(data) {
  fs.writeFileSync(EMBED_FILE, JSON.stringify(data, null, 2));
}
function loadOrders() {
  if (!fs.existsSync(ORDER_LOG_FILE)) fs.writeFileSync(ORDER_LOG_FILE, '[]');
  return JSON.parse(fs.readFileSync(ORDER_LOG_FILE));
}
function saveOrders(data) {
  fs.writeFileSync(ORDER_LOG_FILE, JSON.stringify(data, null, 2));
}
function fixColor(color) {
  if (!color) return '#ffffff';
  if (!color.startsWith('#')) color = '#' + color;
  return /^#([0-9A-Fa-f]{6})$/.test(color) ? color : '#ffffff';
}
function isValidURL(string) {
  try { new URL(string); return true; } catch { return false; }
}
function buildPreviewEmbed(data) {
  const embed = new EmbedBuilder().setColor(fixColor(data.color));
  if (data.title?.trim()) embed.setTitle(data.title.trim());
  embed.setDescription(data.description?.trim() || 'This is a filler text!');
  if (data.footer?.text?.trim()) embed.setFooter({
    text: data.footer.text.trim(),
    iconURL: isValidURL(data.footer.icon) ? data.footer.icon : undefined
  });
  if (data.footer?.timestamp) embed.setTimestamp();
  if (data.author?.name?.trim()) embed.setAuthor({
    name: data.author.name.trim(),
    iconURL: isValidURL(data.author.icon) ? data.author.icon : undefined
  });
  if (isValidURL(data.image)) embed.setImage(data.image);
  if (isValidURL(data.thumbnail)) embed.setThumbnail(data.thumbnail);
  return embed;
}
function getEditButtons(name) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`edit_basic_${name}`).setLabel('📝 Edit Basic').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`edit_author_${name}`).setLabel('👤 Edit Author').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`edit_footer_${name}`).setLabel('📎 Edit Footer').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`edit_images_${name}`).setLabel('🖼️ Edit Images').setStyle(ButtonStyle.Secondary)
  );
}

let ticketCounter = 1;

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;
    const embeds = loadEmbeds();

    if (cmd === 'embed_create') {
      const name = interaction.options.getString('name');
      if (!name) return interaction.reply({ content: '❌ Name required.', flags: 64 });
      if (embeds[name]) return interaction.reply({ content: '❌ Already exists.', flags: 64 });

      embeds[name] = {
        title: '', description: '', color: '#fcdc79',
        footer: { text: '', icon: '', timestamp: false },
        author: { name: '', icon: '' }, image: '', thumbnail: ''
      };
      saveEmbeds(embeds);

      await interaction.channel.send({
        content: `Embed **${name}** created!`,
        embeds: [buildPreviewEmbed(embeds[name])],
        components: [getEditButtons(name)]
      });
      await interaction.reply({ content: '✅ Sent.', flags: 64 });
    }

    if (cmd === 'embed_list') {
      const list = Object.keys(embeds).map(n => `• \`${n}\``).join('\n') || 'No embeds saved.';
      await interaction.reply({ content: `📦 **Embeds:**\n${list}`, flags: 64 });
    }

    if (cmd === 'embed_delete') {
      const name = interaction.options.getString('name');
      if (!embeds[name]) return interaction.reply({ content: '❌ Not found.', flags: 64 });
      delete embeds[name];
      saveEmbeds(embeds);
      await interaction.reply({ content: `🗑️ Deleted **${name}**.`, flags: 64 });
    }

    if (cmd === 'embed_send') {
      const name = interaction.options.getString('name');
      if (!embeds[name]) return interaction.reply({ content: '❌ Not found.', flags: 64 });
      await interaction.channel.send({ embeds: [buildPreviewEmbed(embeds[name])] });
      await interaction.reply({ content: '✅ Sent.', flags: 64 });
    }
    if (cmd === 'say') {
      const msg = interaction.options.getString('message');
      await interaction.reply({ content: '✅ Sent.', flags: 64 });
      await interaction.channel.send(msg);
    }

    if (cmd === 'order') {
      await interaction.deferReply({ ephemeral: true }); // Reserve the interaction

      const user = interaction.options.getUser('user');
      const item = interaction.options.getString('item');
      const mop = interaction.options.getString('mop');
      const amount = interaction.options.getString('amount');

      const orderText = `_ _\n_ _　　　♡ 　 ${user}'s order 　  .ᐟ\n　　_       _⠀⠀ ࣪⠀　${amount}x ${item}\n　　_    _ ⠀⠀ ࣪⠀　paid w: ${mop}\n　　_       _⠀⠀ ࣪⠀　status: pending\n-# 　　　　➶ ⠀⠀　₊ ⠀　 ੭`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('status_paid').setLabel('paid').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('status_processing').setLabel('processing').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('status_done').setLabel('done').setStyle(ButtonStyle.Secondary)
      );

      const channel = await interaction.guild.channels.fetch(ORDER_CHANNEL_ID).catch(() => null);
      if (!channel?.isTextBased()) {
        return interaction.editReply({ content: '❌ Orders channel not found.' });
      }

      const msg = await channel.send({ content: orderText, components: [row] });

      let orders = loadOrders();
      if (!Array.isArray(orders)) orders = []; // fix bad format if it's not an array
      orders.push({
        user: user.id,
        item, amount, mop,
        status: 'pending',
        timestamp: Date.now(),
        messageId: msg.id,
        channelId: channel.id
      });
      saveOrders(orders);

      await interaction.editReply({ content: '✅ Order submitted!' });
    }

    if (cmd === 'ticket') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('create_ticket').setEmoji('1386649793006272544').setStyle(ButtonStyle.Secondary)
      );
      await interaction.channel.send({ components: [row] }); // not ephemeral
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('status_')) {
      const newStatus = interaction.customId.split('_')[1];

      // Update message content with the new status
      const updatedContent = interaction.message.content
        .split('\n')
        .map(line => line.toLowerCase().includes('status:') ? `　　_       _⠀⠀ ࣪⠀　status: ${newStatus}` : line)
        .join('\n');

      // Update saved order status in orders.json
      const orders = loadOrders();
      const order = orders.find(o => o.messageId === interaction.message.id);
      if (order) {
        order.status = newStatus;
        saveOrders(orders);
      }

      await interaction.update({ content: updatedContent, components: interaction.message.components });
    }


    if (interaction.customId === 'create_ticket') {
      const ticketNumber = ticketCounter++;
      const channel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
      });

      const welcome = new EmbedBuilder()
        .setImage('https://cdn.discordapp.com/attachments/1333193696920866866/1386750620811268126/f510a7275adea46cfcc68e95d95133f0.jpg')
        .setColor(0x36393f);

      const info = new EmbedBuilder()
        .setDescription('⠀　⠀𐐪　⠀ thanks for buying!　　  \n⠀　　𐙚　　complete /order form 　 ₊  ◞　\n˙　　˳　　⁺　　wait for assistance!')
        .setColor(0xfcdc79);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('done!').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('send_message').setLabel('ca (teen)').setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `${interaction.user} @everyone`, embeds: [welcome] });
      await channel.send({ embeds: [info], components: [row] });
      await interaction.reply({ content: `🎫 ticket created: ${channel}`, flags: 64 });
    }

    if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 closing in 5 seconds...', flags: 64 });
      setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }

    if (interaction.customId === 'send_message') {
      await interaction.channel.send(`_ _⠀⠀⠀⠀⠀⠀**teen**⠀⠀**only**⠀⠀⠀⠀𓈒⠀⠀⠀⠀:: \n
⠀⠀⠀::⠀⠀⠀⠀⠀https://cash.app/$LIMEY08 \n
⠀⠀⠀⠀⠀⠀⠀∿⠀⠀⠀⠀⠀⠀𓏏⠀⠀⠀⠀⠀⠀⊹ \n
-# ⠀⠀⠀⠀⠀⠀⠀⠀send web receipt`);
      await interaction.reply({ content: 'Sent.', flags: 64 });
    }

    if (interaction.customId.startsWith('edit_')) {
      const [_, section, name] = interaction.customId.split('_');
      const embeds = loadEmbeds();
      const data = embeds[name];
      if (!data) return interaction.reply({ content: '❌ Embed not found.', flags: 64 });

      const modal = new ModalBuilder().setCustomId(`modal_${section}_${name}`);

      if (section === 'basic') {
        modal.setTitle('Edit Title, Description, Color').addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('Title').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.title || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('description').setLabel('Description').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(data.description || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('Color (HEX)').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.color || '#fcdc79'))
        );
      }

      if (section === 'author') {
        modal.setTitle('Edit Author').addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('author_name').setLabel('Author Name').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.author.name || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('author_icon').setLabel('Author Icon URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.author.icon || ''))
        );
      }

      if (section === 'footer') {
        modal.setTitle('Edit Footer').addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('footer_text').setLabel('Footer Text').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.footer.text || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('footer_icon').setLabel('Footer Icon URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.footer.icon || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('footer_ts').setLabel('Add Timestamp? (yes/no)').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.footer.timestamp ? 'yes' : 'no'))
        );
      }

      if (section === 'images') {
        modal.setTitle('Edit Images').addComponents(
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('Main Image URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.image || '')),
          new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('thumb').setLabel('Thumbnail URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(data.thumbnail || ''))
        );
      }

      await interaction.showModal(modal);
    }
  }

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('modal_')) {
    const [_, section, name] = interaction.customId.split('_');
    const embeds = loadEmbeds();
    const data = embeds[name];
    if (!data) return interaction.reply({ content: '❌ Embed not found.', flags: 64 });

    if (section === 'basic') {
      data.title = interaction.fields.getTextInputValue('title');
      data.description = interaction.fields.getTextInputValue('description');
      data.color = interaction.fields.getTextInputValue('color');
    }
    if (section === 'author') {
      data.author.name = interaction.fields.getTextInputValue('author_name');
      data.author.icon = interaction.fields.getTextInputValue('author_icon');
    }
    if (section === 'footer') {
      data.footer.text = interaction.fields.getTextInputValue('footer_text');
      data.footer.icon = interaction.fields.getTextInputValue('footer_icon');
      data.footer.timestamp = interaction.fields.getTextInputValue('footer_ts').toLowerCase().startsWith('y');
    }
    if (section === 'images') {
      data.image = interaction.fields.getTextInputValue('image');
      data.thumbnail = interaction.fields.getTextInputValue('thumb');
    }

    saveEmbeds(embeds);
    await interaction.update({
      content: `Embed **${name}** updated!`,
      embeds: [buildPreviewEmbed(data)],
      components: [getEditButtons(name)]
    });
  }
});
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const Canvas = require('canvas');
const loyaltyDataPath = './loyalty.json';

let loyaltyData = {};
if (fs.existsSync(loyaltyDataPath)) {
  loyaltyData = JSON.parse(fs.readFileSync(loyaltyDataPath));
}

// Helper to save data
function saveLoyaltyData() {
  fs.writeFileSync(loyaltyDataPath, JSON.stringify(loyaltyData, null, 2));
}

// Generate loyalty card image
async function generateCard(userId) {
const base = await Canvas.loadImage('https://your-image-link.com/base_card.png');
const stamp = await Canvas.loadImage('https://your-image-link.com/stamp_icon.png');
  const canvas = Canvas.createCanvas(base.width, base.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(base, 0, 0);

  const positions = [
    [70, 90], [140, 90], [210, 90], [280, 90], [350, 90],
    [70, 180], [140, 180], [210, 180], [280, 180], [350, 180]
  ];

  const count = loyaltyData[userId]?.stamps || 0;
  for (let i = 0; i < count && i < 10; i++) {
    ctx.drawImage(stamp, positions[i][0], positions[i][1], 50, 50);
  }

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'card.png' });
}

// Command: /stamp
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, options } = interaction;

  if (commandName === 'stamp') {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
    }

    const target = options.getUser('user');
    if (!loyaltyData[target.id]) loyaltyData[target.id] = { stamps: 0 };

    if (loyaltyData[target.id].stamps >= 10) {
      return interaction.reply({ content: '🟤 This user already has a full card. Ask them to redeem it first.', ephemeral: true });
    }

    loyaltyData[target.id].stamps++;
    saveLoyaltyData();

    const cardImage = await generateCard(target.id);
    await interaction.reply({ content: `🧸 Added a stamp for ${target.username}! (${loyaltyData[target.id].stamps}/10)`, files: [cardImage] });
  }

  // Command: /card
  else if (commandName === 'card') {
    const target = options.getUser('user') || interaction.user;
    if (!loyaltyData[target.id]) loyaltyData[target.id] = { stamps: 0 };
    const cardImage = await generateCard(target.id);
    await interaction.reply({ content: `🎴 Here's ${target.username}'s loyalty card!`, files: [cardImage] });
  }

  // Command: /redeem
  else if (commandName === 'redeem') {
    if (!loyaltyData[interaction.user.id] || loyaltyData[interaction.user.id].stamps < 10) {
      return interaction.reply({ content: '🔟 You need a full card to redeem!', ephemeral: true });
    }

    loyaltyData[interaction.user.id].stamps = 0;
    saveLoyaltyData();

    await interaction.reply({
      content: `🎁 **${interaction.user.username}** has redeemed a full card! Send them their reward manually.`,
    });
  }
});

// Register slash commands using your deploy-commands.js
const loyaltyCommands = [
  new SlashCommandBuilder()
    .setName('stamp')
    .setDescription('Manually add a stamp to a user\'s loyalty card')
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
    console.log('📬 Registering loyalty card commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: loyaltyCommands });
    console.log('✅ Loyalty commands registered.');
  } catch (error) {
    console.error('❌ Failed to register loyalty commands:', error);
  }
})();


client.login(process.env.TOKEN);
