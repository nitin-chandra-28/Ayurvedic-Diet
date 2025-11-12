
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// The base URL for the OpenAI-compatible router
const API_BASE_URL = "https://router.huggingface.co/v1";
const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

// Create the /chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body || {};

    if (!HF_TOKEN) {
        return res.status(500).json({ error: 'Missing HUGGING_FACE_API_TOKEN' });
    }

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
    }

    const payload = {
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
            { role: "user", content: message }
        ],
        max_tokens: 512,
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

// This tells the server what to do when it gets a GET request for the root URL

app.listen(PORT, () => {
    console.log(`✨ AI API listening at http://localhost:${PORT}`);
});