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
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-center uppercase leading-none">
            Insta Data <span className="text-zinc-400">Extractor</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-bold text-center max-w-md px-4 uppercase tracking-widest text-[10px]">
            High-quality media, audio, & metadata extraction
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleDownload} className="relative group mb-16">
            <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Paste Instagram link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-grow px-8 py-6 bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-lg placeholder:text-zinc-300"
              />
              <button
                type="submit"
                disabled={loading || !url}
                className="px-8 py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-zinc-200 dark:shadow-none"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                <span>Extract</span>
              </button>
            </div>
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
    <div className="flex flex-col gap-10">
      {/* Media Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black uppercase tracking-[0.2em] text-xs text-zinc-400">
            {index ? `SLIDE ${index} / MEDIA` : "AVAILABLE MEDIA"}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entry.items.map((item: any, iIdx: number) => (
            <MediaCard key={iIdx} item={item} />
          ))}
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center">
              <Info className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">Post Analytics</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed extraction results</p>
            </div>
          </div>
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-3 px-8 py-4 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-xl shadow-zinc-100 dark:shadow-none"
          >
            <FileText className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          <MetaItem icon={User} label="Uploader" value={entry.metadata.uploader} />
          <MetaItem icon={Calendar} label="Date" value={entry.metadata.upload_date} />
          <MetaItem icon={Eye} label="Views" value={entry.metadata.view_count.toLocaleString()} />
          <MetaItem icon={Heart} label="Likes" value={entry.metadata.like_count.toLocaleString()} />
          <MetaItem icon={MessageCircle} label="Comments" value={entry.metadata.comment_count.toLocaleString()} />
          <MetaItem icon={Play} label="Duration" value={entry.metadata.duration} />
        </div>

        <div className="pt-10 border-t-2 border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 bg-zinc-900 dark:bg-white rounded-full"></div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Full Caption / Description</p>
          </div>
          <p className="text-sm font-bold leading-relaxed text-zinc-600 dark:text-zinc-300 max-w-4xl whitespace-pre-wrap">
            {entry.metadata.description}
          </p>
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
  const [isPlaying, setIsPlaying] = useState(false);
  
  return (
    <div className="flex flex-col bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all hover:border-zinc-400 dark:hover:border-zinc-600">
      {/* Preview Area */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
        {item.type === "video" ? (
          <video 
            src={displayUrl} 
            controls 
            className="w-full h-full object-contain"
            poster={item.thumbnail}
          />
        ) : item.type === "audio" ? (
          <div className="flex flex-col items-center gap-4 w-full p-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Music className="w-8 h-8 text-blue-500" />
            </div>
            <audio src={displayUrl} controls className="w-full" />
          </div>
        ) : (
          <img 
            src={displayUrl} 
            alt="Media Preview" 
            className="w-full h-full object-contain" 
            loading="lazy"
          />
        )}
      </div>
      
      {/* Info & Download */}
      <div className="p-4 border-t-2 border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                item.type === 'video' ? 'bg-purple-100 text-purple-600' : 
                item.type === 'audio' ? 'bg-blue-100 text-blue-600' : 
                'bg-zinc-100 text-zinc-600'
              }`}>
                {item.type}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.ext}</span>
            </div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-tighter">
              {item.resolution} • {item.filesize}
            </p>
          </div>
          
          <a
            href={displayUrl}
            download={`${item.title || 'instagram_media'}.${item.ext}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-[10px] uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200 dark:shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            Download {item.type}
          </a>
        </div>
      </div>
    </div>
  );
}
