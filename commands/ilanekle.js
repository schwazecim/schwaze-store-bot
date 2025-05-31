const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require("discord.js");
const { createCanvas } = require("canvas");
const schwdb = require("croxydb");
const { yetkiliRolId, paparaIban, ininalIban, owoHesapId } = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ilan-ekle")
    .setDescription("Yeni bir satış ilanı oluşturur.")
    .setDMPermission(false)
    .addStringOption((option) =>
      option.setName("urun").setDescription("Ürün adı").setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("aciklama").setDescription("Ürün açıklaması").setRequired(true)
    )
    .addNumberOption((option) =>
      option.setName("fiyat").setDescription("Ürün fiyatı (TL)").setRequired(true).setMinValue(0)
    )
    .addBooleanOption((option) =>
      option.setName("sablon").setDescription("Schwaze şablonu kullanılsın mı?").setRequired(true)
    )
    .addAttachmentOption((option) =>
      option.setName("gorsel").setDescription("Ürün görseli (isteğe bağlı)").setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(yetkiliRolId)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("<:carpi:1378053455205371956> Bu komutu kullanmak için yetkili rolüne sahip olmalısınız!"),
        ],
        ephemeral: true,
      });
    }

    const urun = interaction.options.getString("urun");
    const aciklama = interaction.options.getString("aciklama");
    const fiyat = interaction.options.getNumber("fiyat");
    const gorsel = interaction.options.getAttachment("gorsel");
    const sablon = interaction.options.getBoolean("sablon");

    const ilanNo = schwdb.get(`ilanNo_${interaction.guildId}`) || 0;
    schwdb.set(`ilanNo_${interaction.guildId}`, ilanNo + 1);
    const ilanId = ilanNo + 1;

    const ilanEmbed = new EmbedBuilder()
      .setColor("#5865f2")
      .setTitle(`📢 Yeni İlan #${ilanId}`)
      .addFields(
        { name: "<:id:1378053328386130101> İlan ID", value: `${ilanId}`, inline: true },
        { name: "<:sepet:1378050822721638572> Ürün", value: urun, inline: true },
        { name: "<a:para:1378056277225242714> Fiyat", value: `${fiyat} TL`, inline: true },
        { name: "<:aciklama:1378053395000066159> Açıklama", value: aciklama },
        { name: "<:sahip:1378050917651185765> İlan Sahibi", value: `<@${interaction.user.id}>`, inline: true },
        { name: "<:tarih:1378050909367570583> Tarih", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
      .setFooter({ text: "Schwaze", iconURL: interaction.guild.iconURL({ dynamic: true }) });

    let files = [];

    if (sablon) {
      const width = 800;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#2c2f33");
      gradient.addColorStop(1, "#5865f2");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(40, 140, width - 80, 320);

      ctx.font = "bold 60px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("Schwaze", width / 2, 90);

      ctx.save();
      ctx.rotate(-Math.PI / 4);
      ctx.font = "italic 40px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillText("Satış Şablonu", -150, 550);
      ctx.fillText("Schwaze", -250, 650);
      ctx.restore();

      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";

      let desc = aciklama.length > 150 ? aciklama.substring(0, 147) + "..." : aciklama;

      ctx.fillText(`Ürün: ${urun}`, 60, 200);
      ctx.fillText(`Fiyat: ${fiyat} TL`, 60, 250);
      ctx.fillText(`Açıklama: ${desc}`, 60, 300);

      const buffer = canvas.toBuffer("image/png");
      const attachment = new AttachmentBuilder(buffer, { name: "ilan-sablonu.png" });
      files.push(attachment);
      ilanEmbed.setImage("attachment://ilan-sablonu.png");
    } else if (gorsel) {
      ilanEmbed.setImage(gorsel.url);
      files.push(gorsel);
    }

    schwdb.set(`ilan_${ilanId}_${interaction.guildId}`, {
      urun,
      aciklama,
      fiyat,
      creator: interaction.user.id,
      date: Date.now(),
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`satinAl_${ilanId}_${interaction.guildId}`)
        .setLabel("Satın Al")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("1378050822721638572")
    );

    await interaction.reply({
      embeds: [ilanEmbed],
      files,
      components: [row],
    });
  },
};

// Buton etkileşimlerini dinlemek için bir event handler
module.exports.interactionCreate = async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, ilanId, guildId] = interaction.customId.split("_");

  if (action === "satinAl") {
    const ilanData = schwdb.get(`ilan_${ilanId}_${guildId}`);
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
        `Merhaba <@${interaction.user.id}>! <a:para:1378056277225242714>\n` +
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
      content: `OwO ile ödeme için lütfen şu hesaba gönderim yap: <@${owoHesapId}>\nKomut: \`owo send <@${owoHesapId}> ${schwdb.get(`ilan_${ilanId}_${guildId}`).fiyat}\`\nLütfen ödemeyi yaptıktan sonra yetkiliyi bekleyin!`,
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
};