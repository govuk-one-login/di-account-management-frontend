import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
	input: 'dist/public/scripts/application.js',
	output: {
		file: 'dist/public/scripts/application.js',
		sourcemap: true
	},
  plugins: [nodeResolve()]
};

