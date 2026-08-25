import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../../data/wl-role.json');

function ensureConfigFile() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONFIG_PATH)) fs.writeFileSync(CONFIG_PATH, '{}', 'utf8');
}

function readConfig() {
  try {
    ensureConfigFile();
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function writeConfig(data) {
  ensureConfigFile();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function getWlConfig(guildId) {
  return readConfig()[guildId] || null;
}

export function setWlConfig(guildId, data) {
  const config = readConfig();
  config[guildId] = { ...(config[guildId] || {}), ...data };
  writeConfig(config);
}

export async function handleWlMessage(message) {
  if (!message.guild || message.author.bot) return;

  const cfg = getWlConfig(message.guild.id);
  if (!cfg?.enabled || !cfg.channelId || !cfg.roleId) return;

  // Solo en el canal configurado
  if (message.channel.id !== cfg.channelId) return;

  const content = message.content.trim().toLowerCase();
  if (content !== 'wl') return;

  const member = message.member;
  if (!member) return;

  // Ya tiene el rol
  if (member.roles.cache.has(cfg.roleId)) {
    await message.reply({ content: 'Ya tienes el rol.' }).catch(() => {});
    return;
  }

  try {
    await member.roles.add(cfg.roleId);
    await message.react('✅').catch(() => {});
    // Opcional: borrar el mensaje "wl"
    // await message.delete().catch(() => {});
  } catch (err) {
    console.error('[wlRole]', err.message);
    await message
      .reply({ content: 'No pude darte el rol. Revisa la posición del rol del bot.' })
      .catch(() => {});
  }
}
