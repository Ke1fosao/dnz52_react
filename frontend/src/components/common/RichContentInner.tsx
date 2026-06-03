import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  className?: string;
}

/**
 * Власне рендеринг Markdown/HTML через react-markdown.
 * Винесено в окремий файл, щоб RichContent міг підвантажувати його лениво
 * (react-markdown + remark-gfm + rehype-raw — важкий чанк ~330КБ).
 *   • remark-gfm — таблиці, списки задач, автопосилання
 *   • rehype-raw — «сирий» HTML усередині (для старих новин з тегами)
 */
export default function RichContentInner({ content, className }: Props) {
  return (
    <div className={cn('prose-content', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
