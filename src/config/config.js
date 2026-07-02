import dotenv from 'dotenv';
dotenv.config();

export const config = {
  token:  process.env.token,
  clientId: "1419347731545329744",
  prefix: process.env.PREFIX || '.',
  ownerIds: ["1307302913240203274", "901487880067776524"],
  nodes: [
    {
      id: "main-node",
      host: "in-01.glaxin.dev",
      port: 8105,
      authorization: "darknight",
      secure: false,
      retryAmount: 5,
      retryDelay: 3000,
    },
  ],
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  database: {
    guild: './database/data/guild.bread',
    user: './database/data/user.bread',
    premium: './database/data/premium.bread',
    antiabuse: './database/data/antiabuse.bread',
    playlists: './database/data/playlists.bread',
  },
  links: {
    supportServer: "https://discord.gg/rx9N62DTgW"
  },
  status: {
    text: process.env.STATUS_TEXT || '.help || .play',
    status: process.env.STATUS_TYPE || 'dnd',
    type: 'CUSTOM'
  },
  colors: {
    info: '#2d2d2c',
    success: '#2d2d2c',
    warning: '#2d2d2c',
    error: '#2d2d2c'
  },
  
  webhook: {
    enabled: process.env.WEBHOOK_ENABLED !== 'false',
    url: process.env.WEBHOOK_URL || null,
    username: process.env.WEBHOOK_USERNAME || 'Bot Logger',
    avatarUrl: process.env.WEBHOOK_AVATAR_URL || null,
    levels: {
      info: {
        enabled: process.env.WEBHOOK_INFO_ENABLED !== 'false'
      },
      success: {
        enabled: process.env.WEBHOOK_SUCCESS_ENABLED !== 'false'
      },
      warning: {
        enabled: process.env.WEBHOOK_WARNING_ENABLED !== 'false'
      },
      error: {
        enabled: process.env.WEBHOOK_ERROR_ENABLED !== 'false'
      },
      debug: {
        enabled: process.env.WEBHOOK_DEBUG_ENABLED === 'true'
      }
    }
  },
  features: {
    stay247: true
  },
  logging: {
    guildLogChannelId: process.env.GUILD_LOG_CHANNEL_ID || null,
    errorLogChannelId: process.env.ERROR_LOG_CHANNEL_ID || null
  },
  queue: {
    maxSongs: {
      free: 50,
      premium: 200
    }
  },
  assets: {
    defaultTrackArtwork: 'https://cdn.discordapp.com/attachments/1419370567009828969/1423337112073408633/3808ec60c862508fa5ee51b2517c8a24.png?ex=68dff17b&is=68de9ffb&hm=8ee216c66029440b67b176cea9449a5d3567b97282809fe55a4a8ce16dcfc311&',
    defaultThumbnail: 'https://cdn.discordapp.com/attachments/1419370567009828969/1423337112073408633/3808ec60c862508fa5ee51b2517c8a24.png?ex=68dff17b&is=68de9ffb&hm=8ee216c66029440b67b176cea9449a5d3567b97282809fe55a4a8ce16dcfc311&',
    helpThumbnail: 'https://cdn.discordapp.com/attachments/1419370567009828969/1423337112073408633/3808ec60c862508fa5ee51b2517c8a24.png?ex=68dff17b&is=68de9ffb&hm=8ee216c66029440b67b176cea9449a5d3567b97282809fe55a4a8ce16dcfc311&'
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || "321c535c35b4423a945c9a6df5c5be06",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "1bc3fee6cfd743be843ef29047bfe46d"
  },
  search: {
    maxResults: 6,
    defaultSources: ['ytsearch', 'spsearch', 'amsearch', 'scsearch']
  },
  player: {
    defaultVolume: 100,
    seekStep: 10000,
    maxHistorySize: 50,
    stay247: {
      reconnectDelay: 5000,
      maxReconnectAttempts: 3,
      checkInterval: 30000
    }
  },
  watermark: 'Powered By Crystal Music Development </>',
  version: '2.0.0'
};