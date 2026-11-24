import { Check, Copy, Heart, MessageCircle, Pencil, Star, Trash2 } from 'lucide-react';
import type { SocialPost } from '../../types';
import { ActionMenu } from '../ActionMenu';
import { PostBody, PostLinkList } from './PostBody';
import { formatHashtag, getPostDisplayDate, getPostPlatforms } from './postModel';
import { getPostCopyLabel, isLinkOnlyPost, PLATFORM_STYLES, STATUS_STYLES } from './postView';

const MAX_CARD_HASHTAGS = 4;

interface PostCardProps {
  post: SocialPost;
  isCopied: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export function PostMetrics({ post, className = '' }: { post: SocialPost; className?: string }) {
  if (!post.likes && !post.comments && !post.score) return null;
  return (
    <div className={`flex items-center gap-3 text-xs text-gray-500 font-medium ${className}`}>
      {post.likes ? (
        <span className="flex items-center gap-1" title="Curtidas">
          <Heart aria-hidden="true" className="w-3.5 h-3.5 text-danger" />
          <span>
            {post.likes}
            <span className="sr-only"> curtidas</span>
          </span>
        </span>
      ) : null}
      {post.comments ? (
        <span className="flex items-center gap-1" title="Comentários">
          <MessageCircle aria-hidden="true" className="w-3.5 h-3.5 text-primary" />
          <span>
            {post.comments}
            <span className="sr-only"> comentários</span>
          </span>
        </span>
      ) : null}
      {post.score ? (
        <span className="flex items-center gap-1" title="Pontuação">
          <Star aria-hidden="true" className="w-3.5 h-3.5 text-warning" />
          <span>
            {post.score}
            <span className="sr-only"> pontos</span>
          </span>
        </span>
      ) : null}
    </div>
  );
}

export function PostCard({ post, isCopied, onOpen, onEdit, onDelete, onCopy }: PostCardProps) {
  const linkOnly = isLinkOnlyPost(post);
  const hiddenTags = (post.hashtags?.length ?? 0) - MAX_CARD_HASHTAGS;

  return (
    <article
      id={`post-card-${post.id}`}
      className="group/card relative bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-primary/40 focus-within:border-danger/50 transition-all p-5 sm:p-6 flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getPostPlatforms(post).map((plt) => (
              <span key={plt} className={`px-2.5 py-1 rounded-full text-xs font-bold ${PLATFORM_STYLES[plt]}`}>
                {plt}
              </span>
            ))}
            <span
              className={`text-2xs font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLES[post.status] ?? STATUS_STYLES.Rascunho}`}
            >
              {post.status}
            </span>
            {post.category && (
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                {post.category}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 font-medium shrink-0 pt-1">{getPostDisplayDate(post)}</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
          <button
            type="button"
            onClick={onOpen}
            className="text-left hover:text-primary focus:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-danger/50"
          >
            {post.title}
          </button>
        </h3>

        {linkOnly ? (
          <PostLinkList post={post} />
        ) : (
          <p className="bg-surface-muted rounded-2xl p-4 border border-gray-200 text-xs sm:text-sm text-gray-700 whitespace-pre-wrap line-clamp-4 leading-relaxed group-hover/card:bg-gray-50 transition-colors">
            <PostBody post={post} />
          </p>
        )}

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.slice(0, MAX_CARD_HASHTAGS).map((tag) => (
              <span key={tag} className="text-xs font-medium text-primary">
                {formatHashtag(tag)}
              </span>
            ))}
            {hiddenTags > 0 && <span className="text-xs font-medium text-gray-400">+{hiddenTags}</span>}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <PostMetrics post={post} />

        <div className="relative z-10 flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={onCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isCopied ? 'bg-success text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{getPostCopyLabel(post)}</span>
              </>
            )}
          </button>
          <ActionMenu
            label={`Mais ações para ${post.title}`}
            items={[
              { label: 'Editar', icon: Pencil, onSelect: onEdit },
              { label: 'Excluir', icon: Trash2, onSelect: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
