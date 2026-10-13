import { Check, Copy, Edit3, Heart, MessageCircle, Star, Trash2 } from 'lucide-react';
import type { PostPlatform, SocialPost } from '../../types';
import { PostBody } from './PostBody';
import { formatHashtag, getPostDisplayDate, getPostPlatforms } from './postModel';

const PLATFORM_STYLES: Partial<Record<PostPlatform, string>> = {
  LinkedIn: 'bg-[#0077B5]/10 text-[#0077B5]',
  Instagram: 'bg-[#E1306C]/10 text-[#E1306C]',
};

const STATUS_STYLES: Record<SocialPost['status'], string> = {
  Publicado: 'bg-green-100 text-green-700',
  Agendado: 'bg-blue-100 text-blue-700',
  Rascunho: 'bg-amber-100 text-amber-700',
};

interface PostCardProps {
  post: SocialPost;
  isCopied: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}

export function PostCard({ post, isCopied, onOpen, onEdit, onDelete, onCopy }: PostCardProps) {
  return (
    <div
      id={`post-card-${post.id}`}
      className="bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-[#EA4335]/50 transition-all p-6 flex flex-col justify-between space-y-4"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {getPostPlatforms(post).map((plt) => (
              <span
                key={plt}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  PLATFORM_STYLES[plt] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {plt}
              </span>
            ))}

            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${STATUS_STYLES[post.status] ?? STATUS_STYLES.Rascunho}`}
            >
              {post.status}
            </span>

            {post.category && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                {post.category}
              </span>
            )}
          </div>

          <span className="text-xs text-gray-400 font-medium">{getPostDisplayDate(post)}</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
          <button type="button" onClick={onOpen} className="text-left hover:text-[#EA4335]">
            {post.title}
          </button>
        </h3>

        <div
          onClick={onOpen}
          className="bg-[#F8FAFD] rounded-2xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap line-clamp-4 leading-relaxed">
            <PostBody post={post} />
          </p>
        </div>

        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs font-medium text-[#1A73E8]">
                {formatHashtag(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
          {post.likes ? (
            <span className="flex items-center gap-1" title="Curtidas">
              <Heart className="w-3.5 h-3.5 text-[#EA4335]" />
              <span>{post.likes}</span>
            </span>
          ) : null}
          {post.comments ? (
            <span className="flex items-center gap-1" title="Comentários">
              <MessageCircle className="w-3.5 h-3.5 text-[#1A73E8]" />
              <span>{post.comments}</span>
            </span>
          ) : null}
          {post.score ? (
            <span className="flex items-center gap-1" title="Pontuação">
              <Star className="w-3.5 h-3.5 text-[#FBBC04]" />
              <span>{post.score}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-[#EA4335] hover:bg-[#EA4335]/10"
            aria-label="Excluir Post"
            title="Excluir Post"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Editar Post"
            title="Editar Post"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={onCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isCopied ? 'bg-[#34A853] text-white' : 'bg-gray-900 text-white hover:bg-gray-800'
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
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
