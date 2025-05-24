module.exports = {
  name: 'deletechat',
  description: 'Supprime un salon secret que vous avez créé.',
  
  async execute(message, args, client) {
    // Vérifier si la commande est exécutée dans un MP
    if (message.channel.isDMBased()) {
      return message.reply('Cette commande doit être utilisée dans un salon secret que vous souhaitez supprimer.');
    }
    
    // Vérifier si le salon est bien un salon secret
    if (!client.secretChannels || !client.secretChannels.has(message.channel.id)) {
      return message.reply('Ce salon n\'est pas un salon secret créé par cette commande.');
    }
    
    const secretData = client.secretChannels.get(message.channel.id);
    
    // Vérifier si l'utilisateur est le propriétaire du salon
    if (secretData.userId !== message.author.id) {
      return message.reply('Vous ne pouvez supprimer que les salons secrets que vous avez créés.');
    }
    
    try {
      // Informer l'utilisateur
      await message.reply('Ce salon secret va être supprimé dans quelques secondes...');
      
      // Annuler le timeout de suppression automatique
      clearTimeout(secretData.timeout);
      
      // Supprimer le salon après un court délai
      setTimeout(() => {
        // Supprimer le salon
        message.channel.delete('Salon secret supprimé par l\'utilisateur')
          .then(() => {
            client.secretChannels.delete(message.channel.id);
            // Envoyer une confirmation en MP
            message.author.send('Votre salon secret a été supprimé avec succès.').catch(() => {});
          })
          .catch(console.error);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la suppression du salon secret:', error);
      return message.reply("Une erreur s'est produite lors de la suppression du salon.");
    }
  }
};