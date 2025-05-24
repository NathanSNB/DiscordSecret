module.exports = {
  name: 'freeze',
  description: 'Gèle un utilisateur dans son salon vocal actuel.',
  
  async execute(message, args, client) {
    if (!args.length) {
      return message.reply('Vous devez spécifier l\'ID d\'un utilisateur à geler.');
    }
    
    const targetId = args[0];
    
    // Recherche de l'utilisateur cible dans tous les serveurs où le bot est présent
    let targetMember = null;
    let targetVoiceChannel = null;
    
    for (const [, guild] of client.guilds.cache) {
      const member = guild.members.cache.get(targetId);
      if (member && member.voice.channel) {
        targetMember = member;
        targetVoiceChannel = member.voice.channel;
        break;
      }
    }
    
    if (!targetMember || !targetVoiceChannel) {
      return message.reply('Cet utilisateur n\'est pas dans un salon vocal ou n\'a pas été trouvé.');
    }
    
    // Vérifier si l'utilisateur est déjà gelé
    if (client.frozenUsers.has(targetId)) {
      client.frozenUsers.delete(targetId);
      return message.reply(`L'utilisateur <@${targetId}> n'est plus gelé dans son salon vocal.`);
    } else {
      client.frozenUsers.set(targetId, targetVoiceChannel.id);
      return message.reply(`L'utilisateur <@${targetId}> est maintenant gelé dans le salon vocal ${targetVoiceChannel.name}.`);
    }
  }
};