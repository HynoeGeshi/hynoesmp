export type PageHealthInput = {
  pageType: string;
  publicationState: 'draft' | 'published';
  name: string;
  summary: string;
  description: string;
  canonicalUrl: string | null;
  categories: string[];
  tags: string[];
  locationLabel: string | null;
  serviceArea: string | null;
};

export type PageHealth = {
  score: number;
  band: 'strong' | 'building' | 'needs_work';
  recommendations: string[];
};

function isHttpsUrl(value: string | null) {
  if (!value) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function scorePageHealth(input: PageHealthInput): PageHealth {
  let score = 0;
  const recommendations: string[] = [];
  const name = input.name.trim();
  const summary = input.summary.trim();
  const description = input.description.trim();
  const categories = input.categories.filter(Boolean);
  const tags = input.tags.filter(Boolean);

  if (name.length >= 3) score += 10;
  else recommendations.push('Use a clear Page name with at least 3 characters.');

  if (summary.length >= 60) score += 15;
  else if (summary.length > 0) {
    score += 8;
    recommendations.push('Strengthen the summary to 60–240 characters and say exactly what people can find, buy, book, join, or follow.');
  } else {
    recommendations.push('Add a specific 60–240 character summary describing what people can find, buy, book, join, or follow.');
  }

  if (description.length >= 200) score += 20;
  else if (description.length >= 80) {
    score += 10;
    recommendations.push('Expand the About section to 200+ characters with proof, specialties, context, and a next step.');
  } else if (description.length > 0) {
    score += 5;
    recommendations.push('Expand the About section to 200+ characters so visitors and Search have enough context.');
  } else {
    recommendations.push('Add an About section with at least 200 characters of useful detail.');
  }

  if (categories.length >= 2) score += 15;
  else if (categories.length === 1) {
    score += 8;
    recommendations.push('Add at least one more precise category so Hynoe can match the Page to more relevant searches.');
  } else {
    recommendations.push('Add 2–4 precise categories for stronger discovery matching.');
  }

  if (tags.length >= 4) score += 10;
  else if (tags.length >= 2) {
    score += 5;
    recommendations.push('Add at least 4 intent-focused tags people would realistically search for.');
  } else if (tags.length === 1) {
    score += 2;
    recommendations.push('Add at least 4 intent-focused tags people would realistically search for.');
  } else {
    recommendations.push('Add at least 4 intent-focused search tags.');
  }

  if (isHttpsUrl(input.canonicalUrl)) score += 10;
  else recommendations.push('Add an HTTPS website or destination so visitors have a clear next step.');

  const needsLocation = input.pageType === 'local_business' || input.pageType === 'service_provider';
  if (!needsLocation || input.locationLabel?.trim() || input.serviceArea?.trim()) score += 10;
  else recommendations.push('Add a location or service area so nearby customers can understand where you work.');

  if (input.publicationState === 'published') score += 10;
  else recommendations.push('Publish the Page when it is ready so it can appear in Hynoe Search.');

  return {
    score,
    band: score >= 90 ? 'strong' : score >= 70 ? 'building' : 'needs_work',
    recommendations,
  };
}
