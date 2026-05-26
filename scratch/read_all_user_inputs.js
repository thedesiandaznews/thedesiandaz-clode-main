const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');
  console.log("Total lines:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.source === "USER_EXPLICIT") {
        console.log(`[Step ${parsed.step_index}] At ${parsed.created_at}:`);
        console.log("User Input:", parsed.content);
        console.log("-----------------------------------------");
      }
    } catch(e) {
      // ignore parse error for incomplete lines
    }
  }
} catch (err) {
  console.error(err);
}
