const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.step_index < 1420) {
        const text = JSON.stringify(parsed);
        if (text.includes("election commission") || text.includes("crpf") || text.includes("article") || text.includes("news")) {
          // Let's print if it mentions articles list or output
          if (parsed.type === "RUN_COMMAND" && parsed.content && parsed.content.includes("total")) {
            console.log(`[Step ${parsed.step_index}] Command output:`, parsed.content.slice(0, 500));
          }
          if (parsed.type === "VIEW_FILE" && parsed.content && parsed.content.includes("demo-")) {
            console.log(`[Step ${parsed.step_index}] View file snippet:`, parsed.content.slice(0, 500));
          }
        }
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
