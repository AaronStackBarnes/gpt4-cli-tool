# Overview

This is a Node.js script that interacts with the OpenAI API to ask questions about specified files or directories. The AI returns answers and, if requested, generates a stand-alone Node.js script to apply the changes.

## Requirements

- Node.js installed
- An OpenAI API key

## Installation

1. Clone the repository
2. Navigate to the `gpt4-cli-tool` folder
3. Run `npm install` to install the required dependencies
4. Run `npm run link` to link the command-line tool for global usage

## Usage

To use the script, run the following command:

```
gpt4-cli-tool <question> <file-or-directory>
```

The script will send a request to the OpenAI API with the specified question and file or directory information. The AI will return an answer, and if requested, a stand-alone Node.js script to apply the changes. Press SPACE to apply the changes, or any other key to exit.

## Uninstallation

To unlink the command-line tool from global usage, navigate to the `gpt4-cli-tool` folder and run:

```
npm run unlink
```

## Modules

The script uses the following Node.js modules:

- **fs**: for interacting with the file system
- **path**: for working with file paths
- **child_process**: for executing shell commands
- **readline**: for reading user inputs
- **dotenv**: for working with environment variables
- **axios**: for sending HTTP requests
- **cli-spinner**: for displaying a spinner while waiting for the API response

## Functions

- **walkDirectory**: Recursively walks a directory and returns an array of file paths
- **generateFileIdentifier**: Generates a unique identifier for a given file or directory
- **loadConversationFromFile**: Loads a previous conversation from a file
- **saveConversationToFile**: Saves a conversation to a file
- **createChatCompletion**: Sends a request to the OpenAI API and returns the completion response

## Notes

- The OpenAI API key should be stored in a `.env` file with the variable name `OPENAI_API_KEY`.
- Conversations with the AI are saved to the `./conversations` directory for future use.





