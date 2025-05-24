const { Events } = require('discord.js');

module.exports = {
  name: 'ready',
  once: false,
  async execute(client) {
    // Gestionnaire de changement de présence
    client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
      const user = newPresence.user;
      const stalkers = client.stalkedUsers.get(user.id);
      
      if (!stalkers || stalkers.size === 0) return;
      
      let notificationMsg = '';
      
      // Vérifier les changements de statut
      if (!oldPresence || oldPresence.status !== newPresence.status) {
        notificationMsg += `**${user.username}** a changé de statut: ${newPresence.status}\n`;
      }
      
      // Vérifier les changements d'activité
      const oldActivity = oldPresence?.activities[0]?.name;
      const newActivity = newPresence?.activities[0]?.name;
      
      if (oldActivity !== newActivity) {
        if (newActivity) {
          notificationMsg += `**${user.username}** a commencé: ${newActivity}\n`;
        } else {
          notificationMsg += `**${user.username}** a arrêté ${oldActivity}\n`;
        }
      }
      
      if (notificationMsg) {
        // Envoyer la notification à tous les stalkers
        for (const stalkerId of stalkers) {
          const stalker = await client.users.fetch(stalkerId).catch(() => null);
          if (stalker) {
            stalker.send(notificationMsg).catch(() => {
              // Si le message ne peut pas être envoyé, arrêter le stalk
              stalkers.delete(stalkerId);
            });
          }
        }
        
        if (stalkers.size === 0) {
          client.stalkedUsers.delete(user.id);
        }
      }
    });
    
    // Gestionnaire de changement de salon vocal
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      const user = newState.member.user;
      const stalkers = client.stalkedUsers.get(user.id);
      
      if (!stalkers || stalkers.size === 0) return;
      
      let notificationMsg = '';
      
      // Connexion à un salon vocal
      if (!oldState.channel && newState.channel) {
        notificationMsg = `🔊 **${user.username}** a rejoint le salon vocal ${newState.channel.name}`;
      }
      // Déconnexion d'un salon vocal
      else if (oldState.channel && !newState.channel) {
        notificationMsg = `🔇 **${user.username}** a quitté le salon vocal ${oldState.channel.name}`;
      }
      // Changement de salon vocal
      else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        notificationMsg = `🔄 **${user.username}** est passé du salon vocal ${oldState.channel.name} à ${newState.channel.name}`;
      }
      // Statut de micro/casque
      else if (oldState.selfMute !== newState.selfMute) {
        notificationMsg = newState.selfMute 
          ? `🎙️ **${user.username}** a coupé son micro` 
          : `🎙️ **${user.username}** a activé son micro`;
      }
      else if (oldState.selfDeaf !== newState.selfDeaf) {
        notificationMsg = newState.selfDeaf 
          ? `🎧 **${user.username}** s'est rendu sourd` 
          : `🎧 **${user.username}** a réactivé son casque`;
      }
      
      if (notificationMsg) {
        // Envoyer la notification à tous les stalkers
        for (const stalkerId of stalkers) {
          const stalker = await client.users.fetch(stalkerId).catch(() => null);
          if (stalker) {
            stalker.send(notificationMsg).catch(() => {
              stalkers.delete(stalkerId);
            });
          }
        }
        
        if (stalkers.size === 0) {
          client.stalkedUsers.delete(user.id);
        }
      }
    });
    
    // Gestionnaire de messages
    client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;
      
      const user = message.author;
      const stalkers = client.stalkedUsers.get(user.id);
      
      if (!stalkers || stalkers.size === 0) return;
      
      // Ne pas notifier si le message est une commande stalk
      if (message.content.startsWith(`${client.config?.prefix || '!'}stalk`)) return;
      
      // Format du message pour la notification
      let notificationMsg = `💬 **${user.username}** a envoyé un message dans #${message.channel.name}:\n`;
      
      // Ajouter le contenu du message s'il existe
      if (message.content) {
        notificationMsg += `> ${message.content}\n`;
      }
      
      // Ajouter des info sur les pièces jointes s'il y en a
      if (message.attachments.size > 0) {
        notificationMsg += `> [${message.attachments.size} pièce(s) jointe(s)]\n`;
      }
      
      // Envoyer la notification à tous les stalkers
      for (const stalkerId of stalkers) {
        // Ne pas notifier le stalker de ses propres messages
        if (stalkerId === user.id) continue;
        
        const stalker = await client.users.fetch(stalkerId).catch(() => null);
        if (stalker) {
          stalker.send(notificationMsg).catch(() => {
            stalkers.delete(stalkerId);
          });
        }
      }
      
      if (stalkers.size === 0) {
        client.stalkedUsers.delete(user.id);
      }
    });
    
    // Gestionnaire de modification de messages
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
      if (newMessage.author?.bot) return;
      if (oldMessage.content === newMessage.content) return;
      
      const user = newMessage.author;
      if (!user) return;
      
      const stalkers = client.stalkedUsers.get(user.id);
      if (!stalkers || stalkers.size === 0) return;
      
      const notificationMsg = `✏️ **${user.username}** a modifié un message dans #${newMessage.channel.name}:\n` +
        `> **Avant:** ${oldMessage.content}\n` +
        `> **Après:** ${newMessage.content}`;
      
      // Envoyer la notification à tous les stalkers
      for (const stalkerId of stalkers) {
        const stalker = await client.users.fetch(stalkerId).catch(() => null);
        if (stalker) {
          stalker.send(notificationMsg).catch(() => {
            stalkers.delete(stalkerId);
          });
        }
      }
      
      if (stalkers.size === 0) {
        client.stalkedUsers.delete(user.id);
      }
    });
    
    // Gestionnaire de suppression de messages
    client.on(Events.MessageDelete, async (message) => {
      if (!message.author || message.author.bot) return;
      
      const user = message.author;
      const stalkers = client.stalkedUsers.get(user.id);
      
      if (!stalkers || stalkers.size === 0) return;
      
      let notificationMsg = `🗑️ **${user.username}** a supprimé un message dans #${message.channel.name}`;
      
      if (message.content) {
        notificationMsg += `:\n> ${message.content}`;
      }
      
      // Envoyer la notification à tous les stalkers
      for (const stalkerId of stalkers) {
        const stalker = await client.users.fetch(stalkerId).catch(() => null);
        if (stalker) {
          stalker.send(notificationMsg).catch(() => {
            stalkers.delete(stalkerId);
          });
        }
      }
      
      if (stalkers.size === 0) {
        client.stalkedUsers.delete(user.id);
      }
    });
    
    // Gestionnaire de changement de profil utilisateur
    client.on(Events.UserUpdate, async (oldUser, newUser) => {
      const stalkers = client.stalkedUsers.get(newUser.id);
      
      if (!stalkers || stalkers.size === 0) return;
      
      let notificationMsg = '';
      
      // Vérifier les changements de pseudo
      if (oldUser.username !== newUser.username) {
        notificationMsg += `👤 **${oldUser.username}** a changé son pseudo en **${newUser.username}**\n`;
      }
      
      // Vérifier les changements d'avatar
      if (oldUser.avatarURL() !== newUser.avatarURL()) {
        notificationMsg += `🖼️ **${newUser.username}** a changé son avatar\n`;
      }
      
      if (notificationMsg) {
        // Envoyer la notification à tous les stalkers
        for (const stalkerId of stalkers) {
          const stalker = await client.users.fetch(stalkerId).catch(() => null);
          if (stalker) {
            stalker.send(notificationMsg).catch(() => {
              stalkers.delete(stalkerId);
            });
          }
        }
        
        if (stalkers.size === 0) {
          client.stalkedUsers.delete(newUser.id);
        }
      }
    });
  },
};