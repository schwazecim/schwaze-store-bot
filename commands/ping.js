const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun ping değerlerini gösterir'),
        
    async execute(interaction) {
        const start = Date.now();

        const loadingEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ 
                name: 'Ping Ölçülüyor...', 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            })
            .setDescription('Lütfen bekleyin, ping değerleri hesaplanıyor...');

        await interaction.reply({ embeds: [loadingEmbed] });

        let durum;
        if (interaction.client.ws.ping < 100) durum = "İyi";
        else if (interaction.client.ws.ping < 200) durum = "Normal";
        else durum = "Kötü";

        const resultEmbed = new EmbedBuilder()
            .setColor('#2F3136')
            .setAuthor({ 
                name: 'Ping Değerleri', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setDescription(`🟢 Genel Durum: ${durum}`)
            .addFields(
                { 
                    name: '📊 Bot Gecikmesi:', 
                    value: `\`${Date.now() - start}ms\``, 
                    inline: true 
                },
                { 
                    name: '🌐 WebSocket Gecikmesi:', 
                    value: `\`${interaction.client.ws.ping}ms\``, 
                    inline: true 
                },
                { 
                    name: '⏰ Mesaj Gecikmesi:', 
                    value: `\`${Date.now() - interaction.createdTimestamp}ms\``, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `${interaction.user.tag} tarafından istendi`, 
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }) 
            })
            .setTimestamp();

        setTimeout(() => {
            interaction.editReply({ embeds: [resultEmbed] });
        }, 500);
    },
};