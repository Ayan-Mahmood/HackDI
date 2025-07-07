const fs = require('fs');

// Read the JSON files
const englishData = JSON.parse(fs.readFileSync('src/english-wbw-translation.json', 'utf8'));
const arabicData = JSON.parse(fs.readFileSync('src/qpc-hafs-word-by-word.json', 'utf8'));

console.log('Processing Quranic data...');
console.log(`English entries: ${Object.keys(englishData).length}`);
console.log(`Arabic entries: ${Object.keys(arabicData).length}`);

// Create a clean array of word pairs
const cleanWords = [];

// Process each key that exists in both files
Object.keys(englishData).forEach(key => {
  const englishTranslation = englishData[key];
  const arabicEntry = arabicData[key];
  
  // Skip if no Arabic entry exists
  if (!arabicEntry) {
    return;
  }
  
  // Skip if English translation is empty, null, or just numbers in parentheses
  if (!englishTranslation || 
      englishTranslation === '' || 
      englishTranslation === null ||
      /^\(\d+\)$/.test(englishTranslation)) {
    return;
  }
  
  // Skip if Arabic text is empty or just numbers
  if (!arabicEntry.text || 
      arabicEntry.text === '' || 
      /^\d+$/.test(arabicEntry.text)) {
    return;
  }
  
  // Create clean word object
  const wordObject = {
    id: arabicEntry.id,
    surah: parseInt(arabicEntry.surah),
    ayah: parseInt(arabicEntry.ayah),
    word: parseInt(arabicEntry.word),
    location: arabicEntry.location,
    arabic: arabicEntry.text,
    english: englishTranslation.trim()
  };
  
  cleanWords.push(wordObject);
});

// Sort by surah, then ayah, then word
cleanWords.sort((a, b) => {
  if (a.surah !== b.surah) return a.surah - b.surah;
  if (a.ayah !== b.ayah) return a.ayah - b.ayah;
  return a.word - b.word;
});

console.log(`Clean words created: ${cleanWords.length}`);

// Write to file
const outputPath = 'src/quranic_words_clean.json';
fs.writeFileSync(outputPath, JSON.stringify(cleanWords, null, 2));

console.log(`\nCleaned data written to: ${outputPath}`);
console.log(`\nSample entries:`);
console.log(JSON.stringify(cleanWords.slice(0, 5), null, 2));

// Show some statistics
const surahCounts = {};
cleanWords.forEach(word => {
  surahCounts[word.surah] = (surahCounts[word.surah] || 0) + 1;
});

console.log(`\nWords per surah (first 10):`);
Object.keys(surahCounts).slice(0, 10).forEach(surah => {
  console.log(`Surah ${surah}: ${surahCounts[surah]} words`);
}); 