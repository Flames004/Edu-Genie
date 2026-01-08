import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware # Added for safety
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# MongoDB & AI Imports
from pymongo import MongoClient
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. Configuration
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI") 
DB_NAME = "edugenie"
COLLECTION_NAME = "vector_store"

app = FastAPI()

# Enable CORS to allow requests from Node.js/Frontend if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Setup Database & AI
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004", 
    google_api_key=os.getenv("GEMINI_API_KEY")
)

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.3,
    convert_system_message_to_human=True
)

# Connect to the Atlas Vector Store
vector_store = MongoDBAtlasVectorSearch(
    collection=collection,
    embedding=embeddings,
    index_name="vector_index", 
    relevance_score_fn="cosine"
)

# --- Data Models ---
class IngestRequest(BaseModel):
    document_id: str
    text: str

class ChatRequest(BaseModel):
    document_id: str
    question: str
    history: List[dict]

# --- Endpoints ---

@app.post("/ingest")
async def ingest_endpoint(request: IngestRequest):
    try:
        # 1. Split text
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        # We explicitly set metadata, but LangChain might flatten it. 
        # Since debug showed Root, we trust the DB state.
        chunks = text_splitter.create_documents(
            texts=[request.text], 
            metadatas=[{"document_id": request.document_id}] 
        )

        # 2. Add to Vector Store
        vector_store.add_documents(chunks)
        
        return {"status": "success", "chunks_created": len(chunks)}

    except Exception as e:
        print(f"Ingest Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # 1. Search Vector Store (Using ROOT 'document_id')
        # We search for the String ID directly.
        results = vector_store.similarity_search(
            request.question,
            k=5,
            pre_filter={"document_id": {"$eq": request.document_id}} 
        )

        if not results:
            # Fallback for debugging: If root fails, try metadata (Just in case)
            print("Root search failed, trying metadata fallback...")
            results = vector_store.similarity_search(
                request.question,
                k=5,
                pre_filter={"metadata.document_id": {"$eq": request.document_id}} 
            )

        if not results:
            return {"answer": "I cannot find any content for this document. It might still be processing."}

        # 2. Retriever (Dynamic Choice based on what we found above)
        # Ideally we stick to one, but since we are fixing a mismatch, let's match the working filter.
        # For now, we enforce ROOT because your debug script proved it.
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 5,
                "pre_filter": { "document_id": { "$eq": request.document_id } }
            }
        )

        history_messages = []
        for msg in request.history:
            if msg.get("role") == "user":
                history_messages.append(HumanMessage(content=msg.get("content")))
            elif msg.get("role") == "ai":
                history_messages.append(AIMessage(content=msg.get("content")))

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful tutor. Answer the question based ONLY on the provided context:\n\n{context}"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
        ])
        
        chain = create_retrieval_chain(
            retriever, 
            create_stuff_documents_chain(llm, prompt_template)
        )

        response = chain.invoke({
            "input": request.question,
            "chat_history": history_messages
        })

        return {"answer": response["answer"]}

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)