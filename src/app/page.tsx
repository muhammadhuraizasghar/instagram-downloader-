"use client";

import { useState } from "react";
import { Instagram, Download, Loader2, AlertCircle, Music, FileText, Info, Calendar, User, Eye, Heart, MessageCircle, Play, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 5;
      });
    }, 500);

    try {
      const response = await axios.post("/api/download", { url });
      const data = response.data;
      setProgress(100);

      // Add proxy URLs to all media items
      if (data.type === "carousel") {
        data.entries = data.entries.map((entry: any) => ({
          ...entry,
          items: entry.items.map((item: any) => ({
            ...item,
            proxyUrl: `/api/proxy?url=${encodeURIComponent(item.url)}`
          }))
        }));
      } else {
        data.items = data.items.map((item: any) => ({
          ...item,
          proxyUrl: `/api/proxy?url=${encodeURIComponent(item.url)}`
        }));
      }

      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to process the link. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const downloadMetadataPDF = (metadata: any, title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Media Metadata Report", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Title: ${title}`, 14, 32);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    const tableData = [
      ["Property", "Value"],
      ["Uploader", metadata.uploader],
      ["Upload Date", metadata.upload_date],
      ["Duration", metadata.duration],
      ["Views", metadata.view_count.toLocaleString()],
      ["Likes", metadata.like_count.toLocaleString()],
      ["Comments", metadata.comment_count.toLocaleString()],
      ["Webpage URL", metadata.webpage_url],
      ["Description", metadata.description.substring(0, 500) + (metadata.description.length > 500 ? "..." : "")]
    ];

    autoTable(doc, {
      startY: 50,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillStyle: 'DFDFDF', textColor: 20 },
    });

    doc.save(`${title.substring(0, 20)}_metadata.pdf`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-900 selection:text-white">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-zinc-100 dark:bg-zinc-800">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <main className="max-w-[500px] mx-auto min-h-screen border-x border-zinc-100 dark:border-zinc-800">
        {/* Header - Instagram Style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/95 dark:bg-black/95 backdrop-blur-md z-50">
          <div className="flex items-center gap-2">
            <Instagram className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Instagram</h1>
          </div>
          <div className="flex gap-4">
            <Heart className="w-6 h-6" />
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Search Bar - Instagram Style */}
        <div className="p-4">
          <form onSubmit={handleDownload} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-zinc-600" />
            </div>
            <input
              type="text"
              placeholder="Search or paste link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl focus:ring-0 text-sm font-medium transition-all placeholder:text-zinc-500"
            />
            {url && !loading && (
              <button 
                type="button" 
                onClick={() => setUrl("")}
                className="absolute inset-y-0 right-14 flex items-center pr-3"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !url}
              className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </form>
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar py-1">
            {["Videos", "Images", "Stories", "Audio"].map((tag) => (
              <span key={tag} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-grow">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-4"
              >
                <SkeletonCard />
                <SkeletonCard />
              </motion.div>
            )}

            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {result && !loading && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                {/* Media Content Area */}
                <div className="w-full">
                  {result.type === "carousel" ? (
                    result.entries.map((entry: any, eIdx: number) => (
                      <EntrySection 
                        key={eIdx} 
                        entry={entry} 
                        index={eIdx + 1} 
                        onDownloadPDF={() => downloadMetadataPDF(entry.metadata, `${result.title} - Slide ${eIdx + 1}`)}
                      />
                    ))
                  ) : (
                    <EntrySection 
                      entry={result} 
                      onDownloadPDF={() => downloadMetadataPDF(result.metadata, result.title)}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-8 text-center mt-12 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Powered by i.grezorea.com
          </p>
        </footer>
      </main>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
        <div className="w-24 h-3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
      <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
      <div className="flex justify-between items-center px-2">
        <div className="space-y-2">
          <div className="w-32 h-3 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          <div className="w-20 h-2 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
        <div className="w-20 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
      </div>
    </div>
  );
}

function EntrySection({ entry, index, onDownloadPDF }: { entry: any; index?: number; onDownloadPDF: () => void }) {
  return (
    <div className="w-full mb-8 last:mb-0">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
              <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {entry.metadata.thumbnail ? (
                  <img src={entry.metadata.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{entry.metadata.uploader || "Instagram User"}</span>
            <span className="text-[10px] text-zinc-500">{entry.metadata.upload_date || "Recent Post"}</span>
          </div>
        </div>
        <button onClick={onDownloadPDF} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Media Grid */}
      <div className="flex flex-col">
        {entry.items.map((item: any, iIdx: number) => (
          <MediaCard key={iIdx} item={item} />
        ))}
      </div>

      {/* Insights */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <Heart className="w-6 h-6" />
          <MessageCircle className="w-6 h-6" />
          <Download className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold">{entry.metadata.like_count?.toLocaleString() || "0"} likes</span>
          <p className="text-xs">
            <span className="font-bold mr-2">{entry.metadata.uploader}</span>
            <span className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {entry.metadata.description}
            </span>
          </p>
          <span className="text-[10px] text-zinc-400 uppercase mt-1">
            View all {entry.metadata.comment_count?.toLocaleString() || "0"} comments
          </span>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2 border border-zinc-100 dark:border-zinc-800 rounded-lg">
      <div className="flex items-center gap-1 text-zinc-400 mb-0.5">
        <Icon className="w-2 h-2" />
        <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <p className="text-[9px] font-black truncate">{value}</p>
    </div>
  );
}

function MediaCard({ item }: { item: any }) {
  const displayUrl = item.proxyUrl;
  
  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col relative group">
      <div className="relative w-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 aspect-square overflow-hidden">
        {item.type === "video" ? (
          <video 
            src={displayUrl} 
            controls 
            className="w-full h-full object-contain"
            poster={item.thumbnail}
            playsInline
          />
        ) : item.type === "audio" ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900">
            <div className="p-6 bg-blue-500/10 rounded-full animate-pulse">
              <Music className="w-12 h-12 text-blue-500" />
            </div>
            <audio src={displayUrl} controls className="w-3/4 h-10 brightness-90 contrast-125" />
          </div>
        ) : (
          <img 
            src={displayUrl} 
            alt="Preview" 
            className="w-full h-full object-contain" 
            loading="lazy"
          />
        )}
      </div>
      
      <div className="px-4 py-3 bg-white dark:bg-black border-y border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            item.type === 'video' ? 'text-purple-500' : 
            item.type === 'audio' ? 'text-blue-500' : 
            'text-zinc-500'
          }`}>
            {item.type} {item.type === 'video' ? 'HD' : ''}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 uppercase mt-0.5">{item.ext} • {item.resolution} • {item.filesize}</span>
        </div>
        
        <a
          href={displayUrl}
          download={`${item.title || 'media'}.${item.ext}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Get
        </a>
      </div>
    </div>
  );
}
