import React from 'react';
import EvaluacionesHeroBanner, {
  EvaluacionesHeroBannerProps,
} from '@/components/evaluaciones/EvaluacionesHeroBanner';

export interface DirectoresEvaluacionesHeroBannerProps
  extends EvaluacionesHeroBannerProps {}

export const DirectoresEvaluacionesHeroBanner: React.FC<
  DirectoresEvaluacionesHeroBannerProps
> = (props) => {
  return <EvaluacionesHeroBanner {...props} />;
};

export default DirectoresEvaluacionesHeroBanner;
