import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/bundle.js',
            format: 'cjs', // формат CommonJS для использования с Node.js
            sourcemap: true,
        },
        {
            file: 'dist/bundle.esm.js',
            format: 'esm', // формат ECMAScript Module для использования с современными средами
            sourcemap: true,
        },
    ],
    plugins: [
        nodeResolve(), // Разрешение зависимостей Node.js
        commonjs(), // Преобразование CommonJS-модулей в ES6
        babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }), // Транспиляция с использованием Babel
    ],
    // external: ['@nostr-login/components'],
};