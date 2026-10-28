# Thiết kế: Song ngữ Việt/Anh cho lớp UI GitDiagram (bản nội bộ)

- Ngày: 2026-10-28
- Repo: `F:\gitdiagram` (fork `domanhcuongkent1991-blip/gitdiagram`, HEAD `7d3bc54`,
  đã kiểm định bảo mật — gitleaks 16/16 FP, mimosa 60 findings đều FP/advisory tĩnh)
- Trạng thái: chờ chủ nhân duyệt

## Mục đích và lý do

Bản fork dùng **nội bộ** (local dev / worker riêng, không public). Chủ nhân muốn
giao diện dùng được **cả tiếng Việt lẫn tiếng Anh**, mặc định tiếng Việt. Đã chốt
với chủ nhân qua 4 vòng hỏi đáp:

1. Môi trường: nội bộ → bỏ SEO đa ngôn ngữ, bỏ URL locale, bỏ middleware.
2. Phạm vi dịch: **chỉ lớp UI** (nút, nhãn, placeholder, thông báo) — không dịch
   trang văn bản dài, không dịch chữ AI trong sơ đồ.
3. Mặc định: **tiếng Việt**, nút chuyển sang EN ở header, cookie nhớ lựa chọn.
4. Kiến trúc: **next-intl**, setup "without i18n routing" (locale từ cookie).
5. Bản làm việc: `F:\gitdiagram` (đã move fork từ vùng kiểm định về đây).

## Goals

- Giao diện chrome hiển thị VN hoặc EN theo cookie `NEXT_LOCALE`.
- LocaleSwitcher ở Header (cạnh theme-toggle); đổi ngôn ngữ không đổi URL.
- Mặc định `vi` khi không có cookie hoặc cookie sai giá trị.
- **Toàn bộ test hiện tại vẫn pass không phải sửa assert text** — môi trường test
  chạy với locale `en` (chuỗi EN gốc giữ nguyên văn trong `messages/en.json`).

## Non-goals

- Không dịch: `/visualize-codebase` (guide ~190 dòng), `/privacy`, `/terms`,
  `/support` — giữ tiếng Anh (chấp nhận trộn ngôn ngữ ở các trang đó).
- Không dịch chữ do AI sinh trong sơ đồ/giải thích (prompt giữ nguyên).
- Metadata/SEO giữ EN; sitemap, robots, JSON-LD giữ nguyên.
- Không URL locale (`/vi/...`), không dò Accept-Language, không hreflang.
- **Không phủ MCP app** (`src/mcp-app/*` — bundle esbuild riêng chạy trong frame
  ChatGPT, next-intl không áp dụng được; chốt với chủ nhân 2026-10-28).

## Anti-goals (thất bại dù technically chạy)

- Làm gãy streaming/RSC của route động `/[username]/[repo]` hay trang chủ.
- Thêm middleware toàn cục đụng mọi request.
- Sửa bất kỳ dòng nào trong `src/server/generate/prompts.ts`.
- Phá build Cloudflare Workers (`bun run build` phải vẫn pass).

## Kiến trúc (đã chốt)

- **next-intl** setup "without i18n routing"
  (https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing):
  - Nguồn sự thật của locale: cookie `NEXT_LOCALE` (`vi` | `en`).
  - `src/i18n/request.ts`: `getRequestConfig` đọc cookie qua `cookies()`
    (next/headers), fallback `vi`.
  - `next.config.js`: bọc `createNextIntlPlugin()` (plugin mặc định tìm
    `./src/i18n/request.ts`).
  - `src/app/providers.tsx` (đã có): bọc `NextIntlClientProvider` — giá trị locale
    + messages được truyền xuống client từ server, tránh mismatch.
  - `messages/en.json`, `messages/vi.json` ở root repo.
- **LocaleSwitcher**: component nhỏ đặt cạnh `theme-toggle` trong Header. Set
  cookie (`path=/; max-age=31536000; samesite=strict`) + `router.refresh()`.
  UI đơn giản kiểu "VI/EN" khớp phong cách neo-brutalist hiện có (chi tiết tự
  quyết).
- **ISR bị bỏ chấp nhận render theo yêu cầu (chốt với chủ nhân 2026-10-28):**
  đọc cookie trong `getRequestConfig` biến mọi route ISR thành dynamic. Bỏ
  `export const revalidate` tại: `src/app/page.tsx` (300),
  `src/app/[username]/[repo]/page.tsx` (21600), `src/app/reels/page.tsx` (300),
  `src/app/videos/page.tsx` (300). Chi phí render-per-request được chấp nhận vì
  bản nội bộ 1 người dùng; nội dung sơ đồ đã có cache riêng ở lớp khác.
- **`<html lang>` đổi theo locale** (chốt với chủ nhân): `layout.tsx` thành async
  server component đọc cookie, `lang="vi"|"en"`.
- Không `[locale]` segment, không middleware, không đổi cấu trúc route.

## Phạm vi file quốc tế hoá (đã khảo sát 2026-10-28)

Khu vực → namespace gợi ý (`common`, `home`, `header`, `footer`, `browse`,
`generation`, `dialogs`, `admin`, `errors`):

- Nền: `src/app/providers.tsx` (bọc provider), `layout.tsx` (metadata giữ EN,
  `<html lang>` đổi theo locale).
- Home: `components/hero.tsx`, `main-card.tsx` (form + error + chip label),
  `footer.tsx`, `header.tsx` + `header-client.tsx`, `new-badge.tsx`,
  `loading.tsx`, `sponsor-slot.tsx` (label nhỏ).
- **Trang còn lại có UI text (bổ sung theo builder-check, chốt dịch hết trừ
  MCP app):** `app/page.tsx` (banner promo + tagline),
  `app/[username]/[repo]/placeholder-repo.tsx`, `app/videos/*`,
  `app/reels/*`, `app/[username]/[repo]/video/*`, `app/advertise/*`.
- Dialogs: `api-key-dialog.tsx`, `credential-dialog.tsx`,
  `private-repos-dialog.tsx`.
- Browse: `browse-catalog.tsx`, `browse-catalog-controls.tsx`,
  `browse-catalog-results.tsx`, `browse-catalog-loading-state.tsx`,
  `browse-catalog-pagination.tsx`, `browse-tabs.tsx`,
  `browse-diagram-preview.tsx`.
- Generation (`/[username]`): `components/generation/*` (repository-workspace,
  generation-feedback, diagram-connections, architecture-notes...),
  `mermaid-diagram-toolbar.tsx`, `live-presence.tsx`, `explainer/reels/reels-feed.tsx`.
- Admin (nhỏ, dịch luôn): `app/admin/controls-panel.tsx`,
  `app/admin/visibility-panel.tsx`, `components/generation-audit-panel.tsx`.
- Chuỗi nằm trong server `.ts` (messages trạng thái/lỗi stream về client):
  dịch bằng `getTranslations()` tại server, hoặc trả `error_code` + client map
  theo key — builder chọn cách next-intl khuyến nghị cho từng khu; ưu tiên dịch
  những chuỗi hiện lên UI cho người dùng, message log nội bộ giữ EN.
- `aria-label`, `sr-only`, `placeholder`, `title` cũng dịch (accessibility).

## Thứ tự triển khai

- **Phase A — khung:** `bun add next-intl`; tạo `src/i18n/request.ts`; plugin
  trong `next.config.js`; bọc provider; LocaleSwitcher; 2 file messages với
  vài key đầu (hero, main-card). Chạy `bun run dev` kiểm toggle thật (cookie
  giữ sau reload, URL không đổi).
- **Phase B — dịch từng khu** (mỗi khu 1 đơn vị hoàn chỉnh, key en.json giữ
  NGUYÊN VĂN chuỗi gốc, vi.json đặt bản dịch): home → dialogs → browse →
  generation → admin → phần lẻ.
- **Phase C — quét sót + kiểm:** grep chuỗi UI cứng còn lại trong phạm vi;
  `bun run check` (lint + typecheck); `bun run test`; UI check tay cả 2 locale
  trên: trang chủ, `/fastapi/fastapi`, `/browse`, 1 dialog, dark mode.

## Quy ước dịch (nhất quán toàn app)

- Thuật ngữ giữ Anh: commit, branch, pull request, repo, API key, streaming.
- "diagram" → "sơ đồ" (nhất quán; logo "GitDiagram" giữ nguyên).
- Bản dịch phải ngắn gọn; chỗ nào VN dài hơn làm vỡ layout thì rút nghĩa, không
  phóng to khung (UI neo-brutalist nhạy với chiều dài chữ, nhất là hero).
- Số liệu định dạng giữ mặc định (không cần format số riêng cho vi).

## Kiểm tra

- `vitest.setup.ts`: với môi trường test, locale mặc định là `en` (override
  `getRequestConfig` khi `NODE_ENV === 'test'` hoặc mock cookie) — test hiện tại
  assert text EN gốc nên không phải sửa assert.
- Thêm test nhỏ: LocaleSwitcher (set cookie + refresh), `i18n/request.ts`
  (đọc cookie, fallback `vi`, giá trị sai → `vi`).

## Rủi ro đã phân tích

- **Hydration/state reset:** đổi locale qua `router.refresh()` re-render server;
  state client (form, dialog mở) sẽ reset — chấp nhận vì đổi ngôn ngữ là thao tác
  hiếm. Đã chốt với chủ nhân hướng cookie-based.
- **`providers.tsx` là `"use client"`:** `NextIntlClientProvider` đặt trong đó
  cần `locale`/`messages` truyền từ layout (server) qua props, không tự inherit.
- **Test jsdom:** nhiều test render trực tiếp component client (`main-card.test.tsx`,
  `repo-page-client.test.tsx`, `browse-catalog.test.tsx`...) — mock next-intl
  phía client (bọc provider test hoặc `vi.mock("next-intl")` trả messages EN)
  để giữ nguyên assert text; cách mock do builder chọn.
- **next-intl × Next 16/Turbopack/Bun:** builder kiểm phiên bản tương thích khi
  cài; nếu plugin vướng Turbopack dev thì dùng cấu hình thủ công theo docs
  next-intl — KHÔNG đổi công cụ dev (giữ Turbopack, Bun).
- **Chuỗi trong server `.ts`:** không có React context — `getTranslations()`
  hoạt động trong Route Handlers/server component; những message chỉ dùng cho
  log nội bộ giữ EN.
- **Build Workers:** next-intl không thêm edge API riêng; `bun run build` phải
  pass (không bắt buộc chạy `cf:deploy`).

## Hoàn thành khi nào

- `bun run check` pass; `bun run test` pass.
- Grep không còn chuỗi UI cứng trong phạm vi chốt (ngoại trừ non-goals).
- Thử tay cả 2 locale: trang chủ, `/fastapi/fastapi`, `/browse`, dialog,
  dark mode; cookie giữ sau reload; URL không đổi.

## Để builder tự quyết

- Phiên bản next-intl chính xác; tên key cụ thể trong từng namespace; chi tiết
  UI switcher; cách xử lý từng server message (getTranslations vs error_code);
  có dịch `new-badge`/`loading` nếu chỉ là logo/đồ hoạ hay giữ nguyên.

<!-- MARKER-END-DOC -->
