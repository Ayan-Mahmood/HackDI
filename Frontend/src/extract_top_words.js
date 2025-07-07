const fs = require('fs');

// Read the cleaned data
const words = JSON.parse(fs.readFileSync('src/quranic_words_clean.json', 'utf8'));

console.log('Analyzing word frequencies...');

// Create frequency map
const wordFrequency = {};

words.forEach(word => {
  const arabic = word.arabic;
  const english = word.english;
  
  // Create a unique key for each Arabic-English pair
  const key = `${arabic}|${english}`;
  
  if (!wordFrequency[key]) {
    wordFrequency[key] = {
      arabic: arabic,
      english: english,
      count: 0,
      occurrences: []
    };
  }
  
  wordFrequency[key].count++;
  wordFrequency[key].occurrences.push({
    surah: word.surah,
    ayah: word.ayah,
    location: word.location
  });
});

// Convert to array and sort by frequency
const wordArray = Object.values(wordFrequency);
wordArray.sort((a, b) => b.count - a.count);

console.log(`Total unique words found: ${wordArray.length}`);

// Get top 500 words
const top500 = wordArray.slice(0, 500);

console.log(`\nTop 500 most frequent words:`);
console.log(`\nSample of top 20:`);
top500.slice(0, 20).forEach((word, index) => {
  console.log(`${index + 1}. ${word.arabic} - ${word.english} (${word.count} times)`);
});

// Create the final data structure for the learning feature
const learningWords = top500.map((word, index) => ({
  id: index + 1,
  rank: index + 1,
  arabic: word.arabic,
  english: word.english,
  frequency: word.count,
  occurrences: word.occurrences.slice(0, 5), // Keep first 5 occurrences
  totalOccurrences: word.count
}));

// Write to file
const outputPath = 'src/top_500_quranic_words.json';
fs.writeFileSync(outputPath, JSON.stringify(learningWords, null, 2));

console.log(`\nTop 500 words written to: ${outputPath}`);

// Show some statistics
const totalOccurrences = learningWords.reduce((sum, word) => sum + word.frequency, 0);
const avgFrequency = totalOccurrences / learningWords.length;

console.log(`\nStatistics:`);
console.log(`Total occurrences of top 500 words: ${totalOccurrences}`);
console.log(`Average frequency: ${avgFrequency.toFixed(2)}`);
console.log(`Most frequent word: ${learningWords[0].arabic} (${learningWords[0].english}) - ${learningWords[0].frequency} times`);
console.log(`500th most frequent word: ${learningWords[499].arabic} (${learningWords[499].english}) - ${learningWords[499].frequency} times`);

// Show frequency distribution
const frequencyRanges = {
  '100+ times': learningWords.filter(w => w.frequency >= 100).length,
  '50-99 times': learningWords.filter(w => w.frequency >= 50 && w.frequency < 100).length,
  '20-49 times': learningWords.filter(w => w.frequency >= 20 && w.frequency < 50).length,
  '10-19 times': learningWords.filter(w => w.frequency >= 10 && w.frequency < 20).length,
  '5-9 times': learningWords.filter(w => w.frequency >= 5 && w.frequency < 10).length,
  '1-4 times': learningWords.filter(w => w.frequency >= 1 && w.frequency < 5).length
};

console.log(`\nFrequency distribution:`);
Object.entries(frequencyRanges).forEach(([range, count]) => {
  console.log(`${range}: ${count} words`);
}); 