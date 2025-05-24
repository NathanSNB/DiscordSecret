module.exports = {
  name: 'stalk',
  description: 'Suit un utilisateur dans ses déplacements vocaux.',
  
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Vous devez spécifier l\'ID d\'un utilisateur à suivre.');
    }
    
    const targetId = args[0];
    const stalkerId = message.author.id;
    
    // Recherche de l'utilisateur cible dans tous les serveurs
    let targetFound = false;
    for (const [, guild] of client.guilds.cache) {
      if (guild.members.cache.has(targetId)) {
        targetFound = true;
        break;
      }
    }
    
    if (!targetFound) {
      return message.reply('Cet utilisateur n\'a pas été trouvé.');
    }
    
    // Vérifier si l'utilisateur est déjà suivi par le stalker
    if (!client.stalkedUsers.has(targetId)) {
      client.stalkedUsers.set(targetId, new Set([stalkerId]));
    } else {
      const stalkers = client.stalkedUsers.get(targetId);
      if (stalkers.has(stalkerId)) {
        stalkers.delete(stalkerId);
        if (stalkers.size === 0) {
          client.stalkedUsers.delete(targetId);
        }
        return message.reply(`Vous ne suivez plus les déplacements vocaux de l'utilisateur <@${targetId}>.`);
      } else {
        stalkers.add(stalkerId);
      }
    }
    
    return message.reply(`Vous suivez maintenant les déplacements vocaux de l'utilisateur <@${targetId}>.`);
  }
};