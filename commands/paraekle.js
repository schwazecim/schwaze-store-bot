const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const schwdb = require("croxydb");
const { ownerİd } = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("para-ekle")
    .setDescription("Belirtilen kullanıcıya bakiye ekler.")
    .setDMPermission(false)
    .addUserOption(option =>
      option
        .setName("kullanici")
        .setDescription("Bakiye eklenecek kullanıcı")
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName("miktar")
        .setDescription("Eklenecek bakiye miktarı (TL)")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    if (interaction.user.id !== ownerİd) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("<:carpi:1378053455205371956> Bu komutu sadece **sahibim** kullanabilir.")
        ]
      });
    }

    const kullanici = interaction.options.getUser("kullanici");
    const miktar = interaction.options.getNumber("miktar");

    try {
      await interaction.client.users.fetch(kullanici.id);
    } catch {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("<:carpi:1378053455205371956> Geçersiz kullanıcı! Lütfen geçerli bir kullanıcı seçin.")
        ]
      });
    }

    // Bakiyeyi veritabanına ekle
    schwdb.add(`bakiye_${kullanici.id}`, miktar);
    const yeniBakiye = schwdb.get(`bakiye_${kullanici.id}`) || 0;

    const paraEkleEmbed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle("💸 Bakiye Eklendi!")
      .setDescription(`<@${kullanici.id}> kullanıcısına **${miktar} TL** eklendi.`)
      .addFields(
        { name: "Kullanıcı", value: `<@${kullanici.id}>`, inline: true },
        { name: "Yeni Bakiye", value: `${yeniBakiye} TL`, inline: true },
        { name: "Yetkili", value: `<@${interaction.user.id}>`, inline: true }
      )
      .setFooter({ text: "Schwaze", iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    await interaction.editReply({ embeds: [paraEkleEmbed] });

    // DM gönderme işlemi
    try {
      await kullanici.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#5865f2")
            .setTitle("🔔 Bakiye Eklendi!")
            .setDescription(`Hesabınıza **${miktar} TL** eklendi!`)
            .addFields({ name: "Yeni Bakiyeniz", value: `${yeniBakiye} TL` })
            .setFooter({ text: "Schwaze" })
            .setTimestamp(),
        ]
      });
    } catch (error) {
      console.error(`[HATA] Kullanıcıya DM gönderilemedi: ${error.message}`);
    }
  },
};
