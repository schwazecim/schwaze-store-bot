







const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const db = require("croxydb");
const { yetkiliRolId, paparaIban, ininalIban, owoHesapId } = require("../config.json");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const userId = interaction.user?.id;
    if (!userId) return;

    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`${interaction.commandName} komutu bulunamadı.`);
        return;
      }

      const kullaniciKabul = db.get(`kullanicikabul_${userId}`);
      if (!kullaniciKabul) {
        try {
          const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("Kuralları Kabul Etmeden Devam Edemezsin")
            .setDescription("Sistemi kullanmadan önce kuralları kabul etmelisin.\n\nKabul ediyor musun?");

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("kuralkabul")
              .setLabel("Kabul Et")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId("kuralred")
              .setLabel("Reddet")
              .setStyle(ButtonStyle.Danger)
          );

          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              embeds: [embed],
              components: [row],
              ephemeral: true,
            });
          }
        } catch (err) {
          console.error("Interaction.reply başarısız:", err);
        }
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        try {
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
          } else {
            await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
          }
        } catch (err) {
          console.error("Hata mesajı gönderilemedi:", err);
        }
      }
    }

    if (interaction.isButton()) {
      try {
        if (interaction.customId === "kuralkabul") {
          db.set(`kullanicikabul_${userId}`, true);
          db.add(`bakiye_${userId}`, 10);
          const yeniBakiye = db.get(`bakiye_${userId}`) || 10;

          const onayEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Kurallar Kabul Edildi")
            .setDescription(`Kuralları kabul ettin, hesabına **10 TL** tanımlandı.\nToplam bakiyen: **${yeniBakiye} TL**`);

          return interaction.update({
            embeds: [onayEmbed],
            components: [],
          });
        }

        if (interaction.customId === "kuralred") {
          const redEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ Kurallar Reddedildi")
            .setDescription("Kuralları reddettin. Komutları kullanamazsın.");

          return interaction.update({
            embeds: [redEmbed],
            components: [],
          });
        }

        const [action, ilanId, guildId, channelId] = interaction.customId.split("_");

        if (action === "satinAl") {
          const ilanData = db.get(`ilan_${ilanId}_${guildId}`);
          if (!ilanData) {
            return interaction.reply({
              content: "Bu ilan artık mevcut değil!",
              ephemeral: true,
            });
          }

          const channelName = `satinalim-${interaction.user.username}-${ilanId}`;
          const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              },
              {
                id: yetkiliRolId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              },
            ],
          });

          const hosgeldinEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Hoş Geldin!")

            .setDescription(
              `Merhaba <@${interaction.user.id}>! \n` +
              `**Ürün:** ${ilanData.urun}\n` +
              `**Fiyat:** ${ilanData.fiyat} TL\n` +
              `Lütfen aşağıdaki ödeme yöntemlerinden birini seçerek işlemi tamamla. Yetkililerimiz kısa süre içinde seninle ilgilenecek: <@&${yetkiliRolId}>`
            )
            .setTimestamp();

          const odemeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`papara_${ilanId}_${guildId}_${channel.id}`)
              .setLabel("Papara")
              .setStyle(ButtonStyle.Success)
              .setEmoji("1378056277225242714"),
            new ButtonBuilder()
              .setCustomId(`ininal_${ilanId}_${guildId}_${channel.id}`)
              .setLabel("İninal")
              .setStyle(ButtonStyle.Success)
              .setEmoji("1378056277225242714"),
            new ButtonBuilder()
              .setCustomId(`owo_${ilanId}_${guildId}_${channel.id}`)
              .setLabel("OwO")
              .setStyle(ButtonStyle.Success)
              .setEmoji("1378056277225242714"),
            new ButtonBuilder()
              .setCustomId(`kapat_${ilanId}_${guildId}_${channel.id}`)
              .setLabel("Kapat")
              .setStyle(ButtonStyle.Danger)
              .setEmoji("1378053455205371956")
          );

          await channel.send({
            embeds: [hosgeldinEmbed],
            components: [odemeRow],
          });

          await interaction.reply({
            content: `Satın alma işlemi için özel kanal oluşturuldu: ${channel}!`,
            ephemeral: true,
          });
        }

        if (action === "papara") {
          await interaction.reply({
            content: `Papara IBAN: \`${paparaIban}\`\nLütfen ödemeyi yaptıktan sonra yetkiliyi bekleyin!`,
            ephemeral: true,
          });
        }

        if (action === "ininal") {
          await interaction.reply({
            content: `İninal IBAN: \`${ininalIban}\`\nLütfen ödemeyi yaptıktan sonra yetkiliyi bekleyin!`,
            ephemeral: true,
          });
        }

        if (action === "owo") {
          await interaction.reply({
            content: `OwO ile ödeme için lütfen şu hesaba gönderim yap: <@${owoHesapId}>\nKomut: \`owo send <@${owoHesapId}> ${db.get(`ilan_${ilanId}_${guildId}`).fiyat}\`\nLütfen ödemeyi yaptıktan sonra yetkiliyi bekleyin!`,
            ephemeral: true,
          });
        }

        if (action === "kapat") {
          const channel = interaction.channel;
          await interaction.reply({
            content: "Kanal kapatılıyor...",
            ephemeral: true,
          });
          setTimeout(() => channel.delete(), 2000);
        }
      } catch (err) {
        console.error("Buton interaction hatası:", err);
      }
    }
  },
};