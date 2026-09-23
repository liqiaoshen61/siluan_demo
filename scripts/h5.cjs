const { spawnSync } = require('node:child_process');
const path = require('node:path');
const result = spawnSync(process.execPath, [require.resolve('@dcloudio/vite-plugin-uni/bin/uni.js'), ...(process.argv[2] === 'build' ? ['build'] : []), '-p', 'h5'], {
  stdio: 'inherit',
  env: { ...process.env, UNI_INPUT_DIR: path.resolve(__dirname, '..'), UNI_OUTPUT_DIR: path.resolve(__dirname, '../dist/h5') },
});
process.exit(result.status ?? 1);
