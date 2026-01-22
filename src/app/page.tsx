"use client";

import { useState } from "react";
import { Instagram, Download, Loader2, AlertCircle, Film, Image as ImageIcon, Play, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

type ContentType = "post" | "video" | "story" | "audio";

export default function Home() {
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState<ContentType>("post");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post("/api/download", { url, type: contentType });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Download failed. Please check the link and try again.");
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: "post", label: "Post", icon: ImageIcon },
    { id: "video", label: "Reel/Video", icon: Film },
    { id: "story", label: "Story", icon: Play },
    { id: "audio", label: "Audio Only", icon: Music },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-100 dark:selection:bg-purple-900/30">
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 border-2 border-zinc-900 dark:border-white rounded-full"
          >
            <Instagram className="w-10 h-10 md:w-12 md:h-12" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-center">
            INSTA DOWNLOADER
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-center max-w-md px-4">
            A minimalist 2D tool to download Instagram media. No tracking, no ads, just high-quality downloads.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Content Type Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => setContentType(t.id as ContentType)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${
                  contentType === t.id
                    ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleDownload} className="relative group mb-12">
            <input
              type="text"
              placeholder={`Paste Instagram ${contentType} link here...`}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-6 py-5 bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-medium text-lg placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="absolute right-3 top-3 bottom-3 px-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 disabled:opacity-30 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span className="hidden md:inline">Download</span>
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-8 p-5 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase">Result Ready</h3>
                    <span className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-full uppercase tracking-widest">
                      {result.type}
                    </span>
                  </div>

                  {result.items ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.items.map((item: any, idx: number) => (
                        <MediaCard key={idx} item={item} index={idx + 1} />
                      ))}
                    </div>
                  ) : (
                    <MediaCard item={result} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-12 border-t-2 border-zinc-100 dark:border-zinc-900">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-50 font-bold text-xs uppercase tracking-widest">
          <p>© 2026 i.grezorea.com</p>
          <div className="flex gap-8">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MediaCard({ item, index }: { item: any; index?: number }) {
  return (
    <div className="space-y-4">
      <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700">
        {item.type === "video" || item.type === "audio" ? (
          <video 
            src={item.downloadUrl} 
            controls 
            className="w-full h-full object-contain"
            poster={item.thumbnail}
          />
        ) : (
          <img 
            src={item.downloadUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <a
        href={item.downloadUrl}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-center rounded-xl hover:opacity-90 transition-all uppercase flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        SAVE {item.type === 'audio' ? 'AUDIO' : (index ? `MEDIA ${index}` : 'TO DEVICE')}
      </a>
    </div>
  );
}
