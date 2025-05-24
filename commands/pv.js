module.exports = {
  name: 'pv',
  description: 'Rend un salon vocal privé, expulsant automatiquement toute personne qui tente de le rejoindre (sauf les utilisateurs whitelistés).',
  
  async execute(message, args, client) {
    // Trouver tous les serveurs où l'utilisateur est présent
    const guilds = client.guilds.cache.filter(guild => 
      guild.members.cache.has(message.author.id)
    );
    
    // Vérifier si l'utilisateur est dans un salon vocal dans l'un de ces serveurs
    let voiceChannel = null;
    let foundMember = null;
    
    for (const [, guild] of guilds) {
      const member = guild.members.cache.get(message.author.id);
      if (member && member.voice.channel) {
        voiceChannel = member.voice.channel;
        foundMember = member;
        break;
      }
    }
    
    // Vérifier si l'utilisateur est dans un salon vocal
    if (!voiceChannel) {
      return message.reply('Vous devez être dans un salon vocal pour utiliser cette commande.');
    }
    
    // Vérifier si le salon est déjà privé
    if (client.privateVoiceChannels.has(voiceChannel.id)) {
      client.privateVoiceChannels.delete(voiceChannel.id);
      return message.reply(`🔓 Le salon vocal ${voiceChannel.name} n'est plus en mode privé.`);
    } else {
      client.privateVoiceChannels.add(voiceChannel.id);
      return message.reply(`🔒 Le salon vocal ${voiceChannel.name} est maintenant en mode privé. Seuls les utilisateurs whitelistés peuvent y accéder.`);
    }
  }
};