import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, lang: 'en' | 'es' = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return lang === 'en' ? 'just now' : 'ahora';
  if (minutes < 60) return lang === 'en' ? `${minutes}m ago` : `hace ${minutes}m`;
  if (hours < 24) return lang === 'en' ? `${hours}h ago` : `hace ${hours}h`;
  if (days < 7) return lang === 'en' ? `${days}d ago` : `hace ${days}d`;
  
  return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    dockerfile: 'dockerfile',
    env: 'plaintext',
  };
  return langMap[ext || ''] || 'plaintext';
}

export function detectTechnology(content: string, filename: string): string[] {
  const techs: string[] = [];
  const lowerContent = content.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  // Framework detection
  if (lowerContent.includes('react') || lowerFilename.includes('.tsx') || lowerFilename.includes('.jsx')) techs.push('React');
  if (lowerContent.includes('next') || lowerContent.includes('next/')) techs.push('Next.js');
  if (lowerContent.includes('vue')) techs.push('Vue');
  if (lowerContent.includes('angular')) techs.push('Angular');
  if (lowerContent.includes('express')) techs.push('Express');
  if (lowerContent.includes('prisma')) techs.push('Prisma');
  if (lowerContent.includes('docker') || lowerFilename.includes('dockerfile')) techs.push('Docker');
  if (lowerContent.includes('postgres') || lowerContent.includes('postgresql')) techs.push('PostgreSQL');
  if (lowerContent.includes('redis')) techs.push('Redis');
  if (lowerContent.includes('mongodb')) techs.push('MongoDB');
  if (lowerContent.includes('graphql')) techs.push('GraphQL');
  if (lowerContent.includes('tailwind')) techs.push('Tailwind');
  if (lowerContent.includes('typescript') || lowerFilename.endsWith('.ts')) techs.push('TypeScript');
  
  return [...new Set(techs)];
}

export function extractBidirectionalLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }
  
  return [...new Set(links)];
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    react: 'bg-cyan-500',
    frontend: 'bg-cyan-500',
    backend: 'bg-blue-500',
    database: 'bg-emerald-500',
    infrastructure: 'bg-orange-500',
    infra: 'bg-orange-500',
    devops: 'bg-purple-500',
    security: 'bg-red-500',
    docs: 'bg-slate-500',
    default: 'bg-slate-500',
  };
  return colors[category.toLowerCase()] || colors.default;
}
