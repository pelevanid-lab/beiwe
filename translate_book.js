const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY="?([^"\n]+)"?/);
const apiKey = keyMatch ? keyMatch[1] : null;

if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const sourcePath = path.join(__dirname, 'src', 'content', 'books', 'tr.md');
const sourceContent = fs.readFileSync(sourcePath, 'utf8');

const targetLanguages = {
  'en': 'English',
  'ru': 'Russian',
  'uk': 'Ukrainian'
};

async function translate() {
  for (const [langCode, langName] of Object.entries(targetLanguages)) {
    const targetPath = path.join(__dirname, 'src', 'content', 'books', `${langCode}.md`);
    if (fs.existsSync(targetPath)) {
      console.log(`${langCode}.md already exists, skipping.`);
      continue;
    }
    
    console.log(`Translating to ${langName}...`);
    try {
      const prompt = `Translate the following markdown document from Turkish to ${langName}. Preserve all markdown formatting, headers, bold/italics, and structure exactly as it is. Do NOT add any extra text or comments. Just output the translated markdown.\n\n${sourceContent}`;
      
      const result = await model.generateContent(prompt);
      const translatedText = result.response.text();
      
      // Basic cleanup in case the LLM returned markdown code blocks around the text
      const cleanText = translatedText.replace(/^```markdown\n/, '').replace(/\n```$/, '');
      
      fs.writeFileSync(targetPath, cleanText, 'utf8');
      console.log(`Successfully translated to ${langName}.`);
    } catch (e) {
      console.error(`Failed to translate to ${langName}:`, e);
    }
  }
}

translate();
