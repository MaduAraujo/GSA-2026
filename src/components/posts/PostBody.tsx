import { Share2 } from 'lucide-react';
import { Fragment } from 'react';
import type { SocialPost } from '../../types';
import { isHttpUrl } from '../../utils/safeUrl';
import { CHALLENGE_RESULT_TONE, getPostLinks, MANUAL_TONE } from './postModel';

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
            className="inline-flex items-center gap-1 text-[#1A73E8] font-bold hover:underline break-all"
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

export function PostBody({ post }: { post: SocialPost }) {
  if (post.tone !== CHALLENGE_RESULT_TONE && post.tone !== MANUAL_TONE) {
    return <LinkedText content={post.content} />;
  }

  const links = getPostLinks(post);
  if (links.length === 0) {
    return <span className="text-gray-400">Nenhum link adicionado.</span>;
  }
  return (
    <span className="flex flex-col gap-1.5">
      {links
        .filter((l) => isHttpUrl(l.link))
        .map((l) => (
          <a
            key={l.id}
            href={l.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[#1A73E8] font-bold hover:underline break-all"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            Ver publicação no {l.platform}
          </a>
        ))}
    </span>
  );
}
