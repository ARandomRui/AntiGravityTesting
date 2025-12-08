document.addEventListener('DOMContentLoaded', async () => {
    const newsGrid = document.getElementById('news-grid');
    const statusIndicator = document.getElementById('status-indicator');

    try {
        statusIndicator.textContent = "Fetching latest stories...";

        const response = await fetch('/api/news');
        const data = await response.json();

        if (data.source === 'mock-fallback') {
            statusIndicator.textContent = "Showing offline/mock data (API Error)";
            statusIndicator.style.color = "#e74c3c";
        } else if (data.source === 'mock') {
            statusIndicator.textContent = "Showing mock data (No API Key)";
            statusIndicator.style.color = "#f39c12";
        } else {
            statusIndicator.textContent = `Latest updates from ${new Date().toLocaleDateString()}`;
            statusIndicator.style.color = "#27ae60";
        }

        renderNews(data.articles);

    } catch (error) {
        console.error('Error:', error);
        statusIndicator.textContent = "Failed to load news.";
        statusIndicator.style.color = "#c0392b";
    }

    function renderNews(articles) {
        newsGrid.innerHTML = '';

        if (!articles || articles.length === 0) {
            newsGrid.innerHTML = '<p>No news articles found.</p>';
            return;
        }

        articles.forEach(article => {
            // Skip articles with removed content or no title
            if (article.title === "[Removed]" || !article.title) return;

            const card = document.createElement('article');
            card.className = 'news-card';

            const imageUrl = article.urlToImage || 'https://via.placeholder.com/600x400?text=No+Image';
            const description = article.description || 'No description available for this story.';
            const sourceName = article.source?.name || 'Unknown Source';

            card.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}" class="card-image" loading="lazy" onerror="this.src='https://via.placeholder.com/600x400?text=Image+Error'">
                <div class="card-content">
                    <span class="source-tag">${sourceName}</span>
                    <h2 class="card-title">${article.title}</h2>
                    <p class="card-description">${description}</p>
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Story</a>
                </div>
            `;

            newsGrid.appendChild(card);
        });
    }
});
