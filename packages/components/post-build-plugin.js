const fs = require('fs');
const path = require('path');

const folderPath = './dist/components';
const cssFilePath = './dist/components/css.js';
let countFileRead = 0;

// Function to get all JavaScript files in the directory
function getFilesInDirectory(dir) {
  const files = fs.readdirSync(dir);
  return files.filter(file => file.endsWith('.js')); // Filter out only .js files
}

// Function to process a single file
function processFile(filePath, cssContent) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Replace the CSS variable declarations and import them from css.js
  const updatedContent = fileContent.replace(/const\s+(\w+Css)\s*=\s*(`[^`]*`|".*?"|'.*?')(?:\s*;|(\s*\/\/.*?))?(?=\s*const|$)/g, (match, varName, varValue) => {
    // Save CSS variables and their values in cssContent
    if (countFileRead === 0) {
        cssContent.push(`export const baseCss = ${varValue};`);
        countFileRead = countFileRead + 1;
    }
    // Return the string with the import from css.js
    return `import { baseCss } from './css.js';\nconst ${varName} = baseCss;\n`;
  });

  // Write the modified content back to the file
  fs.writeFileSync(filePath, updatedContent, 'utf8');
}

// Main function to process all files
function main() {
  const cssContent = [];
  const files = getFilesInDirectory(folderPath);

  files.forEach(file => {
    const filePath = path.join(folderPath, file);
    processFile(filePath, cssContent);
  });

  // Write collected CSS variables to css.js
  fs.writeFileSync(cssFilePath, cssContent.join('\n'), 'utf8');
  console.log('Done! All CSS variables have been moved to css.js.');
}

main();
