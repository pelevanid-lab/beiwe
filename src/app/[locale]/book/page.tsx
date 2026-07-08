import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LogoIcon } from '@/components/Logo';

// Helper to create URL-safe IDs from headings
const generateId = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçığ]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Custom components to inject IDs into markdown headings
const MarkdownComponents: any = {
  h2: ({ node, children, ...props }: any) => {
    // Attempt to extract text content
    let text = '';
    if (typeof children === 'string') text = children;
    else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : '').join('');
    
    const id = generateId(text);
    return <h2 id={id} className="scroll-mt-24 text-3xl font-serif font-bold text-[var(--color-ink)] mt-16 mb-6" {...props}>{children}</h2>;
  },
  h3: ({ node, children, ...props }: any) => {
    let text = '';
    if (typeof children === 'string') text = children;
    else if (Array.isArray(children)) text = children.map(c => typeof c === 'string' ? c : '').join('');

    const id = generateId(text);
    return <h3 id={id} className="scroll-mt-24 text-xl font-bold text-[var(--color-ink)] mt-10 mb-4" {...props}>{children}</h3>;
  }
};

import { getDictionary } from '@/lib/dictionaries';

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Try to load the localized book, fallback to tr if not found
  let bookPath = path.join(process.cwd(), 'src', 'content', 'books', `${locale}.md`);
  if (!fs.existsSync(bookPath)) {
    bookPath = path.join(process.cwd(), 'src', 'content', 'books', 'tr.md');
  }

  const content = fs.readFileSync(bookPath, 'utf8');
  const dict = await getDictionary(locale);

  // Extract headings for Table of Contents
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.*)/);
    if (match) {
      // Remove any markdown formatting (like italics/bold) from TOC text
      const cleanText = match[2].replace(/[*_~`]/g, '');
      headings.push({
        level: match[1].length,
        text: cleanText,
        id: generateId(cleanText)
      });
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-paper)]/90 backdrop-blur-md border-b border-[var(--color-ink)]/5 h-16 flex items-center">
        <div className="w-full px-8 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <LogoIcon className="w-8 h-8 text-[var(--color-ink)]" />
            <span className="font-serif text-xl font-bold tracking-tight">Beiwe</span>
          </Link>
          <div className="flex gap-6 items-center">
            <Link href={`/${locale}`} className="text-sm font-bold text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors">
              {dict.book?.nav_home || "Ana Sayfa"}
            </Link>
            <Link href="https://getsaule.com" target="_blank" className="text-sm font-bold text-[var(--color-ink-light)] hover:text-[var(--color-ink)] transition-colors">
              {dict.book?.nav_saule || "Saule Core"}
            </Link>
            <Link href={`/${locale}/app`} className="bg-[var(--color-ink)] text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-black transition-colors">
              {dict.book?.nav_workspace || "Çalışma Alanı →"}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex max-w-[1400px] w-full mx-auto">
        
        {/* Left Sidebar (Table of Contents) */}
        <aside className="w-72 flex-shrink-0 hidden lg:block border-r border-[var(--color-ink)]/5">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-8 pr-4">
            <h4 className="text-[10px] font-bold text-[var(--color-ink-light)] tracking-widest uppercase mb-6">
              {dict.book?.toc_title || "İÇİNDEKİLER"}
            </h4>
            <nav className="flex flex-col gap-3">
              {headings.map((heading, i) => (
                <a
                  key={i}
                  href={`#${heading.id}`}
                  className={`text-sm leading-snug transition-colors hover:text-[var(--color-burnt-orange)] ${
                    heading.level === 2
                      ? 'font-medium text-[var(--color-ink)] mt-2'
                      : 'text-[var(--color-ink-light)] ml-3 border-l-2 border-[var(--color-ink)]/10 pl-3 py-1'
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Brand Guideline Compliant Book Cover */}
          <div className="bg-[var(--color-ink)] w-full py-32 flex flex-col items-center justify-center text-center border-b border-[var(--color-ink)]/10">
            {/* The standalone W as specified in Brand Guidelines */}
            <div className="text-[var(--color-paper)] font-serif font-bold text-8xl md:text-9xl tracking-tighter mb-12 select-none">
              W
            </div>
            <h1 className="text-[var(--color-paper)] font-serif text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Beiwe Book
            </h1>
            <p className="text-[var(--color-paper)]/70 font-sans tracking-[0.2em] text-sm uppercase">
              The Constitution of Clarity
            </p>
          </div>

          <article className="px-6 py-16 lg:px-16 xl:px-24 prose prose-lg prose-headings:font-serif prose-p:text-[var(--color-ink)]/80 prose-a:text-[var(--color-burnt-orange)] hover:prose-a:text-orange-600 prose-blockquote:border-[var(--color-burnt-orange)] prose-blockquote:bg-[var(--color-burnt-orange)]/5 prose-blockquote:px-6 prose-blockquote:py-2 prose-blockquote:rounded-r-xl prose-strong:text-[var(--color-ink)] prose-code:text-[var(--color-burnt-orange)] prose-code:bg-[var(--color-burnt-orange)]/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded max-w-4xl mx-auto w-full">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {content}
            </ReactMarkdown>
          </article>
        </main>
      </div>
    </div>
  );
}
