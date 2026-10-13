import { Copy, Trash2, X } from 'lucide-react';
import { useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { SocialPost } from '../../types';
import { PostBody } from './PostBody';
import { formatHashtag, getPostCopyText, getPostDisplayDate, getPostPlatforms } from './postModel';

interface PostDetailModalProps {
  post: SocialPost;
  onClose: () => void;
  onDelete: () => void;
}

export function PostDetailModal({ post, onClose, onDelete }: PostDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col"
      >
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-wrap">
              {getPostPlatforms(post).map((plt) => (
                <span key={plt} className="px-3 py-1 rounded-full text-xs font-bold bg-[#EA4335] text-white">
                  {plt}
                </span>
              ))}
              <span className="text-xs text-gray-500 font-medium">{getPostDisplayDate(post)}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              <PostBody post={post} />
            </div>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map((h) => (
                  <span key={h} className="text-xs font-semibold text-[#1A73E8]">
                    {formatHashtag(h)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EA4335] hover:bg-[#EA4335]/10 px-3 py-2 rounded-xl"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getPostCopyText(post));
                alert('Post copiado!');
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
