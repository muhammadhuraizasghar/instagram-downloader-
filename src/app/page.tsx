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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-100">
      <main className="w-full">
        {/* Header - Compact */}
        <div className="flex flex-col items-center py-4 border-b border-zinc-100 dark:border-zinc-900">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-2 p-2 border border-zinc-900 dark:border-white"
          >
            <Instagram className="w-6 h-6" />
          </motion.div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
            Insta <span className="text-zinc-400">Extract</span>
          </h1>
        </div>

        {/* Search Bar - No Margins, No Radius */}
        <div className="w-full">
          <form onSubmit={handleDownload} className="relative flex">
            <input
              type="text"
              placeholder="Paste Instagram link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-grow px-4 py-3 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-white outline-none transition-all font-bold text-sm placeholder:text-zinc-300 rounded-none"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest text-xs disabled:opacity-30 transition-all flex items-center gap-2 rounded-none"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{loading ? '...' : 'Go'}</span>
            </button>
          </form>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                <p>{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                {/* Result Info Bar */}
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate max-w-[200px]">
                    {result.title}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {result.type === "carousel" ? `${result.entries.length} SLIDES` : "SINGLE"}
                  </p>
                </div>

                {/* Media Content */}
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
      </main>

      <footer className="w-full py-4 border-t border-zinc-100 dark:border-zinc-900 mt-4">
        <div className="px-4 flex items-center justify-between opacity-50 font-bold text-[8px] uppercase tracking-widest">
          <p>© i.grezorea.com</p>
          <div className="flex gap-4">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EntrySection({ entry, index, onDownloadPDF }: { entry: any; index?: number; onDownloadPDF: () => void }) {
  return (
    <div className="w-full">
      {/* Media Grid - Vertical Stack for Tiny UI */}
      <div className="flex flex-col">
        {entry.items.map((item: any, iIdx: number) => (
          <MediaCard key={iIdx} item={item} />
        ))}
      </div>

      {/* Compact Metadata Panel */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-tighter">Post Data</h3>
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-1 px-2 py-1 border border-zinc-200 dark:border-zinc-800 text-[8px] font-black uppercase"
          >
            <FileText className="w-3 h-3" />
            PDF Report
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <MetaItem icon={User} label="User" value={entry.metadata.uploader} />
          <MetaItem icon={Eye} label="Views" value={entry.metadata.view_count.toLocaleString()} />
          <MetaItem icon={Heart} label="Likes" value={entry.metadata.like_count.toLocaleString()} />
        </div>

        <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900">
          <p className="text-[10px] leading-tight text-zinc-500 line-clamp-2">
            {entry.metadata.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1 text-zinc-400">
        <Icon className="w-2.5 h-2.5" />
        <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <p className="text-[10px] font-bold truncate">{value}</p>
    </div>
  );
}

function MediaCard({ item }: { item: any }) {
  const displayUrl = item.proxyUrl;
  
  return (
    <div className="w-full bg-black flex flex-col border-b border-zinc-800">
      {/* Preview Area - Auto Height for Portrait/Landscape */}
      <div className="relative w-full flex items-center justify-center bg-zinc-950">
        {item.type === "video" ? (
          <video 
            src={displayUrl} 
            controls 
            className="max-w-full max-h-[80vh] w-auto h-auto"
            poster={item.thumbnail}
            playsInline
          />
        ) : item.type === "audio" ? (
          <div className="w-full p-4 flex flex-col items-center gap-2 bg-zinc-900">
            <Music className="w-6 h-6 text-blue-500" />
            <audio src={displayUrl} controls className="w-full h-8" />
          </div>
        ) : (
          <img 
            src={displayUrl} 
            alt="Media Preview" 
            className="max-w-full max-h-[80vh] w-auto h-auto" 
            loading="lazy"
          />
        )}
      </div>
      
      {/* Tiny Action Bar */}
      <div className="p-2 bg-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-1 py-0.5 text-[8px] font-black uppercase ${
            item.type === 'video' ? 'text-purple-400' : 
            item.type === 'audio' ? 'text-blue-400' : 
            'text-zinc-400'
          }`}>
            {item.type}
          </span>
          <span className="text-[8px] font-bold text-zinc-600 uppercase">{item.ext} • {item.filesize}</span>
        </div>
        
        <a
          href={displayUrl}
          download={`${item.title || 'media'}.${item.ext}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-1.5 bg-white text-black font-black text-[8px] uppercase transition-all flex items-center gap-1"
        >
          <Download className="w-2.5 h-2.5" />
          Save
        </a>
      </div>
    </div>
  );
}
