export type RetentionStateV1 = {
  recentQueries: string[];
  recentPageSlugs: string[];
  savedPageSlugs: string[];
  followedPageSlugs: string[];
};

export function emptyRetentionState(): RetentionStateV1 {
  return {
    recentQueries: [],
    recentPageSlugs: [],
    savedPageSlugs: [],
    followedPageSlugs: [],
  };
}
