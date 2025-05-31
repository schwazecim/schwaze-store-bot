const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const schwdb = require("croxydb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kasa")
    .setDescription("Bakiyenizi gösterir.")
    .setDMPermission(false),

  async execute(interaction) {
    const bakiye = schwdb.get(`bakiye_${interaction.user.id}`) || 0;

    const kasaEmbed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle("<a:para:1378056277225242714> Kasa Durumu")
      .setDescription(`${interaction.user} kullanıcısının bakiyesi: **${bakiye} TL**`)
      .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
      .setFooter({ text: "Schwaze", iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.reply({
      embeds: [kasaEmbed],
      ephemeral: true,
    });
  },
};