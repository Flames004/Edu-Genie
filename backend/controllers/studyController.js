import fs from "fs";
import path from "path";
import crypto from "crypto";
import pdfParse from "pdf-parse";
import multer from "multer";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import mammoth from "mammoth";
import Document from "../models/Document.js";
import FlashcardResult from "../models/FlashcardResult.js";
import QuizResult from "../models/QuizResult.js";

// Security: File signature validation
const FILE_SIGNATURES = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    0x50, 0x4b,
  ], // PK
  "application/msword": [0xd0, 0xcf, 0x11, 0xe0], // DOC signature
  "text/plain": null, // No signature required
};

// --- Multer setup for file uploads ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Security: Validate file signature against declared MIME type
function validateFileSignature(filePath, mimeType) {
  try {
    const expectedSignature = FILE_SIGNATURES[mimeType];
    if (!expectedSignature) return true; // No signature check for text files

    const buffer = fs.readFileSync(filePath, {
      start: 0,
      end: expectedSignature.length,
    });
    const fileSignature = Array.from(buffer);

    // Check if file signature matches expected
    for (let i = 0; i < expectedSignature.length; i++) {
      if (fileSignature[i] !== expectedSignature[i]) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("File signature validation error:", error);
    return false;
  }
}

// Security: Sanitize filename to prevent directory traversal
function sanitizeFilename(originalName) {
  // Remove/replace dangerous characters
  const sanitized = originalName
    .replace(/[^a-zA-Z0-9\-_.]/g, "_") // Replace special chars
    .replace(/\.{2,}/g, "_") // Replace multiple dots
    .substring(0, 255); // Limit length

  // Generate unique secure filename
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return `${timestamp}_${randomSuffix}_${sanitized}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const secureFilename = sanitizeFilename(file.originalname);
    cb(null, secureFilename);
  },
});

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit as per project plan
  },
});

// --- Text chunking function ---
function chunkText(text, maxChunkSize = 4000) {
  const words = text.split(" ");
  const chunks = [];
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + " " + word).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        chunks.push(word);
      }
    } else {
      currentChunk += (currentChunk ? " " : "") + word;
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
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file");
  }
}

async function parseWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  } catch (error) {
    console.error("Word parsing error:", error);
    throw new Error("Failed to parse Word document");
  }
}

function parseText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8").trim();
  } catch (error) {
    console.error("Text parsing error:", error);
    throw new Error("Failed to parse text file");
  }
}

// --- Enhanced Gemini analysis function ---
async function analyzeWithGemini(content, type = "summary") {
  // Document length analysis and warnings
  const documentLength = content.length;
  const estimatedPages = Math.ceil(documentLength / 2500); // ~2500 chars per page
  const maxContentLength = 4000;

  // Warn about very long documents
  if (documentLength > 100000) {
    // ~40+ pages
    console.warn(
      `Processing large document: ${estimatedPages} pages, ${documentLength} characters`
    );
  }

  let result = "";

  if (content.length > maxContentLength) {
    // Adaptive chunking based on document size
    let chunkSize = maxContentLength;
    let maxChunks = 50; // Reasonable limit

    if (estimatedPages > 100) {
      // For very long documents, use larger chunks and limit processing
      chunkSize = 8000;
      maxChunks = 25;
      console.warn(
        `Large document detected: Using adaptive processing (${estimatedPages} pages)`
      );
    }

    // Chunk the content and analyze each chunk
    const chunks = chunkText(content, chunkSize);

    // Limit chunks for very long documents
    const chunksToProcess = chunks.slice(0, maxChunks);
    if (chunks.length > maxChunks) {
      console.warn(
        `Document too long: Processing first ${maxChunks} sections out of ${chunks.length}`
      );
    }

    const chunkResults = [];

    for (let i = 0; i < chunksToProcess.length; i++) {
      const chunkResult = await analyzeSingleChunk(
        chunksToProcess[i],
        type,
        i + 1,
        chunksToProcess.length
      );
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
    wordCount: content.split(" ").length,
    textLength: content.length,
    timestamp: new Date().toISOString(),
  };
}

async function analyzeSingleChunk(
  content,
  type,
  chunkNumber = 1,
  totalChunks = 1
) {
  let prompt = "";

  const chunkPrefix =
    totalChunks > 1 ? `[Part ${chunkNumber} of ${totalChunks}] ` : "";

  switch (type) {
    case "summary":
      prompt = `${chunkPrefix}Please provide a clear and concise summary of the following content, highlighting the main points and key information:\n\n${content}`;
      break;
    case "explanation":
      prompt = `${chunkPrefix}Please explain the following content in simple, easy-to-understand terms. Break down complex concepts and provide clear explanations:\n\n${content}`;
      break;
    case "quiz":
      prompt = `${chunkPrefix}Based on the following content, generate 5-7 multiple choice questions to test understanding. 

CRITICAL: Follow this EXACT format for each question:

Question 1: What is the main concept discussed in the content?
a) First option here
b) Second option here
c) Third option here
d) Fourth option here
**Correct Answer: c**
Explanation: Brief explanation of why this answer is correct.

Question 2: Which statement best describes the key principle?
a) First option here
b) Second option here
c) Third option here
d) Fourth option here
**Correct Answer: a**
Explanation: Brief explanation of why this answer is correct.

STRICT FORMATTING RULES:
1. Start each question with "Question [NUMBER]:" followed by the question text
2. Use lowercase letters a), b), c), d) for exactly 4 options
3. Put "**Correct Answer: [letter]**" on its own line (wrapped in double asterisks)
4. Add "Explanation:" followed by a brief reason
5. Leave a blank line between each complete question
6. Do NOT add any extra text, headers, or conclusions
7. Ensure each question is complete with all 4 options and answer

Content to analyze:
${content}`;
      break;
    case "keywords":
      prompt = `${chunkPrefix}Extract the most important keywords and key phrases from the following content. Organize them by relevance and importance:\n\n${content}`;
      break;
    case "flashcards":
      prompt = `${chunkPrefix}Based on the following content, create study flashcards with questions and answers to help learn the key concepts.

CRITICAL: Follow this EXACT format for each flashcard:

Card 1:
Front: What is the main concept or principle discussed?
Back: Clear, concise answer explaining the concept with key details.

Card 2:
Front: How does [specific concept] work?
Back: Step-by-step explanation or detailed description of the process.

Card 3:
Front: What are the key characteristics of [topic]?
Back: List or description of the main features and properties.

Card 4:
Front: Why is [concept/principle] important?
Back: Explanation of significance, applications, or benefits.

Card 5:
Front: When would you use [method/concept]?
Back: Practical applications and use cases with examples.

STRICT FORMATTING RULES:
1. Start each card with "Card [NUMBER]:" 
2. Use "Front:" followed by a clear, concise question
3. Use "Back:" followed by a comprehensive but focused answer
4. Leave a blank line between each complete card
5. Create 5-8 flashcards per chunk
6. Make questions specific and answers informative
7. Focus on key concepts, definitions, processes, and applications
8. Do NOT add extra text, headers, or conclusions

Content to analyze:
${content}`;
      break;
    default:
      prompt = `${chunkPrefix}Analyze the following content and provide insights based on the task "${type}":\n\n${content}`;
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured");
  }

  try {
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

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

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content
    ) {
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
  const combinedContent = chunkResults.join("\n\n---\n\n");

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
    case "flashcards":
      combinePrompt = `Please combine and organize the following flashcard sets, removing duplicates and ensuring variety. Maintain the exact format:

Card [NUMBER]:
Front: [Question]
Back: [Answer]

Rules:
1. Remove duplicate or very similar cards
2. Ensure good variety of question types
3. Keep the most important and useful cards
4. Maintain clear, concise questions and comprehensive answers
5. Number cards sequentially starting from Card 1
6. Limit to 10-15 final cards maximum

Flashcard sets to combine:
${combinedContent}`;
      break;
    default:
      return combinedContent;
  }

  try {
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      process.env.GEMINI_API_KEY;

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

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content
    ) {
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
      description:
        "Get a concise summary of the main points and key information",
    },
    {
      type: "explanation",
      name: "Explanation",
      description:
        "Get simple, easy-to-understand explanations of complex concepts",
    },
    {
      type: "quiz",
      name: "Quiz Generation",
      description: "Generate multiple choice questions to test understanding",
    },
    {
      type: "keywords",
      name: "Keywords Extraction",
      description:
        "Extract important keywords and key phrases organized by relevance",
    },
    {
      type: "flashcards",
      name: "Flashcards",
      description:
        "Create study flashcards with questions and answers for key concepts",
    },
  ];

  res.json({
    success: true,
    analysisTypes,
    supportedFileTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ],
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
      return res
        .status(400)
        .json({ message: "Text is too short for meaningful analysis" });
    }

    if (text.length > 25000) {
      return res.status(400).json({
        message: "Text is too long. Maximum 25,000 characters allowed.",
      });
    }

    const validTasks = [
      "summary",
      "explanation",
      "quiz",
      "keywords",
      "flashcards",
    ];
    if (!validTasks.includes(task)) {
      return res.status(400).json({
        message: "Invalid task type. Valid options: " + validTasks.join(", "),
      });
    }

    const analysis = await analyzeWithGemini(text, task);

    res.json({
      success: true,
      analysis,
      textInfo: {
        length: text.length,
        wordCount: text.split(" ").length,
      },
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
      .select("-extractedText") // Exclude large text content
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
        totalDocuments: total,
      },
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
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      success: true,
      document,
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
    const validTasks = [
      "summary",
      "explanation",
      "quiz",
      "keywords",
      "flashcards",
    ];

    if (!validTasks.includes(task)) {
      return res.status(400).json({
        message: "Invalid task type. Valid options: " + validTasks.join(", "),
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if this analysis already exists
    const existingAnalysis = document.analyses.find((a) => a.taskType === task);
    if (existingAnalysis) {
      return res.json({
        success: true,
        analysis: {
          type: task,
          result: existingAnalysis.result,
          timestamp: existingAnalysis.timestamp,
        },
        message: "Using existing analysis",
      });
    }

    // Perform new analysis
    const analysis = await analyzeWithGemini(document.extractedText, task);

    // Add new analysis to document
    document.analyses.push({
      taskType: task,
      result: analysis.result,
      timestamp: new Date(),
    });
    await document.save();

    res.json({
      success: true,
      analysis,
      message: "New analysis completed",
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
      userId: req.user._id,
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
      message: "Document deleted successfully",
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
        req.file.mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        req.file.mimetype === "application/msword"
      ) {
        textContent = await parseWord(filePath);
      } else if (req.file.mimetype === "text/plain") {
        textContent = parseText(filePath);
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      // Security: Validate file signature
      const isValidSignature = validateFileSignature(
        filePath,
        req.file.mimetype
      );
      if (!isValidSignature) {
        fs.unlinkSync(filePath); // Clean up suspicious file
        return res.status(400).json({
          success: false,
          error: "INVALID_FILE_SIGNATURE",
          message:
            "File signature does not match declared type. Possible security threat.",
        });
      }

      if (!textContent || textContent.length < 10) {
        // Clean up the uploaded file
        fs.unlinkSync(filePath);
        return res
          .status(400)
          .json({ message: "Could not extract meaningful text from the file" });
      }

      // Normalize extracted text for flashcard analysis
      textContent = textContent
        .replace(/\r\n|\r|\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Run Gemini analysis
      const { task } = req.body;
      const validTasks = [
        "summary",
        "explanation",
        "quiz",
        "keywords",
        "flashcards",
      ];
      const analysisTask = validTasks.includes(task) ? task : "summary";

      const analysis = await analyzeWithGemini(textContent, analysisTask);

      // Save document to database if user is authenticated
      let document = null;
      // Document length analysis for user feedback
      const estimatedPages = Math.ceil(textContent.length / 2500);
      const isLongDocument = textContent.length > 50000; // ~20+ pages

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
          estimatedPages: estimatedPages,
          analyses: [
            {
              taskType: analysisTask,
              result: analysis.result,
              timestamp: new Date(),
            },
          ],
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
          textLength: textContent.length,
          estimatedPages: estimatedPages,
          isLongDocument: isLongDocument,
        },
        warnings: isLongDocument
          ? [
              `Large document detected: ~${estimatedPages} pages`,
              "Processing time may be longer for large documents",
              textContent.length > 100000
                ? "Only first sections were analyzed due to document size"
                : null,
            ].filter(Boolean)
          : [],
      });
    } catch (parseError) {
      // Enhanced security: Clean up file immediately on any parsing error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.error("File parsing error:", parseError);

      // Determine error type for better user feedback
      let errorType = "PARSING_ERROR";
      let userMessage = "Error processing file";

      if (parseError.message.includes("password")) {
        errorType = "PASSWORD_PROTECTED";
        userMessage = "PDF is password protected. Please provide password.";
      } else if (
        parseError.message.includes("corrupt") ||
        parseError.message.includes("invalid")
      ) {
        errorType = "CORRUPTED_FILE";
        userMessage = "File appears to be corrupted or invalid.";
      } else if (parseError.message.includes("signature")) {
        errorType = "SECURITY_THREAT";
        userMessage = "File failed security validation.";
      }

      return res.status(400).json({
        success: false,
        error: errorType,
        message: userMessage,
        details:
          process.env.NODE_ENV === "development"
            ? parseError.message
            : undefined,
      });
    }
  } catch (err) {
    console.error("File analysis error:", err);
    res.status(500).json({ message: "Error analyzing file: " + err.message });
  }
};

// --- Save quiz result ---
// --- Save flashcard study time ---
export const saveFlashcardResult = async (req, res) => {
  try {
    const { documentId, timeSpent } = req.body;
    if (!documentId || !timeSpent) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: documentId, timeSpent",
      });
    }
    const flashcardResult = new FlashcardResult({
      userId: req.user._id,
      documentId,
      timeSpent,
      completedAt: new Date(),
    });
    await flashcardResult.save();
    res.json({ success: true, message: "Flashcard study time saved" });
  } catch (err) {
    console.error("Save flashcard result error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error saving flashcard study time" });
  }
};

// --- Get flashcard study stats ---
export const getFlashcardStats = async (req, res) => {
  try {
    const totalTimeSpent = await FlashcardResult.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: null, total: { $sum: "$timeSpent" } } },
    ]);
    res.json({
      success: true,
      stats: {
        totalTimeSpent: totalTimeSpent[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("Get flashcard stats error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching flashcard stats" });
  }
};
export const saveQuizResult = async (req, res) => {
  try {
    const { documentId, score, timeSpent, answers } = req.body;

    // Validate required fields
    if (!documentId || !score || !timeSpent || !answers) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: documentId, score, timeSpent, answers",
      });
    }

    // Validate document belongs to user
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Create quiz result
    const quizResult = new QuizResult({
      userId: req.user._id,
      documentId,
      score: {
        correct: score.correct,
        total: score.total,
        percentage: score.percentage,
      },
      timeSpent,
      answers,
    });

    await quizResult.save();

    res.json({
      success: true,
      message: "Quiz result saved successfully",
      quizResult: {
        id: quizResult._id,
        score: quizResult.score,
        timeSpent: quizResult.timeSpent,
        completedAt: quizResult.completedAt,
      },
    });
  } catch (err) {
    console.error("Save quiz result error:", err);
    res.status(500).json({
      success: false,
      message: "Error saving quiz result: " + err.message,
    });
  }
};

// --- Get user's quiz results ---
export const getQuizResults = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const quizResults = await QuizResult.find({ userId: req.user._id })
      .populate("documentId", "originalName fileName")
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await QuizResult.countDocuments({ userId: req.user._id });

    // Calculate overall stats
    const allResults = await QuizResult.find({ userId: req.user._id });
    const stats = {
      totalQuizzes: allResults.length,
      averageScore:
        allResults.length > 0
          ? Math.round(
              allResults.reduce(
                (sum, result) => sum + result.score.percentage,
                0
              ) / allResults.length
            )
          : 0,
      totalTimeSpent: allResults.reduce(
        (sum, result) => sum + result.timeSpent,
        0
      ),
      bestScore:
        allResults.length > 0
          ? Math.max(...allResults.map((result) => result.score.percentage))
          : 0,
    };

    res.json({
      success: true,
      quizResults,
      stats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
      },
    });
  } catch (err) {
    console.error("Get quiz results error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching quiz results: " + err.message,
    });
  }
};

export const chatWithDocument = async (req, res) => {
  try {
    const { documentId, question, history } = req.body;

    // 1. Check if we have the required data
    if (!documentId || !question) {
      return res
        .status(400)
        .json({ message: "Document ID and Question are required" });
    }

    // 2. Find the document in MongoDB to get its text
    // We ensure the user owns it by checking 'userId: req.user._id'
    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
    });

    if (!document) {
      return res
        .status(404)
        .json({ message: "Document not found or unauthorized" });
    }

    // 3. Send the Text + Question to your Python Microservice
    // We point to port 8000 where your Python script is running
    const pythonResponse = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: document.extractedText, // The text you stored when uploading
        question: question,
        history: history || [],
      }),
    });

    // 4. Check if Python crashed
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("Python Service Error:", errorText);
      throw new Error(
        "The AI service is having trouble processing this request."
      );
    }

    // 5. Return the answer to the Frontend
    const data = await pythonResponse.json();
    res.json({
      success: true,
      answer: data.answer,
    });
  } catch (err) {
    console.error("Chat Bridge Error:", err);
    res.status(500).json({ message: "Server error during chat." });
  }
};
