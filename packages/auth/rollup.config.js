import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
        },
        {
            file: 'dist/unpkg.js',
            format: 'iife',
            name: 'nostrLogin',
        }
    ],
    plugins: [
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        resolve({
            browser: true
        }),
        commonjs(),
    ],
};