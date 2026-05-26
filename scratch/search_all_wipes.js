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
      if (lineStr.includes("wipeAdminMockData") || lineStr.includes("deleteMany") || lineStr.includes("wipe") || lineStr.includes("clear")) {
        console.log(`[Step ${parsed.step_index}] Source: ${parsed.source}, Type: ${parsed.type}`);
        if (parsed.content) {
          console.log("Content snippet:", parsed.content.slice(0, 500));
        }
        if (parsed.tool_calls) {
          console.log("Tool Calls:", JSON.stringify(parsed.tool_calls).slice(0, 500));
        }
        console.log("-----------------------------------------");
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
