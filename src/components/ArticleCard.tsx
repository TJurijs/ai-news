import React from 'react';
import { Edit2, Trash2, ExternalLink, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';

interface Article {
    id: string;
    headline: string;
    summary: string;
    imageSuggestion: string;
    imageUrl?: string;
    sourceUrl?: string;
}

interface ArticleCardProps {
    article: Article;
    onEdit: (article: Article) => void;
    onDelete: (id: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}

export function ArticleCard({ article, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: ArticleCardProps) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex-1 mr-4">
                    {article.headline}
                </h3>
                <div className="flex gap-2 shrink-0">
                    {onMoveUp && (
                        <button
                            onClick={onMoveUp}
                            disabled={isFirst}
                            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Up"
                        >
                            <ArrowUp size={18} />
                        </button>
                    )}
                    {onMoveDown && (
                        <button
                            onClick={onMoveDown}
                            disabled={isLast}
                            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move Down"
                        >
                            <ArrowDown size={18} />
                        </button>
                    )}
                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                    <button
                        onClick={() => onEdit(article)}
                        className="p-2 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        title="Edit Article"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(article.id)}
                        className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        title="Delete Article"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Image Section */}
            <div className="w-full relative mb-4">
                {article.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={article.imageUrl}
                        alt={article.headline}
                        className="w-full h-auto rounded-md"
                    />
                ) : (
                    <div className="w-full h-64 bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400 p-4 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700">
                        <ImageIcon size={48} className="mb-2" />
                        <span className="text-sm italic text-center">Image Suggestion: {article.imageSuggestion}</span>
                    </div>
                )}
            </div>

            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                {article.summary}
            </p>

            {article.sourceUrl && (
                <a
                    href={article.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                    Source Link <ExternalLink size={14} className="ml-1" />
                </a>
            )}
        </div>
    );
}
