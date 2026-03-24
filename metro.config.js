const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude .local directory from Metro's file watcher to prevent crashes
// from temporary Replit skill directories being created/deleted
config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.includes(".local")
);

config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList ? [config.resolver.blockList].flat() : []),
    new RegExp(path.resolve(__dirname, ".local").replace(/\\/g, "\\\\") + "/.*"),
  ],
};

module.exports = config;
