import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
import { SponsorEmailActions } from "./sponsor-email-actions";
import { SponsorPlacementPreview } from "./sponsor-placement-preview";
import {
  advertisers,
  SPONSOR_EMAIL,
  SPONSOR_EMAIL_ADDRESS,
  SPONSOR_PRICE,
  SPONSOR_EXCLUSIVE_PRICE,
  sponsorFitKeys,
  type SponsorContent,
  type SponsorMetric,
} from "./sponsor-content";
import styles from "./sponsor-page.module.css";

function AudienceMetrics({
  title,
  metrics,
}: {
  title: ReactNode;
  metrics: SponsorMetric[];
}) {
  return (
    <div className={styles.metricGroup}>
      <h3>{title}</h3>
      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd className={styles.metricValue}>{metric.value}</dd>
            <dd className={styles.metricDetail}>{metric.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export async function SponsorPageContent({
  content,
}: {
  content: SponsorContent;
}) {
  const t = await getTranslations("advertise");
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>
          {t("heroTitle1")}
          <br />
          <span>{t("heroTitle2")}</span>
        </h1>
        <p className={styles.introduction}>
          {content.audience && (
            <>
              {t.rich("introVisitors", {
                count: content.audience.monthlyVisitors,
                strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
              })}{" "}
            </>
          )}
          {t("introRest")}
        </p>
        <p className={styles.offerSummary}>
          <span>
            {t.rich("offerFrom", {
              price: SPONSOR_PRICE,
              strong: (chunks: ReactNode) => <strong>{chunks}</strong>,
            })}
          </span>
          <span className={styles.offerSummaryDetails}>
            {t("offerVariants")}
          </span>
        </p>
        <p className={styles.availability}>{content.availability}</p>
        <div className={styles.heroActions}>
          <SponsorEmailActions
            email={SPONSOR_EMAIL_ADDRESS}
            mailto={SPONSOR_EMAIL}
          />
          <a href="#sponsor-placements" className={styles.textLink}>
            {t("seePlacements")}
            <ArrowDown aria-hidden="true" />
          </a>
        </div>
        <div className={styles.advertisers}>
          <p id="advertisers-label">{t("hasRunCampaignsFor")}</p>
          <ul aria-labelledby="advertisers-label">
            {advertisers.map(({ name, href, src, darkSrc, width, height }) => {
              const size = {
                width,
                height,
                style: { "--w": `${width}px` } as CSSProperties,
              };
              return (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="sponsored noopener"
                    aria-label={name}
                  >
                    <Image
                      src={src}
                      alt=""
                      {...size}
                      className={
                        darkSrc ? styles.advertiserLogoLight : undefined
                      }
                      unoptimized
                    />
                    {darkSrc && (
                      <Image
                        src={darkSrc}
                        alt=""
                        {...size}
                        className={styles.advertiserLogoDark}
                        unoptimized
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section
        id="sponsor-audience"
        className={styles.audience}
        aria-labelledby="audience-title"
      >
        <h2 id="audience-title">{t("audienceTitle")}</h2>
        {content.audience ? (
          <div className={styles.audienceColumns}>
            <AudienceMetrics
              title={t("last30")}
              metrics={content.audience.monthly}
            />
            <AudienceMetrics
              title={t("lifetime")}
              metrics={content.audience.lifetime}
            />
          </div>
        ) : (
          <p className={styles.statsError} role="status">
            {t("statsError")}
          </p>
        )}
        <div className={styles.dataNote}>
          <p>
            {t("source")}
            {content.audience && (
              <>
                {" "}
                <time dateTime={content.audience.asOf}>
                  {t("updated", { time: content.audience.updatedAt })}
                </time>
              </>
            )}
          </p>
          <p>{t("dataNote")}</p>
        </div>
      </section>

      <section
        className={styles.detailSection}
        id="sponsor-placements"
        aria-labelledby="placements-title"
      >
        <h2 id="placements-title">{t("placementsTitle")}</h2>
        <div>
          <div className={styles.placements}>
            {content.surfaces.map((surface) => (
              <article key={surface.name}>
                <div className={styles.placementHeading}>
                  <h3>{surface.name}</h3>
                  {surface.metric && (
                    <p>
                      <span>{surface.metric.value}</span> {surface.metric.label}
                    </p>
                  )}
                </div>
                <p>{surface.description}</p>
                <SponsorPlacementPreview
                  name={surface.name}
                  preview={surface.preview}
                />
              </article>
            ))}
          </div>
          <p className={styles.placementNote}>{t("placementsNote")}</p>
        </div>
      </section>

      <section className={styles.detailSection} aria-labelledby="fit-title">
        <div>
          <h2 id="fit-title">{t("fitTitle")}</h2>
          <p className={styles.sectionIntro}>{t("fitIntro")}</p>
        </div>
        <div>
          <ul className={styles.fitList}>
            {sponsorFitKeys.map((fit) => (
              <li key={fit}>{t(`fits.${fit}`)}</li>
            ))}
          </ul>
          <p className={styles.privacy}>{t("fitPrivacy")}</p>
        </div>
      </section>

      <section
        className={styles.offer}
        id="sponsor-offer"
        aria-labelledby="offer-title"
      >
        {content.bookedBy && (
          <p className={styles.bookingNote}>
            <span>{content.bookedBy.label}</span>
            <Image
              src={content.bookedBy.logo.src}
              alt={content.bookedBy.name}
              width={content.bookedBy.logo.width}
              height={content.bookedBy.logo.height}
              className={
                content.bookedBy.logo.darkSrc
                  ? styles.bookingLogoLight
                  : undefined
              }
              unoptimized
            />
            {content.bookedBy.logo.darkSrc && (
              <Image
                src={content.bookedBy.logo.darkSrc}
                alt={content.bookedBy.name}
                width={content.bookedBy.logo.width}
                height={content.bookedBy.logo.height}
                className={styles.bookingLogoDark}
                unoptimized
              />
            )}
          </p>
        )}
        <div className={styles.offerHeading}>
          <div>
            <h2 id="offer-title">{t("offerTitle")}</h2>
            <p className={styles.offerDescription}>
              {content.offerTiming} {t("offerTimingSuffix")}
            </p>
          </div>
        </div>
        <dl className={styles.planList}>
          <div>
            <dt>{t("sharedSpot")}</dt>
            <dd className={styles.planPrice}>
              {SPONSOR_PRICE} <span>{t("usdPer30")}</span>
            </dd>
            <dd className={styles.planDescription}>
              {t("sharedSpotDescription")}
            </dd>
          </div>
          <div>
            <dt>{t("exclusiveSpot")}</dt>
            <dd className={styles.planPrice}>
              {SPONSOR_EXCLUSIVE_PRICE} <span>{t("usdPer30")}</span>
            </dd>
            <dd className={styles.planDescription}>
              {t("exclusiveSpotDescription")}
            </dd>
          </div>
        </dl>
        <div className={styles.offerActions}>
          <div>
            <SponsorEmailActions
              email={SPONSOR_EMAIL_ADDRESS}
              mailto={SPONSOR_EMAIL}
            />
            <p className={styles.availability}>{t("emailBeforePaymentNote")}</p>
          </div>
          <p className={styles.terms}>
            {t("terms1")}
            <br />
            {t("terms2")}
            <br />
            {t("terms3")}
          </p>
        </div>
      </section>
    </main>
  );
}
