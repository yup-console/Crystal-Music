export const emoji = {
  "check": "<:n_check:1420266315565760563>",
  "info": "<:arsenic_info:1419607614269952060>",
  "cross": "<:cross:1420266600895873105>",
  "add": "<:plus:1420267179097587787>",
  "reset": "<a:reset:1420345697546407951>",
  "folder": "<:Folder:1420267698637770802>",
  "openfolder": "<:folder:1420267700042731592>",
  "dot": "<:dot:1420349732810919988>",
  "music": "<:musicd:1420267943232798720>",
  "right": "<:right:1420268155015532707>",
  "left": "<:left:1420268156395589773>",
  "loading": "<a:loading:1420268162129072129>",
  "volume": "<:arsenic_voice:1419607904851460116>",
  "shield": "<:arsenic_shield:1419607283603865600>",
  "welcome": "<a:welcome:1420627511028744203>",
  "vote": "<:topgg:1423164626195054683>",
  get(name, fallback = '') {
    return this[name] || fallback;
  },
};

export default emoji;
