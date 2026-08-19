
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = ['https://ayurvedic-diet.vercel.app', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Basic health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// The base URL for the OpenAI-compatible router
const API_BASE_URL = "https://router.huggingface.co/v1";
const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

// Ayurvedic System Prompt for guidance
const AYURVEDIC_SYSTEM_PROMPT = `You are AyurBot, an expert Ayurvedic health advisor trained in traditional Ayurvedic medicine.

CORE PRINCIPLES:
- Always respond with Ayurvedic guidance only
- Follow Ayurvedic principles: Vata, Pitta, Kapha doshas
- Recommend herbal remedies, diet suggestions, and lifestyle practices from Ayurveda
- Use Sanskrit terms when appropriate (e.g., Triphala, Ashwagandha, Panchakarma)
- Consider seasonal and time-of-day factors (Dinacharya, Ritucharya)

RESPONSE GUIDELINES:
- Do NOT suggest allopathic medicines unless explicitly asked
- Provide safe, general advice only - not medical diagnosis
- Always mention: "Consult a qualified Ayurvedic practitioner for personalized treatment"
- Be warm, holistic, and educational in tone
- Keep responses concise (3-5 sentences) but informative

STRUCTURE:
1. Acknowledge the concern from Ayurvedic perspective
2. Suggest 2-3 specific Ayurvedic remedies (herbs, diet, lifestyle)
3. Add a brief explanation of the underlying dosha imbalance if relevant
4. End with consultation reminder

Now respond to the user's query below with pure Ayurvedic wisdom:`;

// Create the /chat endpoint with prompt augmentation
app.post('/chat', async (req, res) => {
    const { message } = req.body || {};

    if (!HF_TOKEN) {
        return res.status(500).json({ error: 'Missing HUGGING_FACE_API_TOKEN' });
    }

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Augment user message with Ayurvedic system prompt
    const augmentedMessage = `${AYURVEDIC_SYSTEM_PROMPT}\n\nUser Query: ${message}`;

    const payload = {
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
            { 
                role: "system", 
                content: AYURVEDIC_SYSTEM_PROMPT 
            },
            { 
                role: "user", 
                content: message 
            }
        ],
        max_tokens: 512,
        temperature: 0.7,
    };

    try {
        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60_000
            }
        );

        const modelResponse = response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
        return res.json({ reply: modelResponse });
    } catch (error) {
        const status = error.response?.status || 500;
        const errorDetails = error.response?.data || { message: error.message };
        console.error('Error calling Hugging Face Router API:', errorDetails);
        return res.status(status).json({ error: 'Failed to get response from AI model' });
    }
});

// Medicine Alternative endpoint with specialized prompt
app.post('/medicine-alternative', async (req, res) => {
    const { medicine } = req.body || {};

    if (!HF_TOKEN) {
        return res.status(500).json({ error: 'Missing HUGGING_FACE_API_TOKEN' });
    }

    if (!medicine || typeof medicine !== 'string') {
        return res.status(400).json({ error: 'Medicine name is required' });
    }

    const medicinePrompt = `You are an expert Ayurvedic pharmacologist. Provide authentic Ayurvedic herbal alternatives for the allopathic medicine: "${medicine}"

TASK: Return ONLY valid JSON. No markdown, no code fences, no explanation, no extra text.

REQUIREMENTS:
- Return a JSON object with this exact top-level structure:
  {
    "alternatives": [
      {
        "name": "Herb Name",
        "description": "1-2 clear sentences",
        "benefits": ["benefit 1", "benefit 2", "benefit 3"],
        "usage": "powder / decoction / tablet / etc.",
        "dosage": "Typical dosage and timing",
        "precautions": "Important warning or consultation note"
      }
    ]
  }
- Provide 2-3 traditional Ayurvedic herbs or formulations that address similar health concerns.
- Only suggest authentic, well-documented Ayurvedic herbs.
- Include Sanskrit names where known.
- Keep descriptions concise and practical.
- Mention practitioner consultation in precautions when relevant.
- Do not suggest pharmaceutical alternatives.
- Ensure the response is valid JSON with double quotes around all keys and string values.

Now return ONLY the JSON object for Ayurvedic alternatives:`;

    const payload = {
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
            { 
                role: "system", 
                content: "You are an Ayurvedic expert providing herbal medicine alternatives. Return only strict JSON matching the exact schema and never include markdown or prose."
            },
            { 
                role: "user", 
                content: medicinePrompt
            }
        ],
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: "json_object" }
    };

    try {
        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60_000
            }
        );

        const modelResponse = response.data?.choices?.[0]?.message?.content || "Sorry, I couldn't find alternatives.";
        
        // Parse the response into structured format
        const alternatives = parseMedicineResponse(modelResponse);
        
        return res.json({ 
            medicine: medicine,
            alternatives: alternatives,
            rawResponse: modelResponse,
            disclaimer: "This information is for educational purposes only. Consult a qualified Ayurvedic practitioner before use."
        });
    } catch (error) {
        const status = error.response?.status || 500;
        const errorDetails = error.response?.data || { message: error.message };
        console.error('Error calling Hugging Face for medicine alternatives:', errorDetails);
        return res.status(status).json({ error: 'Failed to get medicine alternatives' });
    }
});

// Helper function to parse medicine alternative response
function parseMedicineResponse(text) {
    if (!text || typeof text !== 'string') {
        return [
            {
                name: "General Ayurvedic Guidance",
                description: "Please consult an Ayurvedic practitioner for specific herbal alternatives to this medicine.",
                benefits: ["Personalized treatment", "Holistic approach", "Safe herbal remedies"],
                usage: "As prescribed by practitioner",
                dosage: "Individualized based on prakriti and vikriti",
                precautions: "Always consult a qualified professional"
            }
        ];
    }

    const cleanedText = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

    try {
        const parsed = JSON.parse(cleanedText);
        const rawAlternatives = Array.isArray(parsed) ? parsed : parsed.alternatives;

        if (Array.isArray(rawAlternatives) && rawAlternatives.length > 0) {
            return rawAlternatives.map((alt) => ({
                name: alt.name || 'Ayurvedic Alternative',
                description: alt.description || 'Traditional Ayurvedic remedy for similar concerns.',
                benefits: Array.isArray(alt.benefits) ? alt.benefits.filter(Boolean) : [],
                usage: alt.usage || 'As directed by a qualified practitioner',
                dosage: alt.dosage || 'Individualized based on prakriti and vikriti',
                precautions: alt.precautions || 'Consult a qualified Ayurvedic practitioner before use.'
            }));
        }
    } catch (error) {
        // Fall back to legacy text parsing below.
    }

    const alternatives = [];
    
    // Split by numbered items
    const sections = cleanedText.split(/\d+\.\s+/).filter(s => s.trim());
    
    sections.forEach(section => {
        const lines = section.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length === 0) return;
        
        const alt = {
            name: '',
            description: '',
            benefits: [],
            usage: '',
            dosage: '',
            precautions: ''
        };
        
        // First line is usually the name
        alt.name = lines[0].replace(/\*\*/g, '').replace(/[\[\]]/g, '').trim();
        
        lines.forEach(line => {
            if (line.toLowerCase().startsWith('description:')) {
                alt.description = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.toLowerCase().startsWith('benefits:')) {
                const benefitText = line.substring(line.indexOf(':') + 1).trim();
                alt.benefits = benefitText.split(/[,;]/).map(b => b.trim()).filter(b => b);
            } else if (line.toLowerCase().startsWith('usage:')) {
                alt.usage = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.toLowerCase().startsWith('dosage:')) {
                alt.dosage = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.toLowerCase().startsWith('precautions:') || line.toLowerCase().startsWith('caution:')) {
                alt.precautions = line.substring(line.indexOf(':') + 1).trim();
            } else if (line.startsWith('-') || line.startsWith('•')) {
                // Additional benefits in list form
                alt.benefits.push(line.replace(/^[-•]\s*/, '').trim());
            }
        });
        
        // Only add if we have at least name and description
        if (alt.name && (alt.description || alt.benefits.length > 0)) {
            alternatives.push(alt);
        }
    });
    
    return alternatives.length > 0 ? alternatives : [
        {
            name: "General Ayurvedic Guidance",
            description: "Please consult an Ayurvedic practitioner for specific herbal alternatives to this medicine.",
            benefits: ["Personalized treatment", "Holistic approach", "Safe herbal remedies"],
            usage: "As prescribed by practitioner",
            dosage: "Individualized based on prakriti and vikriti",
            precautions: "Always consult a qualified professional"
        }
    ];
}

// This tells the server what to do when it gets a GET request for the root URL

app.listen(PORT, () => {
    console.log(`✨ AI API listening at http://localhost:${PORT}`);
});
