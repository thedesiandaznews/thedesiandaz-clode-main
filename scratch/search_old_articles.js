const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  console.log("Searching history...");
  
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const parsed = JSON.parse(lines[i]);
      const lineStr = JSON.stringify(parsed);
      
      // Look for article queries or lists before step 1428
      if (parsed.step_index < 1428 && (lineStr.includes('"title":"') || lineStr.includes('Articles:'))) {
        console.log(`\n=== Found at Step ${parsed.step_index} ===`);
        console.log(lineStr.slice(0, 1000));
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
