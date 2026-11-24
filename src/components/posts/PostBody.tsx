import { ExternalLink, Share2 } from 'lucide-react';
import { Fragment } from 'react';
import type { SocialPost } from '../../types';
import { isHttpUrl } from '../../utils/safeUrl';
import { getPostLinks } from './postModel';
import { formatLinkLabel, isLinkOnlyPost, PLATFORM_STYLES } from './postView';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

function LinkedText({ content }: { content: string }) {
  return (
    <>
      {content.split(URL_PATTERN).map((part, idx) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 inline-flex items-center gap-1 text-primary font-bold hover:underline break-all"
          >
            <Share2 className="w-3 h-3 shrink-0" />
            {part}
          </a>
        ) : (
          <Fragment key={idx}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function PostLinkList({ post }: { post: SocialPost }) {
  const links = getPostLinks(post).filter((l) => isHttpUrl(l.link));
  if (links.length === 0) {
    return <p className="text-xs text-gray-400">Nenhum link adicionado.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {links.map((l) => (
        <li key={l.id}>
          <a
            href={l.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Ver publicação no ${l.platform}`}
            title={l.link}
            className="relative z-10 group flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-muted border border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-2xs font-bold ${PLATFORM_STYLES[l.platform]}`}>
              {l.platform}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-gray-600 group-hover:text-primary">
              {formatLinkLabel(l.link)}
            </span>
            <ExternalLink aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-primary" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PostBody({ post }: { post: SocialPost }) {
  if (isLinkOnlyPost(post)) return <PostLinkList post={post} />;
  return <LinkedText content={post.content} />;
}
