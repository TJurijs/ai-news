"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Sparkles, Image as ImageIcon, RefreshCw, ExternalLink, Crop as CropIcon, Check, Monitor, Square, RectangleHorizontal } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '../utils/cropImage';

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

interface ArticleEditorProps {
    article?: Article;
    onSave: (article: Article) => void;
    onCancel: () => void;
}

const ASPECT_RATIOS = [
    { label: '16:9', value: 16 / 9, icon: Monitor },
    { label: '4:3', value: 4 / 3, icon: RectangleHorizontal },
    { label: '1:1', value: 1, icon: Square },
    { label: 'Free', value: undefined, icon: CropIcon },
];

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
    const [formData, setFormData] = useState<Article>({
        id: '',
        headline: '',
        summary: '',
        imageSuggestion: '',
        imageUrl: '',
        sourceUrl: '',
        availableImages: []
    });
    const [generatingImage, setGeneratingImage] = useState(false);

    // Cropping State
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>(16 / 9);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (article) {
            setFormData(article);
        } else {
            setFormData({
                id: crypto.randomUUID(),
                headline: '',
                summary: '',
                imageSuggestion: '',
                imageUrl: '',
                sourceUrl: '',
                availableImages: []
            });
        }
    }, [article]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleGenerateAiImage = async () => {
        if (!formData.imageSuggestion && !formData.summary) return;

        setGeneratingImage(true);
        const prompt = formData.imageSuggestion || formData.summary.substring(0, 100);

        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate image');
            }

            const data = await response.json();
            if (data.imageUrl) {
                setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
            }
        } catch (error) {
            console.error("Error generating image:", error);
            alert("Failed to generate image. Please try again.");
        } finally {
            setGeneratingImage(false);
        }
    };

    const selectImage = (url: string) => {
        setFormData(prev => ({ ...prev, imageUrl: url }));
        setIsCropping(false); // Reset cropping when selecting new image
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }

    const showCroppedImage = async () => {
        if (!formData.imageUrl || !completedCrop || !imgRef.current) return;
        try {
            // Use proxy for cropping to avoid CORS issues, BUT ONLY if it's not already a data URL
            const isDataUrl = formData.imageUrl.startsWith('data:');
            const proxyUrl = isDataUrl
                ? formData.imageUrl
                : `/api/proxy-image?url=${encodeURIComponent(formData.imageUrl)}`;

            // We need to pass the scale because the image displayed might be scaled down by CSS
            // But getCroppedImg expects pixel values relative to the natural image size if we pass the image source URL.
            // However, react-image-crop returns pixel values relative to the DISPLAYED image if we use percent,
            // OR relative to the image element.
            // Let's look at how getCroppedImg is implemented. It loads the image from URL.
            // So we need to ensure completedCrop is scaled to the natural image size.

            const image = imgRef.current;
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };

            const croppedImage = await getCroppedImg(
                proxyUrl,
                pixelCrop
            );

            if (croppedImage) {
                setFormData(prev => ({ ...prev, imageUrl: croppedImage }));
                setIsCropping(false);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to crop image. Please try again.");
        }
    };

    const handleAspectChange = (newAspect: number | undefined) => {
        setAspect(newAspect);
        if (newAspect && imgRef.current) {
            const { width, height } = imgRef.current;
            setCrop(centerAspectCrop(width, height, newAspect));
        } else if (imgRef.current) {
            // Reset to a default crop if switching to free mode
            setCrop({
                unit: '%',
                width: 50,
                height: 50,
                x: 25,
                y: 25
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row">

                {/* Form Section */}
                <div className="flex-1 p-6 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {article ? 'Edit Article' : 'New Article'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="md:hidden text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <form id="article-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Headline
                            </label>
                            <input
                                type="text"
                                name="headline"
                                value={formData.headline || ''}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter article headline"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Summary
                            </label>
                            <textarea
                                name="summary"
                                value={formData.summary || ''}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter article summary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Image Suggestion (Internal Note)
                            </label>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        name="imageSuggestion"
                                        value={formData.imageSuggestion || ''}
                                        onChange={handleChange}
                                        className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Describe the image needed"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateAiImage}
                                        disabled={generatingImage}
                                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                        title="Generate AI Image from Suggestion"
                                    >
                                        {generatingImage ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        <span className="hidden sm:inline">Generate</span>
                                    </button>
                                </div>

                                {/* Image Ideas / Queries */}
                                {formData.imageQueries && formData.imageQueries.length > 0 && (
                                    <div className="mt-2">
                                        <label className="text-xs text-zinc-500 font-medium mb-1 block">Image Ideas & Search Topics:</label>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.imageQueries.map((query, idx) => (
                                                <div key={idx} className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1 border border-zinc-200 dark:border-zinc-700">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            setFormData(prev => ({ ...prev, imageSuggestion: query }));
                                                            setGeneratingImage(true);

                                                            try {
                                                                const response = await fetch('/api/generate-image', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                    },
                                                                    body: JSON.stringify({ prompt: query }),
                                                                });

                                                                if (!response.ok) {
                                                                    throw new Error('Failed to generate image');
                                                                }

                                                                const data = await response.json();
                                                                if (data.imageUrl) {
                                                                    setFormData(prev => ({ ...prev, imageUrl: data.imageUrl, imageSuggestion: query }));
                                                                }
                                                            } catch (error) {
                                                                console.error("Error generating image:", error);
                                                                alert("Failed to generate image.");
                                                            } finally {
                                                                setGeneratingImage(false);
                                                            }
                                                        }}
                                                        className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 mr-2"
                                                        title="Generate AI Image for this topic"
                                                    >
                                                        {query}
                                                    </button>
                                                    <a
                                                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-zinc-400 hover:text-blue-500"
                                                        title="Search Google Images"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Image URL
                            </label>
                            <input
                                type="url"
                                name="imageUrl"
                                value={formData.imageUrl || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Source URL (Optional)
                            </label>
                            <input
                                type="url"
                                name="sourceUrl"
                                value={formData.sourceUrl || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://example.com/news-article"
                            />
                        </div>
                    </form>
                </div>

                {/* Image Selection Section */}
                <div className="w-full md:w-80 bg-zinc-50 dark:bg-zinc-900/50 p-6 flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 md:hidden">
                        <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Image Preview</h3>
                    </div>
                    <div className="hidden md:flex justify-end mb-4">
                        <button
                            onClick={onCancel}
                            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-uppercase text-zinc-500 font-semibold">Current Image</label>
                                {formData.imageUrl && !isCropping && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCropping(true)}
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <CropIcon size={12} />
                                        Crop
                                    </button>
                                )}
                            </div>

                            {isCropping && formData.imageUrl ? (
                                <div className="flex flex-col gap-2">
                                    <div className="relative w-full bg-black/5 rounded-lg overflow-hidden flex justify-center">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={aspect}
                                            className="max-h-64"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                ref={imgRef}
                                                alt="Crop me"
                                                src={formData.imageUrl.startsWith('data:') ? formData.imageUrl : `/api/proxy-image?url=${encodeURIComponent(formData.imageUrl)}`}
                                                onLoad={onImageLoad}
                                                className="max-h-64 object-contain"
                                            />
                                        </ReactCrop>
                                    </div>

                                    {/* Aspect Ratio Controls */}
                                    <div className="flex justify-center gap-2 py-1">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.label}
                                                type="button"
                                                onClick={() => handleAspectChange(ratio.value)}
                                                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-colors ${aspect === ratio.value
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-500'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                                    }`}
                                                title={ratio.label}
                                            >
                                                <ratio.icon size={14} />
                                                <span className="hidden sm:inline">{ratio.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex justify-between gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsCropping(false)}
                                            className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded-md font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={showCroppedImage}
                                            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md font-medium shadow-sm hover:bg-blue-700 flex items-center justify-center gap-1"
                                        >
                                            <Check size={12} />
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                formData.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={formData.imageUrl} alt="Current" className="w-full h-auto object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm" />
                                ) : (
                                    <div className="w-full h-40 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">
                                        <ImageIcon size={32} />
                                    </div>
                                )
                            )}
                        </div>

                        {formData.availableImages && formData.availableImages.length > 0 && (
                            <div>
                                <label className="block text-xs font-uppercase text-zinc-500 font-semibold mb-2">Available Images</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {formData.availableImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => selectImage(img)}
                                            className="relative group overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 hover:ring-2 hover:ring-blue-500 transition-all"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={img} alt={`Option ${idx}`} className="w-full h-24 object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 mt-auto border-t border-zinc-200 dark:border-zinc-800 md:block hidden">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="article-form"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Save size={18} />
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="pt-4 mt-auto border-t border-zinc-200 dark:border-zinc-800 md:hidden block">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="article-form"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Save size={18} />
                                Save
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
