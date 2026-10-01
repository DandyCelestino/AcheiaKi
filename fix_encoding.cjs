const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
  // Triple/Quadruple mojibake
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ¡': 'á',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ¢': 'â',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ£': 'ã',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ§': 'ç',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ©': 'é',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂª': 'ê',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ­': 'í',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ³': 'ó',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ´': 'ô',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂµ': 'õ',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂº': 'ú',
  'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÂ': 'à',
  
  // Double mojibake
  'ÃƒÂ¡': 'á',
  'ÃƒÂ¢': 'â',
  'ÃƒÂ£': 'ã',
  'ÃƒÂ§': 'ç',
  'ÃƒÂ©': 'é',
  'ÃƒÂª': 'ê',
  'ÃƒÂ­': 'í',
  'ÃƒÂ³': 'ó',
  'ÃƒÂ´': 'ô',
  'ÃƒÂµ': 'õ',
  'ÃƒÂº': 'ú',
  'ÃƒÂ': 'à',
  'ÃƒÂ§ÃƒÂ£': 'çã',
  'ÃƒÂ§ÃƒÂµ': 'çõ',

  // Single mojibake
  'Ã¡': 'á',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã§': 'ç',
  'Ã©': 'é',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã³': 'ó',
  'Ã´': 'ô',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã ': 'à',
  'Ã§Ã£': 'çã',
  'Ã§Ãµ': 'çõ',
  
  // Uppercase
  'ÃƒÂ': 'Á',
  'ÃƒÂ‚': 'Â',
  'ÃƒÂƒ': 'Ã',
  'ÃƒÂ‡': 'Ç',
  'ÃƒÂ‰': 'É',
  'ÃƒÂŠ': 'Ê',
  'ÃƒÂ': 'Í',
  'ÃƒÂ“': 'Ó',
  'ÃƒÂ”': 'Ô',
  'ÃƒÂ•': 'Õ',
  'ÃƒÂš': 'Ú',
  'ÃƒÂ€': 'À',

  'Ã': 'Á',
  'Ã‚': 'Â',
  'Ãƒ': 'Ã',
  'Ã‡': 'Ç',
  'Ã‰': 'É',
  'ÃŠ': 'Ê',
  'Ã': 'Í',
  'Ã“': 'Ó',
  'Ã”': 'Ô',
  'Ã•': 'Õ',
  'Ãš': 'Ú',
  'Ã€': 'À',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
      if (fullPath.includes('.backup')) continue; // Skip backup files
      
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('Ã')) {
        let newContent = content;
        for (const [bad, good] of Object.entries(replacements)) {
          newContent = newContent.split(bad).join(good);
        }
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Fixed: ${fullPath}`);
        }
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done');
