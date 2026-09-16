const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude Replit-managed temporary directories from Metro's file watcher.
// Their contents can be created and removed while Metro is walking the tree.
const ignoredDirectories = [".local", ".config", ".cache"];

config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !ignoredDirectories.some(directory => folder.includes(directory))
);

config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver?.blockList ? [config.resolver.blockList].flat() : []),
    ...ignoredDirectories.map(
      directory => new RegExp(path.resolve(__dirname, directory).replace(/\\/g, "\\\\") + "/.*"),
    ),
  ],
};

module.exports = config;
