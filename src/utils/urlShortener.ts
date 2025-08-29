interface ShortenUrlRequest {
  url: string;
}

// Function to shorten URL using tinyurl API
async function shortenUrl(originalUrl: string): Promise<string> {
  try {
    const encodedUrl = encodeURIComponent(originalUrl);
    const apiUrl = `https://tinyurl.com/api-create.php?url=${encodedUrl}`;
    
    const response = await axios.get(apiUrl, {
      timeout: 5000, // 5 second timeout
      headers: {
        'User-Agent': 'Node.js URL Shortener'
      }
    });

    // Check if the response contains a valid shortened URL
    if (response.status === 200 && response.data && response.data.startsWith('http')) {
      return response.data;
    } else {
      throw new Error('Invalid response from tinyurl API');
    }
  } catch (error) {
    console.error('URL shortening failed:', error);
    // Return original URL if shortening fails
    return originalUrl;
  }
}
