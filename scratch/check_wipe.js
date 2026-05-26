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
      if (lineStr.includes("delete") || lineStr.includes("wipe") || lineStr.includes("clear") || lineStr.includes("reset")) {
        if (parsed.type === "RUN_COMMAND") {
          console.log(`[Step ${parsed.step_index}] Command: ${parsed.tool_calls?.[0]?.args?.CommandLine || parsed.content}`);
        }
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
