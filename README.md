# AI Newsletter Generator

An intelligent, AI-powered application designed to streamline the creation of corporate newsletters. This tool automates the process of curating, summarizing, and illustrating news articles, making it easy to produce high-quality, engaging content.

## Features

*   **AI-Powered Summarization**: Automatically generates concise, informative summaries of news articles using Google's Gemini Pro model.
*   **Smart Headline Generation**: Creates catchy, engaging headlines tailored to your audience.
*   **Automated Image Generation**:
    *   Suggests relevant image prompts based on article content.
    *   Generates high-quality images using Google's Gemini 3 Pro Image Preview model.
    *   Provides search queries for finding alternative images.
*   **Content Extraction**: Seamlessly extracts content from URLs using Jina Reader, handling complex layouts and removing clutter.
*   **Interactive Editor**:
    *   Review and edit generated headlines and summaries.
    *   Regenerate images with custom prompts.
    *   Crop and adjust images to fit standard newsletter formats.
*   **Outlook-Ready Export**: Formats the final newsletter for easy copy-pasting directly into Microsoft Outlook, ensuring consistent layout and design.

## Tech Stack

*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **AI Models**:
    *   Text: Google Gemini 2.5 Flash (via `google-generative-ai`)
    *   Image: Google Gemini 3 Pro Image Preview (via REST API)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Content Extraction**: [Jina Reader](https://jina.ai/reader)

## Quickstart

### Prerequisites

*   Node.js 18+ installed.
*   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/ai-newsletter-generator.git
    cd ai-newsletter-generator
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the root directory and add your Gemini API key:

    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open the application:**

    Navigate to `http://localhost:3000` in your browser.

## Usage

1.  **Paste a URL**: Enter the URL of a news article you want to include in your newsletter.
2.  **Generate**: Click "Generate" to let the AI extract content, summarize it, and create an image.
3.  **Review & Edit**:
    *   Edit the headline or summary if needed.
    *   If you don't like the generated image, use the suggested search queries or type your own prompt to generate a new one.
    *   Crop the image to the desired aspect ratio.
4.  **Add to Newsletter**: Click "Add to Newsletter" to save the article to your current session.
5.  **Export**: Once you've added all your articles, copy the formatted content and paste it into your Outlook newsletter draft.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Jurijs Tolokoncevs
