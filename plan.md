Awesome—supporting **both lots and single stones** is a great call. Here’s a tight MERN plan that keeps **no prices**, **WhatsApp-only CTA**, and delivers clean UX for **business buyers (lots)** and **individual buyers (single stones)**—within the 3-week runway.

# What changes (high level)

* **One unified inventory model** so you can list/filter **Lots** and **Single Stones** together or separately.
* **Two detail page types** (Lot vs Single Stone), each with tailored attributes.
* **Admin** gets CSV import that can load both types in one go.

---

# Data model (Mongo) — simple & fast

## 1) Master specs (reusable across inventory)

**Stone** *(master attributes you’d reuse across many inventory items)*

```ts
Stone {
  _id, title, slug, sku?, categoryId,
  species, shape, color, clarity, cut,
  treatment?, origin?,
  caratTypicalPerPiece?, dimensions?, description?,
  tags?: string[],
  images: [{ url, alt, position, thumbUrl?, watermarked: boolean }],
  publishedAt?, createdAt, updatedAt
}
```

## 2) Sellable inventory (single source of truth)

**InventoryItem** *(unifies “Lot” and “Single Stone”)*

```ts
InventoryItem {
  _id,
  type: 'LOT' | 'SINGLE',
  code: string,                 // unique: lotCode or singleStoneCode
  stoneId: ObjectId,            // points to master Stone
  categoryId?: ObjectId,        // optional direct category for facet/SEO

  // Denormalized fields for fast filters (copied from Stone on write/update)
  species, shape, color, clarity, cut, treatment?, origin?, tags?: string[],

  // Quantities
  pieceCount?: number,          // required for LOT
  caratTotal?: number,          // required for LOT
  caratSingle?: number,         // required for SINGLE

  // Common
  location?: string,
  availability: 'available' | 'reserved' | 'sold',
  featured?: boolean,
  images?: [{ url, alt, position, thumbUrl?, watermarked: boolean }],
  certificates?: [{ lab, number, issueDate, pdfUrl }],
  publishedAt?, createdAt, updatedAt
}
```

**Indexes**

* `inventoryItems`:

  * `{ type:1, availability:1, species:1, shape:1 }`
  * `{ caratSingle:1 }`, `{ caratTotal:1 }`, `{ pieceCount:1 }`
  * `{ code:1 }` (unique), `{ createdAt:-1 }`
* `stones`: text index on `title, sku, species, shape, tags`

> Why unify? One collection makes search, pagination, and filtering a breeze. You can still present “Lots” and “Single Stones” separately in the UI.

---

# Public site (UX)

## Navigation & listing

* **Top filter:** *Inventory Type* — **All | Single Stones | Lots**
* Facets: species, shape, color, clarity, cut, treatment, origin, availability.
* Numeric filters auto-switch:

  * If `type=LOT`: show **Carat Total** and **Piece Count** ranges.
  * If `type=SINGLE`: show **Carat** range.
* Sort: Newest, Carat (asc/desc).

## Detail pages (clean URLs)

* **Lots:** `/lots/{code}` (e.g., `/lots/L-2048`)
* **Single Stones:** `/single-stones/{code}`
* **Stone master page (optional but helpful):** `/stones/{slug}` → shows description + **active inventory** (both single & lot items of that stone).

## CTA: WhatsApp only (with tracking)

* All detail pages show **“I’m interested”**.
* Click → your API logs the click → **302** to WhatsApp:

  * `https://wa.me/<E164Phone>?text=${encodeURIComponent(message)}`
* Prefill messages:

  * **Lot:** `Hi, I'm interested in Lot ${code} (${stone.title}). ${publicUrl}`
  * **Single:** `Hi, I'm interested in Stone ${code} (${stone.title}). ${publicUrl}`

---

# Admin (owner-only, simple)

* **Users:** start with **ADMIN** only (you can add `EDITOR` later if staff need restricted CRUD). No **Customer** role needed.

* **Stones:** create/edit master specs, upload base images, tags.

* **Inventory Items:** create/edit with `type` = LOT or SINGLE.

  * LOT requires: `code`, `pieceCount`, `caratTotal`.
  * SINGLE requires: `code`, `caratSingle`.
  * Toggle availability and publish/unpublish.
  * Attach images (can be per-item) and certificates (per-item).

* **CSV import/export** (single template for both types):

  ```
  type, code, stoneTitle, species, shape, color, clarity, cut,
  pieceCount, caratTotal, caratSingle, treatment, origin,
  location, availability, tags(|-sep),
  imageUrls(|-sep), certificateLab, certificateNumber, certificateDate, certificatePdfUrl
  ```

  Importer upserts the **Stone** (by title + key specs or sku), denormalizes fields into InventoryItem, and creates/updates items by `code`.

* **Interest analytics:** table with Item Code | Type | Interested (7d/30d/all) | Availability.

---

# API (Express) — concise

```
Auth:        POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me

Stones:      GET /api/stones/:slug
             POST/PUT/DELETE /api/stones  (ADMIN)

Inventory:   GET /api/items
               ?type=LOT|SINGLE
               &species=...&shape=...&availability=...
               &caratMin=..&caratMax=..        // if SINGLE
               &caratTotalMin=..&caratTotalMax=..&pieceMin=..&pieceMax=.. // if LOT
             GET /api/items/:code
             POST/PUT/DELETE /api/items       (ADMIN)

Upload:      POST /api/upload (images/PDFs) → Sharp → R2/S3 → save URLs

Interest:    GET /api/track/interest?code=XYZ
               // record event + 302 redirect to wa.me (server builds message)
```

**Filtering approach**

* Direct single-collection queries thanks to denormed fields.
* Guard numeric ranges by `type` (server enforces valid combo).

---

# Media & watermarking

* On upload, generate `thumb (400w)` and `web (1200w)` with **Sharp**; apply a light diagonal watermark.
* Optional: overlay **the item code** into the watermark for traceability.
* Store in **Cloudflare R2** or S3; keep URLs on item docs.

---

# SEO (no prices—totally fine)

* **Product JSON-LD** on *inventory detail pages*:

  * `name`: `${stone.title} — ${type === 'LOT' ? 'Lot ' + code : 'Stone ' + code}`
  * `sku`: `code`
  * `category`: `"Gemstones"`
  * `itemCondition`: `"https://schema.org/NewCondition"`
  * `brand`: your company
  * `image`: array of item images
  * `offers`: **omit** (no prices)
  * `availability`: from item
* Sitemap includes: `/lots/*`, `/single-stones/*`, `/stones/*`, categories.

---

# Security & reliability (lean)

* Owner login with strong password → JWT in **HTTP-only** cookie.
* Optionally add email OTP (2FA) if time permits.
* Validate all inputs (zod/yup).
* Rate-limit admin write routes.
* Atlas snapshots daily; R2 lifecycle rules.

---

# Timeline (still 3 weeks)

**Week 1 — Backend & Admin**

* Day 1–2: Express, Mongo Atlas, auth, error handling.
* Day 3: Mongoose models (`Stone`, `InventoryItem`), indexes, seed data.
* Day 4: CRUD for Stones & Items; Upload (Sharp→R2) with watermark.
* Day 5: Admin UI: login, list/table filters by `type`, create/edit item, image manager.

**Week 2 — Public + WhatsApp**

* Day 6–7: Listing with *Inventory Type* toggle; facets; pagination.
* Day 8: Detail pages (Lot + Single), gallery, certificates, **I’m interested** → tracking → WhatsApp.
* Day 9: Stone master page (shows active inventory); categories.
* Day 10: SEO (JSON-LD, sitemap, robots), OG tags.

**Week 3 — Polish & Launch**

* Day 11: CSV import/export for both types; error report.
* Day 12: A11y, loading skeletons, empty/error states, 404/500.
* Day 13: Deploy API (Render/Railway), Frontend (Vercel/Netlify), domain & SSL.
* Day 14: UAT + content import; fixes.
* Day 15: Launch; monitor interest clicks & error logs.

---

# Tiny implementation bits

**WhatsApp tracking redirect (server)**

```js
// GET /api/track/interest?code=...
app.get('/api/track/interest', async (req, res) => {
  const { code } = req.query;
  const item = await InventoryItem.findOne({ code, publishedAt: { $ne: null } });
  if (!item) return res.status(404).end();

  await InterestEvent.create({ itemId: item._id, ts: new Date(), referer: req.get('referer'), userAgent: req.get('user-agent') });

  const phone = process.env.WHATSAPP_PHONE_E164; // e.g., 14165551234 (no +)
  const stone = await Stone.findById(item.stoneId).select('title');
  const pageUrl = `${process.env.PUBLIC_BASE_URL}/${item.type === 'LOT' ? 'lots' : 'single-stones'}/${encodeURIComponent(item.code)}`;
  const text = `Hi, I'm interested in ${item.type === 'LOT' ? 'Lot' : 'Stone'} ${item.code} (${stone?.title}). ${pageUrl}`;
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  return res.redirect(302, wa);
});
```

**Frontend CTA (detail page)**

```js
<button onClick={() => { window.location.href = `/api/track/interest?code=${item.code}`; }}>
  I’m interested
</button>
```

---

## Roles recap

* **Keep it simple:** just **`ADMIN`** for now (owner).
* Add **`EDITOR`** later **only if** staff will manage inventory (limited permissions).
* No **Customer** role (public site is open; WhatsApp handles contact).

---

If you want, I can:

* generate **Mongoose schemas** for `Stone` and `InventoryItem` (with validation for LOT vs SINGLE),
* provide the **filtering logic** for `GET /api/items`,
* and a **CSV import parser** (streaming) with a sample mapping.
