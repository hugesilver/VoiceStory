// babel-preset-expo를 반드시 남겨야함
module.exports = (api) => {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    env: {
      // 릴리스 빌드에만 error/warn을 남김
      production: {
        plugins: [["transform-remove-console", { exclude: ["error", "warn"] }]],
      },
    },
  };
};
