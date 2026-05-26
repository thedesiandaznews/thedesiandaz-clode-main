const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  console.log("Total lines:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes("old") && line.includes("news")) {
      console.log(`\n=== Line ${i + 1} ===`);
      try {
        const parsed = JSON.parse(lines[i]);
        console.log(`[Step ${parsed.step_index}] Source: ${parsed.source}, Type: ${parsed.type}`);
        if (parsed.content) {
          console.log("Content:", parsed.content.slice(0, 500));
        }
      } catch(e) {
        console.log(`Failed to parse line ${i + 1}:`, lines[i].slice(0, 200));
      }
    }
  }
} catch (err) {
  console.error(err);
}
