"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Plus, Trash2, Copy } from 'lucide-react';
import { ArticleEditor } from '@/components/ArticleEditor';
import { ArticleCard } from '@/components/ArticleCard';

interface Article {
  id: string;
  headline: string;
  summary: string;
  imageSuggestion: string;
  imageUrl?: string;
  sourceUrl?: string;
  availableImages?: string[];
  imageQueries?: string[];
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Article | undefined>(undefined);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // Load articles from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('newsletter_articles');
    if (saved) {
      try {
        setArticles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load articles", e);
      }
    }
  }, []);

  // Save articles to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('newsletter_articles', JSON.stringify(articles));
  }, [articles]);

  const handleGenerate = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, model: selectedModel }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate article');
      }

      const data = await response.json();
      const newArticle: Article = {
        id: crypto.randomUUID(),
        headline: data.headline,
        summary: data.summary,
        imageSuggestion: data.imageSuggestion,
        imageUrl: data.imageUrl, // Now comes from API if found
        sourceUrl: url,
        availableImages: data.availableImages || [],
        imageQueries: data.imageQueries || []
      };

      setArticles(prev => [...prev, newArticle]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveArticle = (article: Article) => {
    if (currentArticle) {
      setArticles(prev => prev.map(a => a.id === article.id ? article : a));
    } else {
      setArticles(prev => [...prev, article]);
    }
    setIsEditing(false);
    setCurrentArticle(undefined);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingArticleId(id);
  };

  const confirmDelete = () => {
    if (deletingArticleId) {
      setArticles(prev => prev.filter(a => a.id !== deletingArticleId));
      setDeletingArticleId(null);
    }
  };

  const cancelDelete = () => {
    setDeletingArticleId(null);
  };

  const confirmDeleteAll = () => {
    setArticles([]);
    setIsDeletingAll(false);
  };

  const moveArticle = (index: number, direction: 'up' | 'down') => {
    const newArticles = [...articles];
    if (direction === 'up' && index > 0) {
      [newArticles[index], newArticles[index - 1]] = [newArticles[index - 1], newArticles[index]];
    } else if (direction === 'down' && index < newArticles.length - 1) {
      [newArticles[index], newArticles[index + 1]] = [newArticles[index + 1], newArticles[index]];
    }
    setArticles(newArticles);
  };

  const handleCopyToClipboard = async () => {
    // Generate HTML for Outlook
    // Generate HTML for Outlook using tables for better compatibility
    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif;">
  <tr>
    <td align="center">
      <table width="600" border="0" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; text-align: left;">
        ${articles.map(a => `
        <tr>
          <td style="padding-bottom: 30px;">
            <h2 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; line-height: 1.4;">
              ${a.sourceUrl ? `<a href="${a.sourceUrl}" style="color: #2563eb; text-decoration: none;">${a.headline}</a>` : `<span style="color: #2563eb;">${a.headline}</span>`}
            </h2>
            ${a.imageUrl ? `
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom: 15px;">
                  <img src="${a.imageUrl}" alt="${a.headline}" width="600" style="width: 600px; max-width: 600px; height: auto; display: block; border-radius: 8px;" />
                </td>
              </tr>
            </table>
            ` : ''}
            <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 14px;">${a.summary}</p>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
              <tr>
                <td style="border-top: 1px solid #e5e7eb;"></td>
              </tr>
            </table>
          </td>
        </tr>
        `).join('')}
      </table>
    </td>
  </tr>
</table>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const textBlob = new Blob([articles.map(a => `${a.headline}\n${a.summary}\n${a.sourceUrl}`).join('\n\n')], { type: 'text/plain' });

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blob,
          'text/plain': textBlob
        })
      ]);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-blue-600" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Newsletter
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setCurrentArticle(undefined); setIsEditing(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Manual Article
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              disabled={articles.length === 0}
            >
              <Copy size={16} />
              Copy for Outlook
            </button>
            {articles.length > 0 && (
              <button
                onClick={() => setIsDeletingAll(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                title="Delete All Articles"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">


        {/* Input Section */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-2 flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste news article URL here..."
                className="flex-1 px-4 py-3 rounded-lg bg-transparent focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerate(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                disabled={isLoading}
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleGenerate(input.value);
                  input.value = '';
                }}
                className="px-6 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Generate'}
              </button>
            </div>
            <div className="flex justify-end px-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs bg-zinc-100 dark:bg-zinc-800 border-none rounded-md px-2 py-1 text-zinc-600 dark:text-zinc-400 focus:ring-0 cursor-pointer"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Default)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                <option value="gemini-3-pro-preview">gemini-3-pro-preview</option>
              </select>
            </div>
          </div>
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Articles List */}
        <div className="space-y-6">
          {articles.length === 0 && !isLoading && (
            <div className="text-center py-20 text-zinc-400">
              <p>No articles yet. Paste a URL above to get started.</p>
            </div>
          )}

          {articles.map((article, index) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={(a) => { setCurrentArticle(a); setIsEditing(true); }}
              onDelete={handleDeleteClick}
              onMoveUp={index > 0 ? () => moveArticle(index, 'up') : undefined}
              onMoveDown={index < articles.length - 1 ? () => moveArticle(index, 'down') : undefined}
              isFirst={index === 0}
              isLast={index === articles.length - 1}
            />
          ))}
        </div>
      </main>

      {/* Editor Modal */}
      {isEditing && (
        <ArticleEditor
          article={currentArticle}
          onSave={handleSaveArticle}
          onCancel={() => { setIsEditing(false); setCurrentArticle(undefined); }}
        />
      )}

      {/* Deletion Confirmation Modal */}
      {deletingArticleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Delete Article?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete this article? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {isDeletingAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Delete All Articles?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete ALL articles? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeletingAll(false)}
                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Overlay */}
      {showCopySuccess && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Sparkles size={18} className="text-yellow-400" />
            <span className="font-medium">Copied for Outlook!</span>
          </div>
        </div>
      )}
    </div>
  );
}
