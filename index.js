const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const readline = require("readline");
const dotenv = require("dotenv");
const axios = require("axios");
const Spinner = require("cli-spinner").Spinner;

dotenv.config();

const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

(async () => {
  let question = process.argv[2];
  let fileOrDir = process.argv[3];
  let max_tokens = process.argv[4];

  if (!question || !fileOrDir) {
    console.log(
      "Please ask a question about a file or directory. Format: npm run file <question-required> <file-or-directory-required>"
    );
    process.exit(1);
  }

  let fileIdentifier = generateFileIdentifier(fileOrDir);
  let previousConversation = loadConversationFromFile(fileIdentifier);

  const isDirectory = fs.statSync(fileOrDir).isDirectory();
  let fileContents = "";

  if (isDirectory) {
    const filePaths = walkDirectory(fileOrDir);
    filePaths.forEach((filePath) => {
      const fileExtension = path.extname(filePath);
      fileContents += `FILE_NAME: ${filePath}\nFILE_TYPE: ${fileExtension}\nFILE_CONTENT:\n${fs.readFileSync(
        filePath,
        "utf8"
      )}\n---\n`;
    });
  } else {
    fileContents = `FILE_NAME: ${fileOrDir}\nFILE_CONTENT: ${fs.readFileSync(
      fileOrDir,
      "utf8"
    )}`;
  }

  const userMessage = {
    role: "user",
    content: `QUESTION: ${question}\n${fileContents}\nPlease provide a Node.js script that makes the changes requested. It should be a stand-alone script that I can run directly to apply the suggested changes.`,
  };

  let messages;
  if (previousConversation) {
    messages = previousConversation.concat(userMessage);
  } else {
    messages = [
      {
        role: "system",
        content:
          "You are an AI assistant that specializes in working with file data, specifically code files. You can provide code suggestions, detect errors, and answer questions related to the code.",
      },
      userMessage,
    ];
  }

  let options = {};
  if (max_tokens) {
    options = { max_tokens: parseInt(max_tokens) };
  }

  console.log(question);
  console.log("Sending request to ChatGPT-4...");
  const spinner = new Spinner("Waiting for response... %s");
  spinner.setSpinnerString("|/-\\");
  spinner.start();

  const answer = await createChatCompletion(messages, options);

  spinner.stop(true);

  const codeBlockRegex = /```(?:js|javascript)?\s*([\s\S]*?)```/g;
  const codeBlocks = [...answer.matchAll(codeBlockRegex)];
  const returnedCode = codeBlocks
    .map((block) => block[1])
    .join("\n")
    .trim();
  console.log("answer:\n");
  console.log(answer);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Press SPACE to apply changes, or any other key to exit.");

  // Listen for keypress events
  rl.input.on("keypress", (str, key) => {
    if (key.name === "space") {
      // Save the validated code snippet to a file
      fs.writeFileSync("gpt_changes.js", returnedCode);

      // Run the saved script to make changes to the file(s)
      child_process.exec("node gpt_changes.js", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing the script: ${error}`);
          return;
        }
        console.log(`Script output: ${stdout}`);
      });
    }
    rl.close();
  });

  // Save the conversation for future use
  saveConversationToFile(fileIdentifier, messages);
})();

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      fileList = walkDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function generateFileIdentifier(fileOrDir) {
  const sanitizedPath = fileOrDir
    .replace(/\\/g, "_") // Replace backslashes with underscores
    .replace(/\//g, "_") // Replace forward slashes with underscores
    .replace(/[^a-zA-Z0-9_\-]/g, ""); // Remove any other special characters

  return sanitizedPath;
}

function loadConversationFromFile(identifier) {
  const conversationPath = `./conversations/${identifier}.json`;

  if (fs.existsSync(conversationPath)) {
    return JSON.parse(fs.readFileSync(conversationPath, "utf8"));
  } else {
    return null;
  }
}

function saveConversationToFile(identifier, conversation) {
  const conversationsDir = "./conversations";
  const conversationPath = `${conversationsDir}/${identifier}.json`;

  // Ensure the conversations directory exists
  if (!fs.existsSync(conversationsDir)) {
    fs.mkdirSync(conversationsDir);
  }

  fs.writeFileSync(conversationPath, JSON.stringify(conversation, null, 2));
}

async function createChatCompletion(
  messages,
  { temperature = 0.8, max_tokens = 1000 }
) {
  const options = {
    temperature,
    max_tokens,
  };

  try {
    const response = await openai.post("/chat/completions", {
      model: options.model || "gpt-4",
      messages,
      ...options,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error creating chat completion:", error);
    console.log(error.response.data);
  }
}
