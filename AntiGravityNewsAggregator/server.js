require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Mock Data
const MOCK_NEWS = [
    {
        title: "AI Agent Builds News Aggregator in Record Time",
        description: "In a stunning display of efficiency, an AI coding assistant has rallied to build a fully functional news aggregator script for a user.",
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=AI+News",
        source: { name: "Tech Daily" },
        publishedAt: new Date().toISOString()
    },
    {
        title: "Local Developer Discovers 'Dark Mode' Toggle",
        description: "Eyes everywhere rejoice as brightness is reduced by 50%. Stocks in sunglasses plummet.",
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=Dark+Mode",
        source: { name: "Dev Satire" },
        publishedAt: new Date().toISOString()
    },
    {
        title: "Placeholder Images: A Critical Analysis",
        description: "Why do we use them? Where do they go? A deep dive into the 600x400 grey rectangle.",
        url: "#",
        urlToImage: "https://via.placeholder.com/600x400?text=Placeholder",
        source: { name: "Design Weekly" },
        publishedAt: new Date().toISOString()
    }
];

// API Endpoint
app.get('/api/news', async (req, res) => {
    try {
        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            console.log('No API key found, using mock data.');
            return res.json({ articles: MOCK_NEWS, source: 'mock' });
        }

        // Fetch top headlines from US
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        res.json({ articles: response.data.articles, source: 'api' });

    } catch (error) {
        console.error('Error fetching news:', error.message);
        // Fallback to mock data on error
        res.json({ articles: MOCK_NEWS, source: 'mock-fallback' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
