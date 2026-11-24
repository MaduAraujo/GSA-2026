import { Copy, Pencil, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../app/ToastProvider';
import type { SocialPost } from '../../types';
import { PostMetrics } from './PostCard';
import { PostBody } from './PostBody';
import { formatHashtag, getPostCopyText, getPostDisplayDate, getPostPlatforms } from './postModel';
import { getPostCopyLabel, isLinkOnlyPost, PLATFORM_STYLES, STATUS_STYLES } from './postView';

interface PostDetailModalProps {
  post: SocialPost;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PostDetailModal({ post, onClose, onEdit, onDelete }: PostDetailModalProps) {
  const toast = useToast();
  const copyLabel = getPostCopyLabel(post);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getPostCopyText(post));
      toast.show({
        message:
          copyLabel === 'Copiar' ? 'Post copiado' : copyLabel === 'Copiar link' ? 'Link copiado' : 'Links copiados',
        tone: 'success',
        duration: 2500,
      });
    } catch {
      toast.show({ message: 'Não foi possível copiar o post.', tone: 'error' });
    }
  };

  return (
    <Modal onClose={onClose} labelledBy="post-detail-title" size="2xl">
      <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            {getPostPlatforms(post).map((plt) => (
              <span key={plt} className={`px-3 py-1 rounded-full text-xs font-bold ${PLATFORM_STYLES[plt]}`}>
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
            <span className="text-xs text-gray-500 font-medium">{getPostDisplayDate(post)}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 -mt-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <h3 id="post-detail-title" className="text-xl font-bold text-gray-900">
            {post.title}
          </h3>

          {isLinkOnlyPost(post) ? (
            <PostBody post={post} />
          ) : (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              <PostBody post={post} />
            </div>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.map((h) => (
                <span key={h} className="text-xs font-semibold text-primary">
                  {formatHashtag(h)}
                </span>
              ))}
            </div>
          )}

          <PostMetrics post={post} className="pt-1" />
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:bg-danger/10 px-3 py-2 rounded-xl"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={() => void handleCopy()}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>{copyLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
