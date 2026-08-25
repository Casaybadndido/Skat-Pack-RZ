import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { setWlConfig, getWlConfig } from '../../features/wlRole.js';

export default {
  data: new SlashCommandBuilder()
    .setName('wlsetup')
    .setDescription('Configura el sistema WL (palabra wl da un rol)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('on')
        .setDescription('Activa WL en un canal')
        .addChannelOption((opt) =>
          opt
            .setName('canal')
            .setDescription('Canal donde se escribe wl')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addRoleOption((opt) =>
          opt
            .setName('rol')
            .setDescription('Rol que se da al escribir wl')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName('off').setDescription('Desactiva el sistema WL')
    )
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('Ver configuración actual')
    ),

  category: 'Utility',

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'on') {
      const channel = interaction.options.getChannel('canal');
      const role = interaction.options.getRole('rol');
      const me = interaction.guild.members.me;

      if (role.managed || role.position >= me.roles.highest.position) {
        return interaction.editReply({
          content:
            '❌ No puedo dar ese rol. Pon mi rol **por encima** del rol WL en Server Settings → Roles.',
        });
      }

      setWlConfig(guildId, {
        enabled: true,
        channelId: channel.id,
        roleId: role.id,
      });

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('WL activado')
            .setDescription(
              `Si alguien escribe **wl** en ${channel}, recibe el rol ${role}.\nEn otros canales no pasa nada.`
            ),
        ],
      });
    }

    if (sub === 'off') {
      setWlConfig(guildId, { enabled: false });
      return interaction.editReply({ content: 'WL desactivado.' });
    }

    if (sub === 'status') {
      const cfg = getWlConfig(guildId);
      if (!cfg?.enabled) {
        return interaction.editReply({ content: 'WL está **apagado**.' });
      }
      return interaction.editReply({
        content: `WL **activo**\nCanal: <#${cfg.channelId}>\nRol: <@&${cfg.roleId}>`,
      });
    }
  },
};
