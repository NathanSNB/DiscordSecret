const { Events } = require('discord.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState, client) {
    // Gestion des salons privés
    if (newState.channelId && client.privateVoiceChannels.has(newState.channelId)) {
      // Si l'utilisateur n'est pas whitelisté et essaie d'entrer dans un salon privé
      if (!client.whitelistedUsers.has(newState.member.id)) {
        // Expulser l'utilisateur du salon vocal
        try {
          await newState.member.voice.disconnect('Salon privé');
          
          // Notifier les utilisateurs whitelistés via MP
          for (const whitelistedId of client.whitelistedUsers) {
            const user = client.users.cache.get(whitelistedId);
            if (user) {
              user.send(`🚫 ${newState.member.user.tag} a tenté d'entrer dans le salon privé ${newState.channel.name} et a été expulsé.`).catch(() => {});
            }
          }
        } catch (error) {
          console.error(`Impossible d'expulser ${newState.member.user.tag} du salon privé:`, error);
        }
      }
    }
    // Gestion du freeze
    if (client.frozenUsers.has(newState.member.id)) {
      const frozenChannelId = client.frozenUsers.get(newState.member.id);
      
      // Si l'utilisateur essaie de quitter son salon gelé
      if (oldState.channelId === frozenChannelId && newState.channelId !== frozenChannelId) {
        try {
          // Ramener l'utilisateur dans son salon gelé
          await newState.member.voice.setChannel(frozenChannelId);
          
          // Notifier les utilisateurs whitelistés
          for (const whitelistedId of client.whitelistedUsers) {
            const user = client.users.cache.get(whitelistedId);
            if (user) {
              user.send(`❄️ ${newState.member.user.tag} a tenté de quitter son salon gelé et y a été replacé.`).catch(() => {});
            }
          }
        } catch (error) {
          console.error(`Impossible de replacer ${newState.member.user.tag} dans son salon gelé:`, error);
        }
      }
    }
    
    // Gestion du stalk
    if (newState.channelId !== oldState.channelId && client.stalkedUsers.has(newState.member.id)) {
      const stalkers = client.stalkedUsers.get(newState.member.id);
      
      // Notifier tous les stalkers du changement de salon vocal
      if (newState.channelId) {
        for (const stalkerId of stalkers) {
          const user = client.users.cache.get(stalkerId);
          if (user) {
            user.send(`👀 ${newState.member.user.tag} a rejoint le salon vocal ${newState.channel.name}.`).catch(() => {});
          }
        }
      } else {
        for (const stalkerId of stalkers) {
          const user = client.users.cache.get(stalkerId);
          if (user) {
            user.send(`👀 ${oldState.member.user.tag} a quitté le salon vocal ${oldState.channel.name}.`).catch(() => {});
          }
        }
      }
    }
  }
};