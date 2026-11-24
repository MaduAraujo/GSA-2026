import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { Award, BadgeCheck, Clock, Calendar, ExternalLink, FileText, Loader2, ShieldAlert } from 'lucide-react';
import { NO_PERSIST_META } from '../lib/queryClient';
import { getPublicPortfolio } from '../services/publicPortfolioApi';
import { formatDuration } from '../utils/duration';
import { isHttpUrl } from '../utils/safeUrl';
import { formatDateBR } from '../utils/date';
import { badgeDisplayName, isBadgeImage } from './certificates/badgeFiles';

interface PublicPortfolioPageProps {
  slug: string;
}

export const PublicPortfolioPage: React.FC<PublicPortfolioPageProps> = ({ slug }) => {
  const { data, status } = useQuery({
    queryKey: ['public-portfolio', slug],
    queryFn: () => getPublicPortfolio(slug),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    meta: NO_PERSIST_META,
  });

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center space-y-3 max-w-sm">
          <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto" />
          <h1 className="text-lg font-bold text-gray-900">Portfólio não encontrado</h1>
          <p className="text-sm text-gray-500">Este link pode estar incorreto ou o portfólio não está mais público.</p>
        </div>
      </div>
    );
  }

  const { profile, certificates, badges } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-1.5 w-full grid grid-cols-4">
        <div className="bg-primary" />
        <div className="bg-danger" />
        <div className="bg-warning" />
        <div className="bg-success" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <img
            src={
              profile.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={profile.name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-primary/20 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-primary/10 text-primary mb-2">
              Embaixadora Estudantil Google 2026
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {[profile.role, profile.university].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>

        {badges.length > 0 && (
          <section aria-labelledby="public-badges-heading" className="space-y-3">
            <h2
              id="public-badges-heading"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 px-1"
            >
              <BadgeCheck className="w-4 h-4 text-primary" />
              Badges em destaque
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((badge) => {
                const name = badgeDisplayName(badge.fileName);
                return (
                  <li key={badge.id}>
                    <a
                      href={badge.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={name}
                      className="group block bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all hover:shadow-md hover:border-gray-300"
                    >
                      <div className="aspect-square flex items-center justify-center p-5 bg-surface-muted">
                        {badge.url && isBadgeImage(badge.fileName) ? (
                          <img
                            src={badge.url}
                            alt={name}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <FileText aria-hidden="true" className="w-10 h-10 text-danger" />
                        )}
                      </div>
                      <p className="truncate border-t border-gray-100 px-3 py-2.5 text-xs font-semibold text-gray-800">
                        {name}
                      </p>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 px-1">Certificados</h2>
          {certificates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-400">
              Nenhum certificado publicado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      {cert.issuer}
                    </span>
                    <span className="text-2xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDateBR(cert.issueDate)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">{cert.title}</h3>
                  {cert.description && <p className="text-xs text-gray-600 leading-relaxed">{cert.description}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {cert.hours || cert.minutes ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                        <Clock className="w-3 h-3 text-success" />
                        {formatDuration(cert.hours, cert.minutes)}
                      </span>
                    ) : (
                      <span />
                    )}
                    {isHttpUrl(cert.credentialUrl) && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        Verificar <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-2xs text-gray-400 pt-4">
          Portfólio gerado pelo Hub da Embaixadora Estudantil Google 2026.
        </p>
      </div>
    </div>
  );
};
