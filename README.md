# AI Model Comparison and Aggregation Platform

## Overview
This platform allows users to input queries and receive responses from multiple AI models, including **ChatGPT**, **Claude**, **Gemini**, and **Perplexity**. The platform aggregates these responses and generates a **Super Answer** using an AI model to deliver the most accurate and concise response.

<img src='/basic.png'>
---

## Features

- **Multi-AI Responses**: Query multiple AI models and compare their outputs.
- **Super Answer Aggregation**: An AI model combines the individual responses into a highly accurate and synthesized answer.
- **Intuitive Interface**: Sleek and user-friendly design with dark mode and glowing neon accents.
- **Feedback Mechanism**: Users can rate individual responses and the Super Answer.
- **Authentication**: Secure user accounts with saved query history.

---

## Tech Stack

### Frontend
- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **State Management**: Redux or Zustand


### AI Integration
- **APIs**: OpenAI, Anthropic, Google Gemini, Perplexity


---

## Installation

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB or PostgreSQL

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/superAI.git
   cd superAI
   ```

2. **Install Dependencies**:
   - Frontend:
     ```bash
     npm install
     ```

3. **Set Environment Variables**:
   Create a `.env` file in the  and configure API keys for the AI models:
   ```env
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GEMINI_API_KEY=your_gemini_key
   PERPLEXITY_API_KEY=your_perplexity_key
   DATABASE_URL=your_database_url
   ```

4. **Run the Backend**:
   ```bash
   
   npm run dev
   ```
  

5. **Access the Platform**:
   Open `http://localhost:3000` in your browser.

---

## Usage
1. Enter your query in the input box.
2. Click the "Submit" button to get responses from all AI models.
3. View individual responses or the aggregated "Super Answer."
4. Rate the responses and provide feedback.

---


## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m 'Add feature'`).
4. Push to the branch (`git push origin feature-name`).
5. Create a pull request.

---


