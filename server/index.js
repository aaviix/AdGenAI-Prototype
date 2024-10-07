const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

async function scrapeProductData(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    const title = $('title').text() || 'No title available';
    let description = $('meta[name="description"]').attr('content') || '';
    
    if (!description || description.length < 10) {
      description = $('p').first().text() || $('h1').text() || $('h2').text() || 'No relevant content found';
    }
    
    const brandName = $('meta[property="og:site_name"]').attr('content') || url.split('//')[1].split('/')[0] || 'Unknown Brand';
    const productName = $('h1').first().text() || title || 'Unknown Product';
    
    return { 
      brandName, 
      productName, 
      productDescription: description || 'No description available'
    };
  } catch (error) {
    console.error('Error scraping product data:', error.message);
    throw new Error('Failed to scrape the product data');
  }
}

app.post('/createAd', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: 'No URL provided' });
  }

  try {
    console.log('Received URL:', url);
    
    // Scrape product data
    const productData = await scrapeProductData(url);
    console.log('Scraped Product Data:', productData);

    // Generate ad using OpenAI
    const prompt = `Generate an ad for the following product:
                    Brand: ${productData.brandName}
                    Product: ${productData.productName}
                    Description: ${productData.productDescription}`;

    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI that generates ad copy." },
        { role: "user", content: prompt }
      ],
      max_tokens: 100
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    const adCopy = gptResponse.data.choices[0].message.content;

    res.json({
      ...productData,
      adCopy,
    });
  } catch (error) {
    console.error('Error generating ad:', error);
    res.status(500).json({ message: 'Error generating ad', error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});