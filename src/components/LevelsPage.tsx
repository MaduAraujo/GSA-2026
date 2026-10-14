import React from 'react';
import { Flag, Trophy } from 'lucide-react';
import { useCollection } from '../data/queries';
import { LEVELS, levelProgress } from './levels';

const PROGRESS_GRADIENT = 'linear-gradient(to right, #EA4335, #FBBC04, #34A853, #1A73E8)';

const ProgressCard: React.FC<{ points: number }> = ({ points }) => {
  const { current, next, pointsToNext, percent } = levelProgress(points);
  const barScale = percent > 0 ? (100 / percent) * 100 : 100;

  return (
    <div className="mt-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#EA4335]/10">
          <Flag aria-hidden="true" className="h-6 w-6 text-[#EA4335]" />
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {next ? (
            <>
              VOCÊ ESTÁ A <span className="text-[#1A73E8]">{pointsToNext} PONTOS</span> PARA DESBLOQUEAR O PRÓXIMO NÍVEL
              NO PROGRAMA
            </>
          ) : (
            'VOCÊ ALCANÇOU O NÍVEL MÁXIMO DO PROGRAMA!'
          )}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {points} {points === 1 ? 'ponto' : 'pontos'} na aba Pontuação
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Progresso até o próximo nível"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%`, backgroundImage: PROGRESS_GRADIENT, backgroundSize: `${barScale}% 100%` }}
        />
      </div>

      <div className="mt-3 flex items-start justify-between gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Nível atual</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{current.title}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{next ? 'Próximo marco!' : 'Nível máximo'}</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{next ? next.title : current.title}</p>
        </div>
      </div>
    </div>
  );
};

export const LevelsView: React.FC<{ points?: number }> = ({ points }) => {
  const currentLevel = points === undefined ? null : levelProgress(points).current.level;

  return (
    <section
      aria-labelledby="levels-heading"
      className="max-w-4xl mx-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 sm:p-12"
    >
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#F9AB00]/10">
          <Trophy className="h-7 w-7 text-[#F9AB00]" />
        </div>

        <h1
          id="levels-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100"
        >
          SUBINDO DE NÍVEL
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          À medida que a participação avança, novos níveis são desbloqueados. Veja quais são eles:
        </p>
      </div>

      {points !== undefined && <ProgressCard points={points} />}

      <ol className="mt-6 space-y-3">
        {LEVELS.map(({ level, title, icon: Icon, color, bg, description }) => {
          const isCurrent = level === currentLevel;
          return (
            <li
              key={level}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-start gap-4 rounded-2xl border p-5 sm:p-6 ${
                isCurrent
                  ? 'border-[#1A73E8] bg-[#1A73E8]/5'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}>
                <Icon aria-hidden="true" className={`h-6 w-6 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>Nível {level}</p>
                  {isCurrent && (
                    <span className="rounded-full bg-[#1A73E8] px-2.5 py-0.5 text-xs font-semibold text-white">
                      Seu nível
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export const LevelsPage: React.FC = () => {
  const weeklyScores = useCollection('weeklyScores');
  const points = weeklyScores.isPending
    ? undefined
    : (weeklyScores.data ?? []).reduce((sum, w) => sum + (w.points || 0), 0);

  return <LevelsView points={points} />;
};
