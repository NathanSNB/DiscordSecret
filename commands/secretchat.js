const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'secretchat',
  description: 'Crée un salon textuel temporaire visible uniquement par vous.',
  
  async execute(message, args, client) {
    // Trouver un serveur où l'utilisateur est présent et où le bot a des permissions
    let targetGuild = null;
    let targetMember = null;
    
    // Parcourir les serveurs pour trouver un serveur approprié
    for (const [, guild] of client.guilds.cache) {
      // Vérifier si l'utilisateur est dans ce serveur
      const member = guild.members.cache.get(message.author.id);
      if (!member) continue;
      
      // Vérifier si le bot a les permissions nécessaires
      const botMember = guild.members.cache.get(client.user.id);
      if (!botMember) continue;
      
      if (botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        targetGuild = guild;
        targetMember = member;
        break;
      }
    }
    
    // Vérifier qu'on a trouvé un serveur approprié
    if (!targetGuild) {
      return message.reply("Je n'ai pas trouvé de serveur où vous êtes présent et où j'ai les permissions nécessaires pour créer un salon.");
    }
    
    // Options pour le canal secret
    const channelName = `secret-${message.author.username.toLowerCase()}-${Date.now().toString().substr(-4)}`;
    
    try {
      // Créer le salon avec les permissions par défaut (invisible pour tous)
      const secretChannel = await targetGuild.channels.create({
        name: channelName,
        type: 0, // 0 est le type pour un salon textuel
        permissionOverwrites: [
          // Masquer le salon pour tout le monde
          {
            id: targetGuild.roles.everyone.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          },
          // Autoriser le bot à voir le salon
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels
            ]
          },
          // Autoriser l'utilisateur à voir et écrire dans le salon
          {
            id: message.author.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });
      
      // Notification de création du salon
      await message.reply(`J'ai créé un salon secret pour vous sur le serveur **${targetGuild.name}** : <#${secretChannel.id}>`);
      
      // Message de bienvenue dans le salon
      await secretChannel.send({
        content: `${message.author}, voici votre salon secret! Ce salon est visible uniquement par vous.\nPour le supprimer, tapez \`=deletechat\` dans ce salon ou attendez 24h pour qu'il soit supprimé automatiquement.`
      });
      
      // Stocker le salon pour pouvoir le supprimer plus tard
      if (!client.secretChannels) {
        client.secretChannels = new Map();
      }
      
      // Enregistrer le salon avec un timeout pour le supprimer dans 24h
      const timeout = setTimeout(() => {
        if (secretChannel.deletable) {
          secretChannel.delete('Salon secret temporaire - délai expiré')
            .then(() => {
              client.secretChannels.delete(secretChannel.id);
              message.author.send(`Votre salon secret ${channelName} a été automatiquement supprimé après 24h d'inactivité.`).catch(() => {});
            })
            .catch(console.error);
        }
      }, 24 * 60 * 60 * 1000); // 24 heures
      
      client.secretChannels.set(secretChannel.id, {
        userId: message.author.id,
        guildId: targetGuild.id,
        timeout: timeout
      });
      
    } catch (error) {
      console.error('Erreur lors de la création du salon secret:', error);
      return message.reply("Une erreur s'est produite lors de la création du salon secret.");
    }
  }
};