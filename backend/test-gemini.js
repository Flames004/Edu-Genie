import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPI() {
  console.log('Testing Gemini API...');
  console.log('API Key present:', !!process.env.GEMINI_API_KEY);
  console.log('API Key preview:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

  const prompt = "Summarize this text: Artificial intelligence is a rapidly growing field.";
  
  // Try different API endpoints
  const endpoints = [
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"
  ];
  
  for (const endpoint of endpoints) {
    console.log('\n--- Testing endpoint:', endpoint);
    
    try {
      const apiUrl = endpoint + "?key=" + process.env.GEMINI_API_KEY;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      console.log('Response status:', response.status);

      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates.length > 0) {
        console.log('SUCCESS: Got response from Gemini API');
        console.log('Result:', data.candidates[0].content.parts[0].text);
        console.log('Working endpoint:', endpoint);
        break;
      } else {
        console.log('Failed with:', data.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Test failed:', error.message);
    }
  }
}

testGeminiAPI();
