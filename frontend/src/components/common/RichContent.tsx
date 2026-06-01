import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  className?: string;
}

/**
 * Рендерить контент що може бути або Markdown (новий), або HTML (старий, з CKEditor).
 *   • remark-gfm — таблиці, списки задач, автопосилання
 *   • rehype-raw — дозволяє «сирий» HTML усередині (для старих новин з тегами)
 *
 * Замінює небезпечний dangerouslySetInnerHTML — react-markdown санітизує вивід.
 */
export function RichContent({ content, className }: Props) {
  if (!content) return null;
  return (
    <div className={cn('prose-content', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
