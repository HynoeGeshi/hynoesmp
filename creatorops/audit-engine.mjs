const CATEGORY_ORDER = ['packaging', 'operations', 'monetization', 'consistency', 'positioning'];

const KEYWORDS = {
  packaging: ['view', 'views', 'click', 'clicks', 'title', 'titles', 'thumbnail', 'thumbnails', 'ctr', 'discover', 'reach', 'impression', 'hook'],
  operations: ['overwhelm', 'overwhelmed', 'admin', 'workflow', 'tasks', 'task', 'system', 'systems', 'organize', 'organisation', 'organization', 'too many', 'manage'],
  monetization: ['money', 'revenue', 'sponsor', 'sponsors', 'brand deal', 'brand deals', 'monetize', 'monetization', 'income', 'sales', 'offer', 'offers'],
  consistency: ['consistent', 'consistency', 'schedule', 'burnout', 'burn out', 'routine', 'cadence', 'sporadic', 'irregular', 'upload regularly', 'post regularly'],
  positioning: ['niche', 'positioning', 'audience', 'identity', 'brand', 'who is this for', 'direction', 'differentiate']
};

const CATEGORY_COPY = {
  packaging: {
    label: 'Packaging & discovery',
    why: 'Strong work cannot compound if the promise is unclear before someone clicks. Packaging turns the value already inside the content into a reason to choose it.',
    summary: 'Your fastest leverage is making each piece of content easier to understand, easier to choose, and easier to connect to the next piece.',
    actions: [
      ['Define the promise before production', 'Decide the transformation, tension, question, or payoff before recording.', 'Write one sentence explaining why the right viewer should care before you create the next piece.'],
      ['Build a repeatable packaging system', 'Titles, thumbnails, hooks, and descriptions should reinforce one idea instead of competing with each other.', 'Draft three title angles and one thumbnail concept before the next publish.'],
      ['Create a feedback loop', 'The goal is to learn which promises earn attention instead of reinventing packaging every upload.', 'Track the premise, format, and audience response for the next three posts in one scorecard.']
    ]
  },
  operations: {
    label: 'Creator operations',
    why: 'Growth gets expensive when every recurring task lives in your head. A simple operating rhythm protects creative time and prevents good opportunities from disappearing.',
    summary: 'Your biggest leverage is reducing operational drag so content, follow-up, analytics, and monetization stop competing for the same attention.',
    actions: [
      ['Build one weekly command center', 'A single source of truth removes constant context switching.', 'Put ideas, current content, follow-ups, analytics, and revenue tasks into one weekly view.'],
      ['Separate creative work from operator work', 'Batching prevents admin from interrupting creation all day.', 'Choose two short operator blocks each week and protect the remaining creation windows.'],
      ['Automate only the repeatable steps', 'Automation works best after the workflow is clear.', 'List the three tasks you repeat most often and document their exact steps before automating them.']
    ]
  },
  monetization: {
    label: 'Monetization path',
    why: 'Attention becomes a business only when the audience has a clear, trustworthy next step that fits why they follow you.',
    summary: 'Your fastest leverage is designing one simple revenue path around the audience you already want to serve instead of adding random monetization tactics.',
    actions: [
      ['Choose one primary revenue path', 'One focused offer is easier to explain, test, and improve than five weak ones.', 'Pick the single offer, service, membership, product, or sponsor category that best fits your audience now.'],
      ['Connect content to intent', 'Monetization works better when the call to action naturally follows the content.', 'Map one low-friction next step to your three most common content topics.'],
      ['Build sponsor and buyer readiness', 'Clear positioning and proof make it easier for brands or customers to understand the value.', 'Create a one-page summary of audience, content themes, proof, and the outcomes you can help create.']
    ]
  },
  consistency: {
    label: 'Consistency system',
    why: 'Consistency is easier to sustain when the cadence matches your real capacity and every publishing step has a clear next action.',
    summary: 'Your biggest leverage is replacing bursts of motivation with a smaller repeatable publishing rhythm that survives busy weeks.',
    actions: [
      ['Set a minimum viable cadence', 'A schedule you can maintain is more valuable than an ambitious schedule you repeatedly abandon.', 'Choose the smallest weekly publishing promise you can keep for the next four weeks.'],
      ['Create content in stages', 'Separating ideas, production, packaging, publishing, and repurposing reduces restart friction.', 'Move every active piece through the same five-stage board instead of handling each one differently.'],
      ['Build a buffer', 'A small inventory protects consistency when life interrupts the schedule.', 'Prepare one publish-ready piece and three backup ideas before increasing frequency.']
    ]
  },
  positioning: {
    label: 'Positioning & audience clarity',
    why: 'Growth becomes easier when a new viewer can quickly understand who the creator is for, what they can expect, and why they should return.',
    summary: 'Your fastest leverage is sharpening the promise of the creator brand before adding more output or more tools.',
    actions: [
      ['Write the audience promise', 'A clear promise gives every content decision a filter.', 'Finish this sentence in one line: “People follow me because I consistently help or entertain them by…”'],
      ['Choose repeatable content pillars', 'A small set of recognizable themes makes the brand easier to remember.', 'Choose three content pillars that all serve the same audience promise.'],
      ['Create a return reason', 'A recurring series or progression gives casual viewers a reason to become regulars.', 'Design one named recurring format that can continue for at least six episodes or posts.']
    ]
  }
};

const PLAN = {
  packaging: ['Write the audience promise for the next upload.', 'Draft three title angles around one payoff.', 'Sketch one thumbnail or opening-hook concept.', 'Publish using the strongest single promise.', 'Review early audience response without changing strategy impulsively.', 'Repurpose the strongest moment into a short-form hook.', 'Record what worked and choose the next test.'],
  operations: ['List every recurring creator task.', 'Group tasks into create, publish, analyze, monetize, and follow-up.', 'Choose one weekly command-center view.', 'Time-block creation separately from operator work.', 'Document the most repeated workflow.', 'Automate or template one low-risk repeated step.', 'Review the week and remove one unnecessary task.'],
  monetization: ['Choose one primary revenue path.', 'Write the audience problem or desire it serves.', 'Create one simple offer statement.', 'Add one natural content-to-offer call to action.', 'Prepare proof or examples that support the offer.', 'Create a simple sponsor/customer readiness page.', 'Review questions or objections and refine the offer.'],
  consistency: ['Choose a realistic weekly cadence.', 'Create a five-stage content board.', 'Fill the board with the next three ideas.', 'Produce one piece without adding new scope.', 'Package and schedule it before starting another.', 'Create one backup piece or reusable asset.', 'Review the cadence and adjust only if it is unsustainable.'],
  positioning: ['Write a one-line audience promise.', 'Choose three content pillars.', 'Remove one topic that does not support the promise.', 'Design one recurring series.', 'Update the next content idea to fit a pillar.', 'Make the profile description reinforce the same promise.', 'Review the system for clarity from a new viewer’s perspective.']
};

function normalize(input) {
  return String(input || '').toLowerCase();
}

function classify(input) {
  const text = normalize([input.goal, input.bottleneck, input.interest, input.revenue].join(' '));
  const scores = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
  for (const category of CATEGORY_ORDER) {
    for (const keyword of KEYWORDS[category]) {
      if (text.includes(keyword)) scores[category] += keyword.includes(' ') ? 2 : 1;
    }
  }
  const max = Math.max(...Object.values(scores));
  if (max <= 0) return 'positioning';
  return CATEGORY_ORDER.find((category) => scores[category] === max) || 'positioning';
}

function platformName(value) {
  const name = String(value || 'creator platform').trim();
  return name || 'creator platform';
}

function recommendedOffer(input, category) {
  const interest = normalize(input.interest);
  const revenue = normalize(input.revenue);
  if (interest.includes('750') || interest.includes('founding')) return { code: 'founding_creatorops', title: 'Run It With Me', reason: 'You indicated interest in ongoing operating support, so the next fit is a hands-on CreatorOps partnership.' };
  if (interest.includes('499') || interest.includes('system build')) return { code: 'system_build', title: 'Build My System', reason: 'You indicated interest in a one-time operating-system build, which fits a defined bottleneck that needs structure.' };
  if (interest.includes('free audit only')) return { code: 'free_audit', title: 'Use the Starter Audit first', reason: 'Start by applying the three priority moves and use the results to decide whether deeper implementation support is worth it.' };
  if (['$2,000–$4,999', '$5,000+', '$2,000-$4,999'].some((v) => revenue.includes(v.toLowerCase())) || category === 'operations') return { code: 'founding_creatorops', title: 'Run It With Me', reason: 'Your next constraint is likely ongoing operating capacity rather than another isolated tactic.' };
  return { code: 'system_build', title: 'Build My System', reason: 'A one-time CreatorOps build can turn these priorities into a repeatable system before you add more complexity.' };
}

export function generateStarterAudit(input = {}) {
  const category = classify(input);
  const copy = CATEGORY_COPY[category];
  const platform = platformName(input.primaryPlatform);
  const creatorName = String(input.creatorName || 'Creator').trim().slice(0, 120) || 'Creator';
  const profileUrl = String(input.profileUrl || '').trim().slice(0, 500);

  return {
    version: 1,
    creator: {
      display_name: creatorName,
      primary_platform: platform,
      profile_url: profileUrl
    },
    summary: `${copy.summary} This Starter Creator Audit uses the context you submitted for your ${platform} work and is designed to give you a practical next move without pretending we have private analytics we have not connected.`,
    primary_bottleneck: {
      code: category,
      label: copy.label,
      why_it_matters: copy.why
    },
    priority_actions: copy.actions.map(([title, reason, next_step], index) => ({ rank: index + 1, title, reason, next_step })),
    seven_day_plan: PLAN[category].map((action, index) => ({ day: index + 1, action })),
    monetization_opportunity: {
      title: category === 'monetization' ? 'Turn attention into one clear offer path' : 'Connect the stronger system to one natural revenue path',
      explanation: category === 'monetization'
        ? 'Choose one offer or sponsor category that genuinely fits the audience, then make the path from content to action obvious and low pressure.'
        : 'Once the primary bottleneck is under control, map one audience-aligned offer, service, sponsor category, or membership path instead of adding several monetization tactics at once.'
    },
    creatorops_can_handle: [
      `Turn the ${copy.label.toLowerCase()} diagnosis into a repeatable operating system.`,
      'Build the weekly workflow, scorecard, templates, and follow-up rhythm around that system.',
      'Review the signals with you and keep the next highest-leverage move visible.'
    ],
    recommended_offer: recommendedOffer(input, category),
    limitations: [
      'This starter audit is based on the information submitted and does not yet include private connected-platform analytics.',
      'It does not promise or guarantee a specific growth, revenue, or platform outcome.'
    ]
  };
}
