require('dotenv').config();
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const dotenv = require("dotenv");
dotenv.config();


async function categorizeWithGPT(sentence) {
  const categories = ["رياضة", "تكنولوجيا", "سياسة", "ثقافة", "تعليم", "أخرى"];

const prompt = `
صنّف الجملة التالية في واحدة فقط من الفئات التالية (اختر واحدة فقط وأجب باسم الفئة فقط بدون أي شرح): 
رياضة، تكنولوجيا، سياسة، ثقافة، تعليم، أخرى

الجملة: "${sentence}"
`;


  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("🔍 GPT raw response:", chatResponse.choices[0].message.content);

    const category = chatResponse.choices[0].message.content.trim().toLowerCase();
    return categories.includes(category) ? category : "أخرى";
  } catch (error) {
    console.error("Error in GPT categorization:", error);
    return "أخرى";
  }
}

module.exports = { categorizeWithGPT };
