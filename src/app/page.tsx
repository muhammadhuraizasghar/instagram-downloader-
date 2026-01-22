"use client";

import { useState } from "react";
import { Instagram, Download, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function Home() {
  const [url, setUrl] = useState("");
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
      const response = await axios.post("/api/download", { url });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch content. Please check the link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-zinc-200 dark:border-zinc-800"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Instagram className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Insta Downloader</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
            Download Instagram Posts, Reels, Stories & IGTV in high quality.
          </p>
        </div>

        <form onSubmit={handleDownload} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Paste Instagram link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all text-zinc-900 dark:text-white"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download</span>
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm border border-red-100 dark:border-red-900/30"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 space-y-4"
            >
              {result.type === "carousel" ? (
                <div className="space-y-6">
                  {result.items.map((item: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="aspect-video relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                        {item.type === "video" ? (
                          <video 
                            src={item.downloadUrl} 
                            controls 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img 
                            src={item.downloadUrl} 
                            alt={`Slide ${index + 1}`} 
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <a
                        href={item.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        Save Media {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="aspect-video relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                    {result.type === "video" ? (
                      <video 
                        src={result.downloadUrl} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={result.downloadUrl} 
                        alt="Instagram content" 
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <a
                    href={result.downloadUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block text-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl shadow-md hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                  >
                    Save to Device
                  </a>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            By using this tool you agree to our terms. We do not store any media on our servers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
