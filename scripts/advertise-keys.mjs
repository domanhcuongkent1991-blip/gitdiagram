import fs from "node:fs";

const en = {
  heroTitle1: "Bring developers",
  heroTitle2: "to your product.",
  introVisitors:
    "GitDiagram had <strong>{count} unique visitors</strong> in the last 30 days.",
  introRest:
    "Reach developers as they explore GitHub repositories, with placements that link directly to your website.",
  offerFrom: "From <strong>{price} USD</strong> · 30 days",
  offerVariants: "Shared or exclusive placements",
  seePlacements: "See the placements",
  hasRunCampaignsFor: "GitDiagram has run campaigns for:",
  audienceTitle: "Audience",
  last30: "Last 30 days",
  lifetime: "Lifetime",
  statsError:
    "The audience figures could not be loaded from PostHog right now. They retry every few minutes; email Ahmed for current numbers.",
  source: "Source: PostHog and GitHub.",
  updated: "Updated {time}.",
  dataNote:
    "Figures refresh about every hour, lifetime totals daily. The 30-day window ends at the time shown. Visitors are unique within each window. Pageviews measure site traffic, not ad impressions.",
  placementsTitle: "Placements",
  placementsNote: "Pageviews are from the same 30-day window.",
  viewPlacement: "View placement",
  viewPlacementAria: "View placement: {name}",
  openFullSize: "Open full size",
  closeHint: "Click outside the image or press Escape to close.",
  loadingPreview: "Loading preview…",
  closePreview: "Close preview",
  fitTitle: "Who it’s for",
  fitIntro:
    "If your customers build software, GitDiagram is a relevant place to introduce your product.",
  fitPrivacy:
    "Advertising is clearly labeled, with no third-party ad scripts, tracking pixels, or popups.",
  fits: {
    f1: "AI coding tools and repo agents",
    f2: "Code review, security, and dependency tools",
    f3: "Observability, logging, and API monitoring",
    f4: "Cloud hosting, databases, CI, and developer infrastructure",
  },
  offerTitle: "Advertise for 30 days",
  offerTimingSuffix: "Choose a shared website spot or an exclusive campaign.",
  sharedSpot: "Shared website spot",
  sharedSpotDescription:
    "Homepage, repo diagrams, and browse catalog. A 50/50 rotation with one other sponsor, with one ad shown at a time. Website only.",
  exclusiveSpot: "Exclusive campaign",
  exclusiveSpotDescription:
    "Your brand is the only advertiser across the homepage, repo diagrams, browse catalog, and GitHub README.",
  usdPer30: "USD / 30 days",
  emailBeforePaymentNote:
    "Email Ahmed to agree on dates and creative before payment.",
  terms1: "One-time payment before launch.",
  terms2: "No automatic renewal.",
  terms3: "Future bookings are priced separately.",
  emailAhmed: "Email Ahmed",
  copyEmail: "Copy email",
  copiedEmail: "Copied email",
  uniqueVisitors: "Unique visitors",
  detailUniqueAll: "Unique, across GitDiagram",
  pageviews: "Pageviews",
  detailAcross: "Across GitDiagram",
  repoVisitors: "Repo page visitors",
  detailRepoVisitors: "Unique visitors to repository pages",
  detailSince: "Since {date}",
  githubStars: "GitHub stars",
  detailStars: "Open-source developer reach",
  metricPageviews: "pageviews",
  metricGithubStars: "GitHub stars",
  updatedAt: "{date} ET",
  booking: {
    availableNow: "Available now.",
    offerNow: "New campaigns can start right away.",
    availabilitySharedNow: "Shared spot available now. Exclusive from {exclusive}.",
    availabilitySharedFrom: "Shared spot from {from}. Exclusive from {exclusive}.",
    availabilityNext: "Next available: {exclusive}.",
    offerSharedNow:
      "A shared spot can start right away. Exclusive campaigns start from {exclusive}, after {name}’s run.",
    offerSharedFrom:
      "A shared spot can start from {from}. Exclusive campaigns start from {exclusive}, after {name}’s run.",
    offerNext: "New campaigns start from {exclusive}, after {name}’s run.",
    bookedBy: "{day} campaign booked by",
  },
  surfaces: {
    repoDiagram: {
      name: "Repo diagram pages",
      description:
        "An ad placement beneath generated architecture diagrams, with your logo, product description, and a link to your site.",
      alt: "The FastAPI architecture diagram with the full-width ad space directly beneath it.",
      caption: "A full-width placement beneath the generated diagram.",
    },
    homepage: {
      name: "Homepage",
      description:
        "Your product appears below the repository lookup controls, where developers start turning codebases into diagrams.",
      alt: "GitDiagram’s homepage with the ad space below the repository input and example repositories.",
      caption: "Inside the repository lookup panel, below the examples.",
    },
    browse: {
      name: "Browse catalog",
      description:
        "A dedicated ad row among the public repository listings, with your logo, description, and link.",
      alt: "GitDiagram’s browse catalog with a dedicated ad row between the first two repository listings.",
      caption: "A dedicated row immediately after the first repository.",
    },
    readme: {
      name: "GitHub README",
      description:
        "Included in the exclusive package: an ad near the top of GitDiagram’s GitHub README, linking directly to your product.",
      alt: "GitDiagram’s README on GitHub with the ad between the introduction and Features section.",
      caption: "Below the introduction, before the Features section.",
    },
  },
};

const vi = {
  heroTitle1: "Đem các lập trình viên",
  heroTitle2: "đến sản phẩm của bạn.",
  introVisitors:
    "GitDiagram có <strong>{count} khách truy cập duy nhất</strong> trong 30 ngày qua.",
  introRest:
    "Tiếp cận lập trình viên đúng lúc họ khám phá các repository GitHub, với các vị trí quảng cáo liên kết thẳng đến website của bạn.",
  offerFrom: "Từ <strong>{price} USD</strong> · 30 ngày",
  offerVariants: "Chỗ chung hoặc độc quyền",
  seePlacements: "Xem các vị trí",
  hasRunCampaignsFor: "GitDiagram đã chạy chiến dịch cho:",
  audienceTitle: "Đối tượng",
  last30: "30 ngày qua",
  lifetime: "Toàn thời gian",
  statsError:
    "Vừa rồi không tải được số liệu đối tượng từ PostHog. Hệ thống sẽ thử lại mỗi vài phút; hãy email Ahmed để có số liệu hiện tại.",
  source: "Nguồn: PostHog và GitHub.",
  updated: "Cập nhật {time}.",
  dataNote:
    "Số liệu làm mới khoảng mỗi giờ, tổng toàn thời gian mỗi ngày. Cửa sổ 30 ngày kết thúc tại thời điểm hiển thị. Khách truy cập là duy nhất trong từng cửa sổ. Pageview đo lưu lượng trang, không phải lượt hiển thị quảng cáo.",
  placementsTitle: "Các vị trí",
  placementsNote: "Pageview lấy từ cùng cửa sổ 30 ngày.",
  viewPlacement: "Xem vị trí",
  viewPlacementAria: "Xem vị trí: {name}",
  openFullSize: "Mở cỡ đầy đủ",
  closeHint: "Bấm ngoài ảnh hoặc bấm Escape để đóng.",
  loadingPreview: "Đang tải bản xem trước…",
  closePreview: "Đóng bản xem trước",
  fitTitle: "Phù hợp với ai",
  fitIntro:
    "Nếu khách hàng của bạn xây dựng phần mềm, GitDiagram là nơi phù hợp để giới thiệu sản phẩm của bạn.",
  fitPrivacy:
    "Quảng cáo được ghi nhãn rõ ràng, không có mã quảng cáo của bên thứ ba, pixel theo dõi hay popup.",
  fits: {
    f1: "Công cụ AI lập trình và agent cho repo",
    f2: "Công cụ review mã, bảo mật và quản lý phụ thuộc",
    f3: "Quan sát, ghi log và giám sát API",
    f4: "Cloud hosting, cơ sở dữ liệu, CI và hạ tầng dành cho lập trình viên",
  },
  offerTitle: "Quảng cáo trong 30 ngày",
  offerTimingSuffix: "Chọn một chỗ chung trên website hoặc một chiến dịch độc quyền.",
  sharedSpot: "Chỗ chung trên website",
  sharedSpotDescription:
    "Trang chủ, sơ đồ repo và danh mục Browse. Xoay vòng 50/50 với một nhà tài trợ khác, mỗi lần hiển thị một quảng cáo. Chỉ trên website.",
  exclusiveSpot: "Chiến dịch độc quyền",
  exclusiveSpotDescription:
    "Thương hiệu của bạn là nhà quảng cáo duy nhất trên trang chủ, sơ đồ repo, danh mục Browse và README GitHub.",
  usdPer30: "USD / 30 ngày",
  emailBeforePaymentNote:
    "Email Ahmed để thống nhất ngày và nội dung quảng cáo trước khi thanh toán.",
  terms1: "Thanh toán một lần trước khi chạy.",
  terms2: "Không tự động gia hạn.",
  terms3: "Các booking sau sẽ được báo giá riêng.",
  emailAhmed: "Email Ahmed",
  copyEmail: "Sao chép email",
  copiedEmail: "Đã sao chép email",
  uniqueVisitors: "Khách truy cập duy nhất",
  detailUniqueAll: "Duy nhất, trên toàn GitDiagram",
  pageviews: "Pageview",
  detailAcross: "Trên toàn GitDiagram",
  repoVisitors: "Khách truy cập trang repo",
  detailRepoVisitors: "Khách truy cập duy nhất tới các trang repository",
  detailSince: "Kể từ {date}",
  githubStars: "Sao GitHub",
  detailStars: "Độ phủ lập trình viên mã nguồn mở",
  metricPageviews: "pageview",
  metricGithubStars: "sao GitHub",
  updatedAt: "{date} ET",
  booking: {
    availableNow: "Đang còn chỗ.",
    offerNow: "Chiến dịch mới có thể bắt đầu ngay.",
    availabilitySharedNow: "Chỗ chung trống ngay. Độc quyền từ {exclusive}.",
    availabilitySharedFrom: "Chỗ chung từ {from}. Độc quyền từ {exclusive}.",
    availabilityNext: "Chỗ trống gần nhất: {exclusive}.",
    offerSharedNow:
      "Chỗ chung có thể bắt đầu ngay. Chiến dịch độc quyền bắt đầu từ {exclusive}, sau lượt của {name}.",
    offerSharedFrom:
      "Chỗ chung có thể bắt đầu từ {from}. Chiến dịch độc quyền bắt đầu từ {exclusive}, sau lượt của {name}.",
    offerNext: "Chiến dịch mới bắt đầu từ {exclusive}, sau lượt của {name}.",
    bookedBy: "Chiến dịch {day} được booking bởi",
  },
  surfaces: {
    repoDiagram: {
      name: "Các trang sơ đồ repo",
      description:
        "Vị trí quảng cáo bên dưới sơ đồ kiến trúc được tạo, với logo, mô tả sản phẩm và liên kết đến website của bạn.",
      alt: "Sơ đồ kiến trúc FastAPI với dải quảng cáo toàn chiều rộng ngay bên dưới.",
      caption: "Một vị trí toàn chiều rộng bên dưới sơ đồ được tạo.",
    },
    homepage: {
      name: "Trang chủ",
      description:
        "Sản phẩm của bạn xuất hiện bên dưới phần tra cứu repository, nơi lập trình viên bắt đầu biến codebase thành sơ đồ.",
      alt: "Trang chủ GitDiagram với dải quảng cáo bên dưới ô nhập repository và các ví dụ.",
      caption: "Trong bảng tra cứu repository, bên dưới các ví dụ.",
    },
    browse: {
      name: "Danh mục Browse",
      description:
        "Một hàng quảng cáo riêng giữa các listing repository công khai, với logo, mô tả và liên kết của bạn.",
      alt: "Danh mục Browse của GitDiagram với hàng quảng cáo riêng giữa hai listing repository đầu tiên.",
      caption: "Một hàng riêng ngay sau repository đầu tiên.",
    },
    readme: {
      name: "README GitHub",
      description:
        "Gói trong gói độc quyền: một quảng cáo gần đầu README GitHub của GitDiagram, liên kết thẳng đến sản phẩm của bạn.",
      alt: "README của GitDiagram trên GitHub với quảng cáo giữa phần giới thiệu và phần Tính năng.",
      caption: "Bên dưới phần giới thiệu, trước phần Tính năng.",
    },
  },
};

for (const [file, advertise] of [
  ["messages/en.json", en],
  ["messages/vi.json", vi],
]) {
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  j.advertise = advertise;
  fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
  console.log(file, "advertise keys:", Object.keys(advertise).length);
}
