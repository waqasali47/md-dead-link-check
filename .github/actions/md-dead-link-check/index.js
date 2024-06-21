const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const markdownLinkExtractor = require('markdown-link-extractor');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const docsPath = process.env.DOCS_PATH || './docs';
const jwtToken = process.env.JWT_TOKEN;

const checkLink = async (url) => {
  try {
    const config = {};
      config.headers = { Authorization: `Bearer ${jwtToken}` };
    const response = await axios.get(url, config);
    if (response.status === 404) {
      throw new Error(`Dead link found: ${url}`);
    }
  } catch (error) {
    // Log the error and rethrow to handle it in the calling function
    console.error(`Error checking link ${url}: ${error.message}`);
    throw error;
  }
};

const checkLinksInMarkdown = async (filePath) => {
  const markdown = await readFile(filePath, 'utf8');
  const links = markdownLinkExtractor(markdown);
  await Promise.all(links.map(checkLink));
};

const run = async () => {
  try {
    const files = await readdir(docsPath);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));
    for (const file of markdownFiles) {
      await checkLinksInMarkdown(path.join(docsPath, file));
    }
    console.log('All links checked successfully.');
  } catch (error) {
    process.exit(1);
  }
};

run();
