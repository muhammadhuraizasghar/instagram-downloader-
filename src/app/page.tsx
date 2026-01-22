"use client";

import { useState } from "react";
import { Instagram, Download, Loader2, AlertCircle, Music, FileText, Info, Calendar, User, Eye, Heart, MessageCircle, Play, Search, X, ChevronDown, ChevronUp, Link as LinkIcon, Hash, Clock, Maximize } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MediaItem {
  type: 'video' | 'image' | 'audio';
  url: string;
  proxyUrl: string;
  thumbnail?: string;
  title?: string;
  resolution?: string;
  ext?: string;
  filesize?: string;
}

interface Metadata {
  uploader: string;
  uploader_url: string;
  upload_date: string;
  description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: string;
  webpage_url: string;
  tags: string[];
  thumbnail?: string;
}

interface Entry {
  items: MediaItem[];
  metadata: Metadata;
}

interface DownloadResult {
  type: 'single' | 'carousel';
  title: string;
  items?: MediaItem[];
  metadata?: Metadata;
  entries?: Entry[];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);

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

      // Add proxy URLs to all media items and thumbnails
      if (data.type === "carousel") {
        data.entries = data.entries.map((entry: Entry) => ({
          ...entry,
          metadata: {
            ...entry.metadata,
            thumbnail: entry.metadata.thumbnail ? `/api/proxy?url=${encodeURIComponent(entry.metadata.thumbnail)}` : null
          },
          items: entry.items.map((item: MediaItem) => ({
            ...item,
            proxyUrl: `/api/proxy?url=${encodeURIComponent(item.url)}`,
            thumbnail: item.thumbnail ? `/api/proxy?url=${encodeURIComponent(item.thumbnail)}` : null
          }))
        }));
      } else {
        data.metadata = {
          ...data.metadata,
          thumbnail: data.metadata.thumbnail ? `/api/proxy?url=${encodeURIComponent(data.metadata.thumbnail)}` : null
        };
        data.items = data.items.map((item: MediaItem) => ({
          ...item,
          proxyUrl: `/api/proxy?url=${encodeURIComponent(item.url)}`,
          thumbnail: item.thumbnail ? `/api/proxy?url=${encodeURIComponent(item.thumbnail)}` : null
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

  const downloadMetadataPDF = (metadata: Metadata, title: string) => {
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
      headStyles: { fillColor: [223, 223, 223], textColor: 20 },
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
            {loading ? (
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
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mx-4 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                {/* Media Content Area */}
                <div className="w-full">
                  {result.type === "carousel" ? (
                    result.entries?.map((entry: Entry, eIdx: number) => (
                      <EntrySection 
                        key={eIdx} 
                        entry={entry} 
                        onDownloadPDF={() => downloadMetadataPDF(entry.metadata, `${result.title} - Slide ${eIdx + 1}`)}
                      />
                    ))
                  ) : (
                    result.items && result.metadata && (
                      <EntrySection 
                        entry={{ items: result.items, metadata: result.metadata }} 
                        onDownloadPDF={() => downloadMetadataPDF(result.metadata!, result.title)}
                      />
                    )
                  )}
                </div>
              </motion.div>
            ) : null}
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

function EntrySection({ entry, onDownloadPDF }: { entry: Entry; onDownloadPDF: () => void }) {
  const [showFullMeta, setShowFullMeta] = useState(false);

  return (
    <div className="w-full mb-8 last:mb-0 border-b border-zinc-100 dark:border-zinc-800 pb-4">
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
        <div className="flex items-center gap-2">
          <button onClick={onDownloadPDF} title="Download Report" className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors">
            <FileText className="w-4 h-4" />
          </button>
          <button onClick={() => setShowFullMeta(!showFullMeta)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {showFullMeta ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex flex-col">
        {entry.items.map((item: MediaItem, iIdx: number) => (
          <MediaCard key={iIdx} item={item} />
        ))}
      </div>

      {/* Insights */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          <MessageCircle className="w-6 h-6" />
          <Download className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold">{entry.metadata.like_count?.toLocaleString() || "0"} likes</span>
          <p className="text-xs">
            <span className="font-bold mr-2">{entry.metadata.uploader}</span>
            <span className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words">
              {entry.metadata.description}
            </span>
          </p>
          <span className="text-[10px] text-zinc-400 uppercase mt-1">
            View all {entry.metadata.comment_count?.toLocaleString() || "0"} comments
          </span>
        </div>
      </div>

      {/* Expanded Meta Details */}
      <AnimatePresence>
        {showFullMeta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 mx-4 rounded-xl border border-zinc-100 dark:border-zinc-800"
          >
            <div className="p-4 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-2">Full Media Metadata</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <FullMetaItem icon={User} label="Uploader" value={entry.metadata.uploader} />
                <FullMetaItem icon={Calendar} label="Upload Date" value={entry.metadata.upload_date} />
                <FullMetaItem icon={Eye} label="Views" value={entry.metadata.view_count?.toLocaleString() || "0"} />
                <FullMetaItem icon={Heart} label="Likes" value={entry.metadata.like_count?.toLocaleString() || "0"} />
                <FullMetaItem icon={MessageCircle} label="Comments" value={entry.metadata.comment_count?.toLocaleString() || "0"} />
                <FullMetaItem icon={Clock} label="Duration" value={entry.metadata.duration} />
                <div className="col-span-2">
                  <FullMetaItem icon={LinkIcon} label="Uploader URL" value={entry.metadata.uploader_url} isLink />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Info className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase">Description</span>
                </div>
                <div className="p-3 bg-white dark:bg-black rounded-lg border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words">
                    {entry.metadata.description}
                  </p>
                </div>
              </div>

              {entry.metadata.tags && entry.metadata.tags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Hash className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entry.metadata.tags.slice(0, 20).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-[9px] text-zinc-600 dark:text-zinc-400 font-medium">
                        #{tag}
                      </span>
                    ))}
                    {entry.metadata.tags.length > 20 && <span className="text-[9px] text-zinc-400">+{entry.metadata.tags.length - 20} more</span>}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <LinkIcon className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase">Original Link</span>
                </div>
                <a 
                  href={entry.metadata.webpage_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-blue-500 font-medium truncate block hover:underline"
                >
                  {entry.metadata.webpage_url}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FullMetaItem({ icon: Icon, label, value, isLink }: { icon: React.ElementType; label: string; value: string | number; isLink?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] font-bold uppercase">{label}</span>
      </div>
      {isLink && value ? (
        <a 
          href={value.toString()} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[11px] font-bold text-blue-500 truncate hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{value || "N/A"}</p>
      )}
    </div>
  );
}



function MediaCard({ item }: { item: MediaItem }) {
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
