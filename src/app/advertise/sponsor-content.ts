import {
  lastBookedSponsorCampaign,
  scheduledSponsorCampaigns,
  type BookedSponsorCampaign,
  type SponsorPackage,
} from "~/lib/sponsor-campaign";
import { sponsorCreatives } from "~/lib/sponsor-creative";
import type { SponsorStats } from "~/server/sponsor-stats";

export const SPONSOR_EMAIL_ADDRESS = "ahmed@gitdiagram.com";
export const SPONSOR_EMAIL = `mailto:${SPONSOR_EMAIL_ADDRESS}?subject=Advertising%20on%20GitDiagram`;
export const SPONSOR_PRICE = "$999";
export const SPONSOR_EXCLUSIVE_PRICE = "$3,499";

/**
 * Locale-scoped translator from `getTranslations("advertise")`. Optional
 * everywhere below: without one every string keeps its English literal,
 * which is what the tests and the default EN messages render against.
 */
export type SponsorTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

function pick(
  t: SponsorTranslate | undefined,
  key: string,
  values: Record<string, string | number> | undefined,
  en: string,
) {
  return t ? t(key, values) : en;
}

export const sponsorFitKeys = ["f1", "f2", "f3", "f4"] as const;
// Every scheduled campaign is a booked advertiser; list each sponsor once,
// except those whose creative leaves them out of the logo grid.
export const advertisers = [
  ...new Map(
    scheduledSponsorCampaigns.flatMap(({ id, sponsor, destination }) => {
      const { logo, advertiserRow } = sponsorCreatives[id];
      if (advertiserRow === false) return [];
      const row = advertiserRow ?? {
        src: logo.src,
        darkSrc: logo.colorDarkSrc ?? logo.darkSrc,
        scale: 1,
      };
      // Same area for every logo, so wide wordmarks don't dominate.
      const width = Math.round(
        Math.sqrt((3000 * row.scale * logo.width) / logo.height),
      );
      return [
        [
          sponsor,
          {
            name: sponsor,
            href: destination,
            src: row.src,
            darkSrc: row.darkSrc,
            width,
            height: Math.round((width * logo.height) / logo.width),
          },
        ] as const,
      ];
    }),
  ).values(),
];
export type SponsorMetric = { label: string; value: string; detail: string };
export type SponsorSurface = {
  name: string;
  metric: { value: string; label: string } | null;
  description: string;
  preview: {
    src: string;
    width: number;
    height: number;
    highlight: { x: number; y: number; width: number; height: number };
    alt: string;
    caption: string;
  };
};

const numberFormatter = new Intl.NumberFormat("en-US");
const dateOptions: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
};
const dateFormatter = new Intl.DateTimeFormat("en-US", dateOptions);
const updatedAtFormatter = new Intl.DateTimeFormat("en-US", {
  ...dateOptions,
  hour: "numeric",
  minute: "2-digit",
});
const bookingDayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "America/Toronto",
});
const bookingDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Toronto",
});
const format = (value: number) => numberFormatter.format(value);
const date = (value: string, includeTime = false) =>
  (includeTime ? updatedAtFormatter : dateFormatter).format(new Date(value));

const RUN_MS = 30 * 24 * 60 * 60 * 1000;

// The first moment (now, or when a booked campaign ends) from which a 30-day
// run of the given package fits the schedule: an exclusive run needs nothing
// else booked, a shared run at most one other shared campaign.
function openFrom(
  now: number,
  sponsorPackage: SponsorPackage,
  campaigns: readonly BookedSponsorCampaign[],
) {
  const booked = campaigns.filter(({ endsAt }) => Date.parse(endsAt) > now);
  const starts = [now, ...booked.map(({ endsAt }) => Date.parse(endsAt))].sort(
    (a, b) => a - b,
  );
  return starts.find((start) => {
    const overlapping = booked.filter(
      ({ startsAt, endsAt }) =>
        Date.parse(startsAt) < start + RUN_MS && Date.parse(endsAt) > start,
    );
    return sponsorPackage === "exclusive"
      ? overlapping.length === 0
      : overlapping.length < 2 &&
          overlapping.every((campaign) => campaign.package === "shared");
  })!;
}

// Availability and the booking note follow the campaign schedule, so they
// never outlive a booking.
export function createSponsorBooking(
  now = Date.now(),
  campaigns: readonly BookedSponsorCampaign[] = scheduledSponsorCampaigns,
  t?: SponsorTranslate,
) {
  const campaign = lastBookedSponsorCampaign(now, campaigns);
  if (!campaign)
    return {
      availability: pick(
        t,
        "booking.availableNow",
        undefined,
        "Available now.",
      ),
      offerTiming: pick(
        t,
        "booking.offerNow",
        undefined,
        "New campaigns can start right away.",
      ),
      bookedBy: null,
    };
  const creative = sponsorCreatives[campaign.id];
  const nextStart = bookingDateFormatter.format(new Date(campaign.endsAt));
  const sharedFrom = openFrom(now, "shared", campaigns);
  const sharedStart = bookingDateFormatter.format(new Date(sharedFrom));
  const bookedFrom = campaign.bookedFrom ?? campaign.startsAt;
  const sharedSooner = sharedFrom < Date.parse(campaign.endsAt);
  const sharedNow = sharedFrom <= now;
  const availability = sharedSooner
    ? sharedNow
      ? pick(
          t,
          "booking.availabilitySharedNow",
          { exclusive: nextStart },
          `Shared spot available now. Exclusive from ${nextStart}.`,
        )
      : pick(
          t,
          "booking.availabilitySharedFrom",
          { from: sharedStart, exclusive: nextStart },
          `Shared spot from ${sharedStart}. Exclusive from ${nextStart}.`,
        )
    : pick(
        t,
        "booking.availabilityNext",
        { exclusive: nextStart },
        `Next available: ${nextStart}.`,
      );
  const offerTiming = sharedSooner
    ? sharedNow
      ? pick(
          t,
          "booking.offerSharedNow",
          { exclusive: nextStart, name: creative.name },
          `A shared spot can start right away. Exclusive campaigns start from ${nextStart}, after ${creative.name}’s run.`,
        )
      : pick(
          t,
          "booking.offerSharedFrom",
          { from: sharedStart, exclusive: nextStart, name: creative.name },
          `A shared spot can start from ${sharedStart}. Exclusive campaigns start from ${nextStart}, after ${creative.name}’s run.`,
        )
    : pick(
        t,
        "booking.offerNext",
        { exclusive: nextStart, name: creative.name },
        `New campaigns start from ${nextStart}, after ${creative.name}’s run.`,
      );
  const bookingDay = bookingDayFormatter.format(new Date(bookedFrom));
  return {
    availability,
    offerTiming,
    bookedBy: {
      label: pick(
        t,
        "booking.bookedBy",
        { day: bookingDay },
        `${bookingDay} campaign booked by`,
      ),
      name: creative.name,
      logo: creative.logo,
    },
  };
}

export function createSponsorContent(
  stats: SponsorStats | null,
  now = Date.now(),
  t?: SponsorTranslate,
) {
  const booking = createSponsorBooking(now, scheduledSponsorCampaigns, t);
  if (!stats) {
    return {
      ...booking,
      audience: null,
      surfaces: sponsorSurfaces(null, t),
    };
  }
  const monthly: SponsorMetric[] = [
    {
      label: pick(t, "uniqueVisitors", undefined, "Unique visitors"),
      value: format(stats.monthlyVisitors),
      detail: pick(
        t,
        "detailUniqueAll",
        undefined,
        "Unique, across GitDiagram",
      ),
    },
    {
      label: pick(t, "pageviews", undefined, "Pageviews"),
      value: format(stats.monthlyPageviews),
      detail: pick(t, "detailAcross", undefined, "Across GitDiagram"),
    },
    {
      label: pick(t, "repoVisitors", undefined, "Repo page visitors"),
      value: format(stats.repoVisitors),
      detail: pick(
        t,
        "detailRepoVisitors",
        undefined,
        "Unique visitors to repository pages",
      ),
    },
  ];
  const lifetime: SponsorMetric[] = [
    {
      label: pick(t, "uniqueVisitors", undefined, "Unique visitors"),
      value: format(stats.lifetimeVisitors),
      detail: pick(
        t,
        "detailSince",
        { date: date(stats.trackedSince) },
        `Since ${date(stats.trackedSince)}`,
      ),
    },
    {
      label: pick(t, "pageviews", undefined, "Pageviews"),
      value: format(stats.lifetimePageviews),
      detail: pick(t, "detailAcross", undefined, "Across GitDiagram"),
    },
    {
      label: pick(t, "githubStars", undefined, "GitHub stars"),
      value: format(stats.githubStars),
      detail: pick(t, "detailStars", undefined, "Open-source developer reach"),
    },
  ];
  return {
    ...booking,
    audience: {
      monthlyVisitors: format(stats.monthlyVisitors),
      monthly,
      lifetime,
      asOf: stats.asOf,
      updatedAt: pick(
        t,
        "updatedAt",
        { time: date(stats.asOf, true) },
        `${date(stats.asOf, true)} ET`,
      ),
    },
    surfaces: sponsorSurfaces(stats, t),
  };
}
function sponsorSurfaces(
  stats: SponsorStats | null,
  t?: SponsorTranslate,
): SponsorSurface[] {
  const metric = (value: number | undefined, label: string) =>
    value === undefined ? null : { value: format(value), label };
  const pageviewsLabel = pick(t, "metricPageviews", undefined, "pageviews");
  const starsLabel = pick(t, "metricGithubStars", undefined, "GitHub stars");
  return [
    {
      name: pick(
        t,
        "surfaces.repoDiagram.name",
        undefined,
        "Repo diagram pages",
      ),
      metric: metric(stats?.repoPageviews, pageviewsLabel),
      description: pick(
        t,
        "surfaces.repoDiagram.description",
        undefined,
        "An ad placement beneath generated architecture diagrams, with your logo, product description, and a link to your site.",
      ),
      preview: {
        src: "/sponsor-previews/diagram.png",
        width: 2880,
        height: 1800,
        highlight: { x: 273, y: 1384, width: 2304, height: 138 },
        alt: pick(
          t,
          "surfaces.repoDiagram.alt",
          undefined,
          "The FastAPI architecture diagram with the full-width ad space directly beneath it.",
        ),
        caption: pick(
          t,
          "surfaces.repoDiagram.caption",
          undefined,
          "A full-width placement beneath the generated diagram.",
        ),
      },
    },
    {
      name: pick(t, "surfaces.homepage.name", undefined, "Homepage"),
      metric: metric(stats?.homePageviews, pageviewsLabel),
      description: pick(
        t,
        "surfaces.homepage.description",
        undefined,
        "Your product appears below the repository lookup controls, where developers start turning codebases into diagrams.",
      ),
      preview: {
        src: "/sponsor-previews/home.png",
        width: 2880,
        height: 1800,
        highlight: { x: 742, y: 1284, width: 1396, height: 138 },
        alt: pick(
          t,
          "surfaces.homepage.alt",
          undefined,
          "GitDiagram’s homepage with the ad space below the repository input and example repositories.",
        ),
        caption: pick(
          t,
          "surfaces.homepage.caption",
          undefined,
          "Inside the repository lookup panel, below the examples.",
        ),
      },
    },
    {
      name: pick(t, "surfaces.browse.name", undefined, "Browse catalog"),
      metric: metric(stats?.browsePageviews, pageviewsLabel),
      description: pick(
        t,
        "surfaces.browse.description",
        undefined,
        "A dedicated ad row among the public repository listings, with your logo, description, and link.",
      ),
      preview: {
        src: "/sponsor-previews/browse.png",
        width: 2880,
        height: 1800,
        highlight: { x: 279, y: 1105, width: 2292, height: 130 },
        alt: pick(
          t,
          "surfaces.browse.alt",
          undefined,
          "GitDiagram’s browse catalog with a dedicated ad row between the first two repository listings.",
        ),
        caption: pick(
          t,
          "surfaces.browse.caption",
          undefined,
          "A dedicated row immediately after the first repository.",
        ),
      },
    },
    {
      name: pick(t, "surfaces.readme.name", undefined, "GitHub README"),
      metric: metric(stats?.githubStars, starsLabel),
      description: pick(
        t,
        "surfaces.readme.description",
        undefined,
        "Included in the exclusive package: an ad near the top of GitDiagram’s GitHub README, linking directly to your product.",
      ),
      preview: {
        src: "/sponsor-previews/readme.png",
        width: 1756,
        height: 1120,
        highlight: { x: 40, y: 333, width: 1676, height: 149 },
        alt: pick(
          t,
          "surfaces.readme.alt",
          undefined,
          "GitDiagram’s README on GitHub with the ad between the introduction and Features section.",
        ),
        caption: pick(
          t,
          "surfaces.readme.caption",
          undefined,
          "Below the introduction, before the Features section.",
        ),
      },
    },
  ];
}

export type SponsorContent = ReturnType<typeof createSponsorContent>;
