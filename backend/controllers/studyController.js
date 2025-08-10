import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import multer from "multer";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import mammoth from "mammoth";
import Document from "../models/Document.js";

// --- Multer setup for file uploads ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const uploadMiddleware = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit as per project plan
  }
});

// --- Text chunking function ---
function chunkText(text, maxChunkSize = 4000) {
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = '';

  for (const word of words) {
    if ((currentChunk + ' ' + word).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        chunks.push(word);
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// --- File parsing functions ---
async function parsePDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF file');
  }
}

async function parseWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  } catch (error) {
    console.error('Word parsing error:', error);
    throw new Error('Failed to parse Word document');
  }
}

function parseText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error('Text parsing error:', error);
    throw new Error('Failed to parse text file');
  }
}

// --- Enhanced Gemini analysis function ---
async function analyzeWithGemini(content, type = "summary") {
  // Check if content needs chunking
  const maxContentLength = 4000;
  let result = "";

  if (content.length > maxContentLength) {
    // Chunk the content and analyze each chunk
    const chunks = chunkText(content, maxContentLength);
    const chunkResults = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = await analyzeSingleChunk(chunks[i], type, i + 1, chunks.length);
      chunkResults.push(chunkResult);
    }

    // Combine results
    result = await combineChunkResults(chunkResults, type);
  } else {
    // Analyze single content
    result = await analyzeSingleChunk(content, type);
  }

  return {
    type,
    result,
    wordCount: content.split(' ').length,
    textLength: content.length,
    timestamp: new Date().toISOString()
  };
}

async function analyzeSingleChunk(content, type, chunkNumber = 1, totalChunks = 1) {
  let prompt = "";
  
  const chunkPrefix = totalChunks > 1 ? `[Part ${chunkNumber} of ${totalChunks}] ` : "";
  
  switch (type) {
    case "summary":
      prompt = `${chunkPrefix}Please provide a clear and concise summary of the following content, highlighting the main points and key information:\n\n${content}`;
      break;
    case "explanation":
      prompt = `${chunkPrefix}Please explain the following content in simple, easy-to-understand terms. Break down complex concepts and provide clear explanations:\n\n${content}`;
      break;
    case "quiz":
      prompt = `${chunkPrefix}Based on the following content, generate 5-7 multiple choice questions to test understanding. Include the correct answers and explanations:\n\n${content}`;
      break;
    case "keywords":
      prompt = `${chunkPrefix}Extract the most important keywords and key phrases from the following content. Organize them by relevance and importance:\n\n${content}`;
      break;
    default:
      prompt = `${chunkPrefix}Analyze the following content and provide insights based on the task "${type}":\n\n${content}`;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected API response structure:", data);
      throw new Error("Empty or invalid response from Gemini API");
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    throw new Error("Error calling Gemini API: " + err.message);
  }
}

async function combineChunkResults(chunkResults, type) {
  const combinedContent = chunkResults.join('\n\n---\n\n');
  
  let combinePrompt = "";
  switch (type) {
    case "summary":
      combinePrompt = `Please combine and synthesize the following summaries into one comprehensive summary:\n\n${combinedContent}`;
      break;
    case "explanation":
      combinePrompt = `Please combine the following explanations into one coherent, comprehensive explanation:\n\n${combinedContent}`;
      break;
    case "quiz":
      combinePrompt = `Please combine and organize the following quiz questions, removing duplicates and ensuring variety:\n\n${combinedContent}`;
      break;
    case "keywords":
      combinePrompt = `Please combine and organize the following keyword lists, removing duplicates and ranking by importance:\n\n${combinedContent}`;
      break;
    default:
      return combinedContent;
  }

  try {
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + process.env.GEMINI_API_KEY;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: combinePrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Error combining chunks, using fallback");
      return combinedContent;
    }

    const data = await response.json();

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return combinedContent;
    }
  } catch (err) {
    console.error("Error combining chunks:", err);
    return combinedContent;
  }
}

// --- Get available analysis types ---
export const getAnalysisTypes = (req, res) => {
  const analysisTypes = [
    {
      type: "summary",
      name: "Summary",
      description: "Get a concise summary of the main points and key information"
    },
    {
      type: "explanation", 
      name: "Explanation",
      description: "Get simple, easy-to-understand explanations of complex concepts"
    },
    {
      type: "quiz",
      name: "Quiz Generation", 
      description: "Generate multiple choice questions to test understanding"
    },
    {
      type: "keywords",
      name: "Keywords Extraction",
      description: "Extract important keywords and key phrases organized by relevance"
    }
  ];

  res.json({
    success: true,
    analysisTypes,
    supportedFileTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword", 
      "text/plain"
    ]
  });
};

// --- Analyze plain text ---
export const analyzeText = async (req, res) => {
  try {
    const { text, task } = req.body;
    
    if (!text || !task) {
      return res.status(400).json({ message: "Missing text or task type" });
    }

    if (text.length < 10) {
      return res.status(400).json({ message: "Text is too short for meaningful analysis" });
    }

    if (text.length > 5000) {
      return res.status(400).json({ message: "Text is too long. Maximum 5000 characters allowed." });
    }

    const validTasks = ["summary", "explanation", "quiz", "keywords"];
    if (!validTasks.includes(task)) {
      return res.status(400).json({ 
        message: "Invalid task type. Valid options: " + validTasks.join(", ") 
      });
    }

    const analysis = await analyzeWithGemini(text, task);
    
    res.json({ 
      success: true, 
      analysis,
      textInfo: {
        length: text.length,
        wordCount: text.split(' ').length
      }
    });
  } catch (err) {
    console.error("Text analysis error:", err);
    res.status(500).json({ message: "Error analyzing text: " + err.message });
  }
};

// --- Get user's documents ---
export const getUserDocuments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const documents = await Document.find({ userId: req.user._id })
      .select('-extractedText') // Exclude large text content
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments({ userId: req.user._id });

    res.json({
      success: true,
      documents,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: documents.length,
        totalDocuments: total
      }
    });
  } catch (err) {
    console.error("Get documents error:", err);
    res.status(500).json({ message: "Error fetching documents" });
  }
};

// --- Get specific document ---
export const getDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      success: true,
      document
    });
  } catch (err) {
    console.error("Get document error:", err);
    res.status(500).json({ message: "Error fetching document" });
  }
};

// --- Re-analyze document with different task ---
export const reAnalyzeDocument = async (req, res) => {
  try {
    const { task } = req.body;
    const validTasks = ["summary", "explanation", "quiz", "keywords"];
    
    if (!validTasks.includes(task)) {
      return res.status(400).json({ 
        message: "Invalid task type. Valid options: " + validTasks.join(", ") 
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if this analysis already exists
    const existingAnalysis = document.analyses.find(a => a.taskType === task);
    if (existingAnalysis) {
      return res.json({
        success: true,
        analysis: {
          type: task,
          result: existingAnalysis.result,
          timestamp: existingAnalysis.timestamp
        },
        message: "Using existing analysis"
      });
    }

    // Perform new analysis
    const analysis = await analyzeWithGemini(document.extractedText, task);

    // Add new analysis to document
    document.analyses.push({
      taskType: task,
      result: analysis.result,
      timestamp: new Date()
    });
    await document.save();

    res.json({
      success: true,
      analysis,
      message: "New analysis completed"
    });
  } catch (err) {
    console.error("Re-analyze document error:", err);
    res.status(500).json({ message: "Error re-analyzing document" });
  }
};

// --- Delete document ---
export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete physical file
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ message: "Error deleting document" });
  }
};

// --- Analyze uploaded document ---
export const analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join(uploadFolder, req.file.filename);
    let textContent = "";

    // Parse different file types
    try {
      if (req.file.mimetype === "application/pdf") {
        textContent = await parsePDF(filePath);
      } else if (
        req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        req.file.mimetype === "application/msword"
      ) {
        textContent = await parseWord(filePath);
      } else if (req.file.mimetype === "text/plain") {
        textContent = parseText(filePath);
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      if (!textContent || textContent.length < 10) {
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "Could not extract meaningful text from the file" });
      }

      // Run Gemini analysis
      const { task } = req.body;
      const validTasks = ["summary", "explanation", "quiz", "keywords"];
      const analysisTask = validTasks.includes(task) ? task : "summary";
      
      const analysis = await analyzeWithGemini(textContent, analysisTask);

      // Save document to database if user is authenticated
      let document = null;
      if (req.user) {
        document = new Document({
          userId: req.user._id,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          filePath: filePath,
          extractedText: textContent,
          textLength: textContent.length,
          analyses: [{
            taskType: analysisTask,
            result: analysis.result,
            timestamp: new Date()
          }]
        });
        await document.save();
      } else {
        // Clean up file if no user (test route)
        fs.unlinkSync(filePath);
      }

      res.json({ 
        success: true, 
        analysis,
        documentId: document ? document._id : null,
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype,
          textLength: textContent.length
        }
      });

    } catch (parseError) {
      // Clean up file if parsing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error("File parsing error:", parseError);
      return res.status(400).json({ 
        message: "Error processing file: " + parseError.message 
      });
    }

  } catch (err) {
    console.error("File analysis error:", err);
    res.status(500).json({ message: "Error analyzing file: " + err.message });
  }
};
