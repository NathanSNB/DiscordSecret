const { Client, GatewayIntentBits, Collection, Events, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

// Création du client avec tous les intents nécessaires
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

// Préfixe pour les commandes
const prefix = '=';

// Stockage des commandes et des données
client.commands = new Collection();
client.privateVoiceChannels = new Set();
client.frozenUsers = new Map(); // Map(userId, channelId)
client.stalkedUsers = new Map(); // Map(targetUserId, Set(stalkerIds))
client.secretChannels = new Map(); // Map(channelId, {userId, guildId, timeout})

// Liste blanche des utilisateurs autorisés à utiliser les commandes
client.whitelistedUsers = new Set([
  '658672547449012234', // Remplacez par votre ID Discord
  // Ajoutez d'autres IDs ici
]);

// Chargement des commandes par MP
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Si la commande a une propriété name, l'ajouter à la collection
  if ('name' in command && 'execute' in command) {
    client.commands.set(command.name, command);
  } else {
    console.log(`[AVERTISSEMENT] La commande ${file} n'a pas les propriétés requises "name" ou "execute".`);
  }
}

// Chargement des événements
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// Gestionnaire pour les commandes par message privé
client.on(Events.MessageCreate, async message => {
  // Ignorer les messages qui ne sont pas des MP ou qui viennent d'un bot ou qui ne commencent pas par le préfixe
  if (!message.channel.isDMBased() || message.author.bot || !message.content.startsWith(prefix)) return;

  // Vérifier si l'utilisateur est dans la whitelist
  if (!client.whitelistedUsers.has(message.author.id)) {
    return message.reply("Vous n'êtes pas autorisé à utiliser ce bot.");
  }
  
  // Extraire le nom de la commande et les arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Chercher la commande
  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    // Exécuter la commande
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    await message.reply('Il y a eu une erreur lors de l\'exécution de cette commande!');
  }
});

// Connexion
client.login(token);

// Message de confirmation quand le bot est prêt
client.once(Events.ClientReady, () => {
  console.log(`Bot connecté en tant que ${client.user.tag}!`);
  console.log(`Utilisateurs whitelistés: ${Array.from(client.whitelistedUsers).join(', ')}`);
});

// Nettoyage des ressources lors de la déconnexion
process.on('SIGINT', async () => {
  console.log('Arrêt du bot...');
  
    // Supprimer tous les salons secrets
    if (client.secretChannels && client.secretChannels.size > 0) {
      console.log(`Suppression de ${client.secretChannels.size} salons secrets...`);
      // Ajoutez ici la logique pour supprimer les salons secrets si nécessaire
    }
    process.exit(0);
  });