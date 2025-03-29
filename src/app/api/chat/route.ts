import { OpenAIStream, StreamingTextResponse } from "ai";

// Using Node.js runtime since mysql2 requires Node.js modules
export const runtime = "nodejs";

import Groq from "groq-sdk";
import mysql from "mysql2/promise";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Establish MySQL connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'CollegeDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to fetch attendance by roll number
async function get_attendance({ roll_number }) {
  try {
    const [rows] = await db.execute("SELECT attendance_percentage FROM students WHERE id = ?", [roll_number]);
    if (rows.length > 0) {
      return `Your attendance is ${rows[0].attendance_percentage}%.`;
    } else {
      return "Roll number not found. Please check and try again.";
    }
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return "Error retrieving attendance. Please try again later.";
  }
}

// Function to fetch timetable by year and department
async function get_timetable({ year, branch }) {
  try {
    const [rows] = await db.execute(
      "SELECT day, time_slot, subject FROM timetable WHERE year = ? AND branch = ? ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), time_slot",
      [year, branch]
    );

    if (rows.length > 0) {
      let timetableText = `Here is the timetable for ${year} year, ${branch} branch:\n\n`;
      let currentDay = "";

      rows.forEach(({ day, time_slot, subject }) => {
        if (day !== currentDay) {
          timetableText += `📅 ${day}:\n`;
          currentDay = day;
        }
        timetableText += `  ⏰ ${time_slot} - ${subject}\n`;
      });

      return timetableText;
    } else {
      return "Timetable not found for the given year and branch.";
    }
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return "Error retrieving timetable. Please try again later.";
  }
}


// Define tools with proper typing
const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_attendance",
      description: "Fetch student attendance based on roll number.",
      parameters: {
        type: "object",
        properties: {
          roll_number: {
            type: "string",
            description: "The student's roll number."
          }
        },
        required: ["roll_number"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_timetable",
      description: "Fetch the class timetable based on year and department.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "string",
            description: "The academic year (e.g., First, Second, Third, Final)."
          },
          department: {
            type: "string",
            description: "The department name (e.g., Computer Science, Mechanical, etc.)."
          }
        },
        required: ["year", "department"]
      }
    }
  }
];

export async function POST(req: Request) {
  try {
    // Extract the messages from the body of the request
    const { messages } = await req.json();

    // Add a system prompt for the college AI chat bot
    const systemMessage = {
      role: "system",
      content: `You are the official AI assistant for Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur. Your primary purpose is to provide accurate and helpful information about our college to students, prospective students, parents, faculty, staff, and visitors.

      SCOPE OF KNOWLEDGE:
      - You know ONLY about Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur and its specific programs, facilities, policies, events, and services
      - Your knowledge includes academics, admissions, financial aid, campus life, facilities, faculty, administration, policies, procedures, and events specific to Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur
      - You do NOT have information about other colleges, universities, or educational institutions

      RESPONSE GUIDELINES:
      1. ONLY answer questions related to Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur. If asked about anything outside this scope, politely redirect the conversation back to college-related information.
      2. Be friendly, helpful, and concise in your responses.
      3. If you don't know a specific answer about Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur, acknowledge this limitation and suggest where they might find that information (e.g., "This information isn't in my current database, but you can find it on the college website at [website] or by contacting [appropriate department]").
      4. Never invent or hallucinate information about the college. If you're uncertain, say so.
      5. Do not engage in discussions about politics, religion, or other potentially controversial topics unless they directly relate to official college programs, courses, or policies.
      6. Do not provide personal advice, medical advice, legal advice, or counseling.
      7. If asked to perform tasks outside your capabilities (like booking appointments, registering for classes, or processing payments), explain that you cannot perform these actions and direct users to the appropriate resources.

      PRIVACY AND SECURITY:
      1. Do not ask for or store personal information such as full names, contact details, ID numbers, or financial information.
      2. If users share sensitive information, inform them that you cannot securely store this data and recommend appropriate official channels.

      SPECIAL INSTRUCTIONS:
      1. When greeting users, identify yourself as the DYPCET college's AI Assistant.
      2. End conversations with an offer to help with any other questions about Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur.
      3. Use the official terminology and naming conventions of Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur when referring to buildings, departments, programs, and positions.
      4. When discussing college events or deadlines, always mention if dates are tentative or subject to change, and direct users to verify the most current information.
      5. Always maintain a positive, supportive tone that reflects the values and mission of Dr.D.Y.Patil College of Engineering and Technology,kasba bawada,kolhapur.

      The information you provide should come EXCLUSIVELY from the college data that has been provided to you. Do not reference external sources or provide information about other institutions.`,
    };

    // Prepend the system message to the messages array
    const updatedMessages = [systemMessage, ...messages];

    // First try a non-streaming request to check if tool calls are needed
    const initialResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: updatedMessages,
      tools: tools,
      tool_choice: "auto",
      max_tokens: 4096
    });

    // Check if tool calls are used in the response
    const message = initialResponse.choices[0].message;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      // If tool calls are present, process them
      const toolResults = [];
      
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error("Error parsing function arguments:", e);
          continue; // Skip this tool call if arguments can't be parsed
        }
        
        // Execute the appropriate function
        let functionResult = "";
        if (functionName === "get_attendance") {
          functionResult = await get_attendance(functionArgs);
        } else if (functionName === "get_timetable") {
          functionResult = await get_timetable(functionArgs);
        }
        
        // Add the tool result to our array
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: functionResult
        });
      }
      
      // Add the assistant message and tool results to the messages
      const updatedMessagesWithTools = [
        ...updatedMessages,
        {
          role: "assistant",
          content: message.content,
          tool_calls: message.tool_calls
        },
        ...toolResults
      ];
      
      // Get the final response with the tool results included
      const finalCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: updatedMessagesWithTools,
        stream: true,
        max_tokens: 4096
      });
      
      // Convert to readable stream for frontend
      const stream = OpenAIStream(finalCompletion);
      return new StreamingTextResponse(stream);
    } else {
      // No tool calls needed, just stream the initial response
      const streamingCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: updatedMessages,
        stream: true,
        max_tokens: 4096
      });
      
      // Convert to readable stream for frontend
      const stream = OpenAIStream(streamingCompletion);
      return new StreamingTextResponse(stream);
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}