"use client";

import { useState } from "react";
import { Instagram, Download, Loader2, AlertCircle, Music, FileText, Info, Calendar, User, Eye, Heart, MessageCircle, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
      const data = response.data;

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
      setLoading(false);
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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-100 dark:selection:bg-purple-900/30">
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 border-2 border-zinc-900 dark:border-white rounded-full"
          >
            <Instagram className="w-10 h-10 md:w-12 md:h-12" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-center uppercase">
            Insta Data Extractor
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-center max-w-md px-4">
            Extract high-quality media, audio, and full metadata from any Instagram link.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleDownload} className="relative group mb-12">
            <input
              type="text"
              placeholder="Paste Instagram link here..."
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
              <span className="hidden md:inline">Extract Everything</span>
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
                className="space-y-12"
              >
                {/* Global Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b-2 border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 truncate max-w-xl">
                      {result.title}
                    </h2>
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest">
                      {result.type === "carousel" ? `Carousel Post • ${result.entries.length} Slides` : "Single Post"}
                    </p>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="space-y-16">
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
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t-2 border-zinc-100 dark:border-zinc-900">
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

function EntrySection({ entry, index, onDownloadPDF }: { entry: any; index?: number; onDownloadPDF: () => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
      {/* Media Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black uppercase tracking-widest text-sm text-zinc-400">
            {index ? `Slide ${index} Media` : "Media Files"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {entry.items.map((item: any, iIdx: number) => (
            <MediaCard key={iIdx} item={item} />
          ))}
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 sticky top-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-zinc-900 dark:text-white" />
            <h3 className="text-xl font-black uppercase">Meta Details</h3>
          </div>
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase hover:opacity-90 transition-all"
          >
            <FileText className="w-4 h-4" />
            PDF Report
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <MetaItem icon={User} label="Uploader" value={entry.metadata.uploader} />
            <MetaItem icon={Calendar} label="Date" value={entry.metadata.upload_date} />
            <MetaItem icon={Eye} label="Views" value={entry.metadata.view_count.toLocaleString()} />
            <MetaItem icon={Heart} label="Likes" value={entry.metadata.like_count.toLocaleString()} />
            <MetaItem icon={MessageCircle} label="Comments" value={entry.metadata.comment_count.toLocaleString()} />
            <MetaItem icon={Play} label="Duration" value={entry.metadata.duration} />
          </div>

          <div className="pt-6 border-t-2 border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-black uppercase text-zinc-400 mb-2 tracking-widest">Description</p>
            <p className="text-sm font-medium leading-relaxed line-clamp-6 text-zinc-600 dark:text-zinc-300">
              {entry.metadata.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <p className="text-sm font-bold truncate">{value}</p>
    </div>
  );
}

function MediaCard({ item }: { item: any }) {
  const displayUrl = item.proxyUrl;
  
  return (
    <div className="p-4 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 flex gap-4">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex-shrink-0">
        {item.type === "audio" ? (
          <div className="w-full h-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
            <Music className="w-8 h-8 text-blue-500" />
          </div>
        ) : (
          <img src={item.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
        )}
      </div>
      
      <div className="flex flex-col justify-between flex-grow min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              item.type === 'video' ? 'bg-purple-100 text-purple-600' : 
              item.type === 'audio' ? 'bg-blue-100 text-blue-600' : 
              'bg-zinc-100 text-zinc-600'
            }`}>
              {item.type}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">{item.resolution}</span>
          </div>
          <p className="text-xs font-bold truncate text-zinc-500">{item.ext.toUpperCase()} • {item.filesize}</p>
        </div>

        <a
          href={displayUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-black text-center text-[10px] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-3 h-3" />
          Save {item.type}
        </a>
      </div>
    </div>
  );
}
