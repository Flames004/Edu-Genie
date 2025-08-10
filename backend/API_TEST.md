## Test the Text Analysis API

Test this with a tool like Postman, Insomnia, or curl:

### Using curl:
```bash
curl -X POST http://localhost:5000/api/study/test/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. AI systems are designed to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.",
    "task": "summary"
  }'
```

### Using Postman:
1. Method: POST
2. URL: http://localhost:5000/api/study/test/text
3. Headers: Content-Type: application/json
4. Body (raw JSON):
```json
{
  "text": "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. AI systems are designed to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.",
  "task": "summary"
}
```

### Test different task types:
- "summary" - Get a concise summary
- "explanation" - Get detailed explanations
- "quiz" - Generate quiz questions
- "keywords" - Extract important keywords

The API should now work correctly with the updated Gemini endpoint!
