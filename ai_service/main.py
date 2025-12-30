import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# LangChain Imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser

# 1. Load Environment Variables 
load_dotenv()

# 2. Initialize FastAPI
app = FastAPI()

# 3. Setup Gemini Model
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3, # Lower temperature = more factual answers
    convert_system_message_to_human=True
)

# 4. Define Data Models (What we expect to receive)
class ChatMessage(BaseModel):
    role: str       # "user" or "ai"
    content: str    # The actual message text

class ChatRequest(BaseModel):
    context: str                # The text of the document
    question: str               # The new question
    history: List[ChatMessage]  # The previous conversation

# 5. The Chat Endpoint
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Step A: Convert the raw history list into LangChain's format
        # LangChain needs to know specifically which message is Human vs AI
        langchain_history = []
        for msg in request.history:
            if msg.role == "user":
                langchain_history.append(HumanMessage(content=msg.content))
            else:
                langchain_history.append(AIMessage(content=msg.content))

        # Step B: Create the Prompt Template
        # We tell the AI: "Here is the document (context). Here is what we talked about (history). Answer the new question."
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful tutor. Answer the question based ONLY on the following context:\n\n{context}"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}")
        ])

        # Step C: Create the Chain (Prompt -> AI -> Text)
        chain = prompt | llm | StrOutputParser()

        # Step D: Run it!
        response = chain.invoke({
            "context": request.context,
            "chat_history": langchain_history,
            "question": request.question
        })

        return {"answer": response}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 6. Run the server if this file is executed directly
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)