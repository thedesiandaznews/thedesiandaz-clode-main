const fs = require('fs');

const logFile = "C:\\Users\\sonuk\\.gemini\\antigravity\\brain\\0a73fe2d-a088-499d-9e79-348c4f2a3376\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logFile, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const parsed = JSON.parse(lines[i]);
      if (parsed.type === "RUN_COMMAND" || (parsed.tool_calls && parsed.tool_calls.some(tc => tc.name === "run_command"))) {
        const cmdStr = parsed.tool_calls?.[0]?.args?.CommandLine || "";
        if (cmdStr.includes("prisma") || cmdStr.includes("db") || cmdStr.includes("migrate") || cmdStr.includes("seed")) {
          console.log(`[Step ${parsed.step_index}] CMD: ${cmdStr}`);
          if (parsed.content) {
            console.log("Result:", parsed.content.slice(0, 300));
          }
          console.log("-----------------------------------------");
        }
      }
    } catch(e) {}
  }
} catch (err) {
  console.error(err);
}
