module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const member = newState.member;
    
    // Gestion des salons privés
    if (newState.channelId && client.privateVoiceChannels.has(newState.channelId)) {
      // Si l'utilisateur rejoint un salon privé (et n'y était pas déjà)
      if (oldState.channelId !== newState.channelId) {
        try {
          await member.voice.disconnect('Salon privé');
          // Suppression de la confirmation MP
        } catch (error) {
          console.error('Impossible de déconnecter l\'utilisateur:', error);
        }
      }
    }
    
    // Gestion des utilisateurs gelés
    if (client.frozenUsers.has(member.id)) {
      const frozenChannelId = client.frozenUsers.get(member.id);
      
      // Si l'utilisateur a changé de salon ou s'est déconnecté
      if (newState.channelId !== frozenChannelId) {
        try {
          // Ramener l'utilisateur dans son salon d'origine
          const frozenChannel = client.channels.cache.get(frozenChannelId);
          if (frozenChannel) {
            await member.voice.setChannel(frozenChannel);
          } else {
            // Si le salon n'existe plus, retirer le gel
            client.frozenUsers.delete(member.id);
          }
        } catch (error) {
          console.error('Impossible de ramener l\'utilisateur dans le salon gelé:', error);
        }
      }
    }
  },
};