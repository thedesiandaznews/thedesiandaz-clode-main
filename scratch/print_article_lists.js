const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const parsed = JSON.parse(lines[i]);
      const lineStr = JSON.stringify(parsed);
      
      // Look for mentions of "Article" or "dev.db" or "db push" or list of articles
      if (lineStr.includes('"title":"') && lineStr.includes('"id":"') && parsed.step_index < 1430) {
        console.log(`[Step ${parsed.step_index}] Contains articles data (Length: ${lineStr.length})`);
        // Let's find matches of titles
        const matches = lineStr.match(/"title":"[^"]+"/g);
        if (matches) {
          console.log("Titles found:", matches.slice(0, 10));
        }
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
