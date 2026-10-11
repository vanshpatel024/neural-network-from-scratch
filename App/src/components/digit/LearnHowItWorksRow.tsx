import { Link } from 'react-router-dom';
import {
  Grid,
  ArrowRightCircle,
  TrendingDown,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import { docsLink } from '@/lib/links';
import { preloadDocsPage } from '@/lib/preloadDocs';

interface LearnCardItem {
  icon: typeof Grid;
  title: string;
  description: string;
  to: string;
}

const CARDS: LearnCardItem[] = [
  {
    icon: Grid,
    title: 'From Pixels to Numbers',
    description: 'See how a 20 by 20 image turns into a row of 400 numbers.',
    to: docsLink('introduction', 'introduction--project-goal'),
  },
  {
    icon: ArrowRightCircle,
    title: 'Forward Propagation',
    description: 'Follow data as it flows layer by layer to form the prediction.',
    to: docsLink('forward-propagation'),
  },
  {
    icon: TrendingDown,
    title: 'How It Learned',
    description: 'Learn how gradient descent and backpropagation tuned every weight.',
    to: docsLink('gradient-descent'),
  },
  {
    icon: PlayCircle,
    title: 'Train Your Own Model',
    description: 'Step into our interactive playground to train toy models live.',
    to: docsLink('train-your-own-model'),
  },
];

export function LearnHowItWorksRow(): JSX.Element {
  return (
    <section className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-h3 font-bold text-text-primary tracking-tight">
          Learn how it works
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.to}
              onMouseEnter={preloadDocsPage}
              onFocus={preloadDocsPage}
              className="group flex flex-col justify-between rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-accent/60 hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <div className="space-y-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-base text-accent group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-body font-semibold text-text-primary group-hover:text-accent transition-colors">
                    {card.title}
                  </h4>
                  <p className="text-caption text-text-secondary leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-caption font-medium text-accent">
                <span>Read guide</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-caption text-text-muted text-center sm:text-left pt-1">
        This model is already trained. To train your own small models, open the playground in the documentation.
      </p>
    </section>
  );
}

export default LearnHowItWorksRow;
