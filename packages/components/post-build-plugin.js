const fs = require('fs');
const path = require('path');

const folderPath = './dist/components';
const cssFilePath = './dist/components/css.js';
let countFileRead = 0
// Функция для поиска файлов в папке
function getFilesInDirectory(dir) {
  const files = fs.readdirSync(dir);
  return files.filter(file => file.endsWith('.js'));
}

// Функция для обработки одного файла
function processFile(filePath, cssContent) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  const updatedContent = fileContent.replace(/const\s+(\w+Css)\s*=\s*(`[^`]*`|".*?"|'.*?')(?:\s*;|(\s*\/\/.*?))?(?=\s*const|$)/g, (match, varName, varValue) => {
    // Сохраняем CSS переменные и их значения в cssContent
    if (countFileRead === 0) {
        cssContent.push(`export const baseCss = ${varValue};`);
        countFileRead = countFileRead + 1;
    }
    // Возвращаем строку с импортом из css.js
    return `import { baseCss } from './css.js';\nconst ${varName} = baseCss;\n`;
});

  // Записываем изменения обратно в файл
  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

function main() {
  const cssContent = [];
  const files = getFilesInDirectory(folderPath);

  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    processFile(filePath, cssContent);
  });

  // Записываем собранные CSS переменные в css.js
  fs.writeFileSync(cssFilePath, cssContent.join('\n'), 'utf8');
  console.log('Готово! Все CSS переменные перенесены в css.js.');
}

main();





