import pg from "pg";

const { Pool } = pg;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isApply = args.includes("--apply");
const allowExisting = args.includes("--allow-existing");

if (!isDryRun && !isApply) {
  console.error("Usage: npm run migrate:catalog -- --dry-run | --apply [--allow-existing]");
  process.exit(1);
}

const sourceUrl = process.env.PRODUCTION_DATABASE_URL;
const destUrl = process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error("FATAL: PRODUCTION_DATABASE_URL is not set");
  process.exit(1);
}
if (!destUrl) {
  console.error("FATAL: DATABASE_URL is not set");
  process.exit(1);
}
if (sourceUrl === destUrl) {
  console.error("FATAL: PRODUCTION_DATABASE_URL and DATABASE_URL are identical. Refusing to proceed.");
  process.exit(1);
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return "[invalid url]";
  }
}

console.log("=== Catalog Migration ===");
console.log(`Mode: ${isDryRun ? "DRY-RUN (no writes)" : "APPLY"}`);
console.log(`Source (read-only): ${maskUrl(sourceUrl)}`);
console.log(`Destination:        ${maskUrl(destUrl)}`);
console.log("");

interface ProductRow {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  size: string;
  color: string | null;
  condition: string | null;
  price: string;
  original_price: string | null;
  description: string;
  image: string;
  images: string[] | null;
  featured: boolean | null;
  in_stock: boolean | null;
  location: string | null;
  seller_contact: string | null;
  custom_subcategory: string | null;
  published_at: Date | null;
  created_at: Date | null;
}

interface ProductImageRow {
  id: number;
  product_id: number;
  url: string;
  alt: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  is_main: boolean | null;
  created_at: Date | null;
}

interface GalleryImageRow {
  id: number;
  url: string;
  alt: string;
  category: string;
  created_at: Date | null;
}

async function main() {
  const sourcePool = new Pool({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const destPool = new Pool({
    connectionString: destUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    // --- Read from source (production, read-only) ---
    console.log("[1/4] Reading from source (production, read-only)...");

    const productsResult = await sourcePool.query<ProductRow>(
      "SELECT id, name, category, subcategory, size, color, condition, price, original_price, description, image, images, featured, in_stock, location, seller_contact, custom_subcategory, published_at, created_at FROM products ORDER BY id"
    );
    const productImagesResult = await sourcePool.query<ProductImageRow>(
      "SELECT id, product_id, url, alt, filename, original_name, mime_type, size, is_main, created_at FROM product_images ORDER BY id"
    );
    const galleryResult = await sourcePool.query<GalleryImageRow>(
      "SELECT id, url, alt, category, created_at FROM gallery_images ORDER BY id"
    );

    const products = productsResult.rows;
    const productImages = productImagesResult.rows;
    const galleryImages = galleryResult.rows;

    console.log(`  Source products:       ${products.length}`);
    console.log(`  Source product_images: ${productImages.length}`);
    console.log(`  Source gallery_images: ${galleryImages.length}`);

    // --- Read from destination (V2) ---
    console.log("");
    console.log("[2/4] Reading from destination (V2)...");

    const destProductsResult = await destPool.query("SELECT count(*)::int as cnt FROM products");
    const destProductImagesResult = await destPool.query("SELECT count(*)::int as cnt FROM product_images");
    const destGalleryResult = await destPool.query("SELECT count(*)::int as cnt FROM gallery_images");

    const destProductsCount = destProductsResult.rows[0].cnt;
    const destProductImagesCount = destProductImagesResult.rows[0].cnt;
    const destGalleryCount = destGalleryResult.rows[0].cnt;

    console.log(`  Destination products:       ${destProductsCount}`);
    console.log(`  Destination product_images: ${destProductImagesCount}`);
    console.log(`  Destination gallery_images: ${destGalleryCount}`);

    // --- URL analysis ---
    console.log("");
    console.log("[3/4] URL analysis...");

    const allProductUrls = products.map((p) => p.image).filter(Boolean);
    const allProductImageUrls = productImages.map((pi) => pi.url).filter(Boolean);
    const allGalleryUrls = galleryImages.map((g) => g.url).filter(Boolean);
    const allUrls = [...allProductUrls, ...allProductImageUrls, ...allGalleryUrls];

    const cloudinaryUrls = allUrls.filter((u) => u.startsWith("https://res.cloudinary.com/"));
    const localUploadUrls = allUrls.filter((u) => u.startsWith("/uploads/"));
    const localImageUrls = allUrls.filter((u) => u.startsWith("/images/"));
    const otherUrls = allUrls.filter(
      (u) => !u.startsWith("https://res.cloudinary.com/") && !u.startsWith("/uploads/") && !u.startsWith("/images/")
    );

    console.log(`  Cloudinary URLs: ${cloudinaryUrls.length}`);
    console.log(`  Local /uploads/ URLs: ${localUploadUrls.length}`);
    console.log(`  Local /images/ URLs: ${localImageUrls.length}`);
    console.log(`  Other URLs: ${otherUrls.length}`);

    // --- Conflict detection ---
    console.log("");
    console.log("[4/4] Conflict detection...");

    const destNotEmpty = destProductsCount > 0 || destProductImagesCount > 0 || destGalleryCount > 0;

    if (destNotEmpty) {
      console.log(`  WARNING: Destination DB is not empty`);
      console.log(`    products: ${destProductsCount}, product_images: ${destProductImagesCount}, gallery_images: ${destGalleryCount}`);

      if (isApply && !allowExisting) {
        console.error("  Refusing to apply: destination is not empty. Use --allow-existing to override.");
        process.exit(1);
      }
    } else {
      console.log("  Destination is empty — no conflicts detected.");
    }

    // Check for ID conflicts if destination has data
    let conflicts = 0;
    if (destNotEmpty) {
      const destProductIds = await destPool.query("SELECT id FROM products WHERE id = ANY($1)", [products.map((p) => p.id)]);
      const destProductImageIds = await destPool.query("SELECT id FROM product_images WHERE id = ANY($1)", [productImages.map((pi) => pi.id)]);
      const destGalleryIds = await destPool.query("SELECT id FROM gallery_images WHERE id = ANY($1)", [galleryImages.map((g) => g.id)]);
      conflicts = Number(destProductIds.rowCount) + Number(destProductImageIds.rowCount) + Number(destGalleryIds.rowCount);
      if (conflicts > 0) {
        console.log(`  ID conflicts: ${conflicts}`);
      } else {
        console.log("  No ID conflicts.");
      }
    }

    // --- Summary ---
    console.log("");
    console.log("=== Summary ===");
    console.log(`Products to insert:       ${products.length}`);
    console.log(`Product images to insert: ${productImages.length}`);
    console.log(`Gallery images to insert: ${galleryImages.length}`);
    console.log(`Total rows to insert:     ${products.length + productImages.length + galleryImages.length}`);
    console.log(`Conflicts:                ${conflicts}`);

    // --- Dry-run stops here ---
    if (isDryRun) {
      console.log("");
      console.log("DRY-RUN complete. No writes were performed.");
      return;
    }

    // --- Apply mode ---
    console.log("");
    console.log("=== APPLY MODE ===");
    console.log("Starting transaction on destination...");

    const destClient = await destPool.connect();

    try {
      await destClient.query("BEGIN");

      // Insert products
      console.log("  Inserting products...");
      for (const p of products) {
        await destClient.query(
          `INSERT INTO products (id, name, category, subcategory, size, color, condition, price, original_price, description, image, images, featured, in_stock, location, seller_contact, custom_subcategory, published_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             category = EXCLUDED.category,
             subcategory = EXCLUDED.subcategory,
             size = EXCLUDED.size,
             color = EXCLUDED.color,
             condition = EXCLUDED.condition,
             price = EXCLUDED.price,
             original_price = EXCLUDED.original_price,
             description = EXCLUDED.description,
             image = EXCLUDED.image,
             images = EXCLUDED.images,
             featured = EXCLUDED.featured,
             in_stock = EXCLUDED.in_stock,
             location = EXCLUDED.location,
             seller_contact = EXCLUDED.seller_contact,
             custom_subcategory = EXCLUDED.custom_subcategory,
             published_at = EXCLUDED.published_at,
             created_at = EXCLUDED.created_at`,
          [
            p.id, p.name, p.category, p.subcategory, p.size, p.color, p.condition,
            p.price, p.original_price, p.description, p.image, p.images,
            p.featured, p.in_stock, p.location, p.seller_contact, p.custom_subcategory,
            p.published_at, p.created_at,
          ]
        );
      }
      console.log(`  Products inserted: ${products.length}`);

      // Insert product_images
      console.log("  Inserting product_images...");
      for (const pi of productImages) {
        await destClient.query(
          `INSERT INTO product_images (id, product_id, url, alt, filename, original_name, mime_type, size, is_main, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE SET
             product_id = EXCLUDED.product_id,
             url = EXCLUDED.url,
             alt = EXCLUDED.alt,
             filename = EXCLUDED.filename,
             original_name = EXCLUDED.original_name,
             mime_type = EXCLUDED.mime_type,
             size = EXCLUDED.size,
             is_main = EXCLUDED.is_main,
             created_at = EXCLUDED.created_at`,
          [
            pi.id, pi.product_id, pi.url, pi.alt, pi.filename,
            pi.original_name, pi.mime_type, pi.size, pi.is_main, pi.created_at,
          ]
        );
      }
      console.log(`  Product images inserted: ${productImages.length}`);

      // Insert gallery_images
      console.log("  Inserting gallery_images...");
      for (const g of galleryImages) {
        await destClient.query(
          `INSERT INTO gallery_images (id, url, alt, category, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             url = EXCLUDED.url,
             alt = EXCLUDED.alt,
             category = EXCLUDED.category,
             created_at = EXCLUDED.created_at`,
          [g.id, g.url, g.alt, g.category, g.created_at]
        );
      }
      console.log(`  Gallery images inserted: ${galleryImages.length}`);

      // Realign sequences
      console.log("  Realigning sequences...");
      await destClient.query("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1), true) FROM products");
      await destClient.query("SELECT setval(pg_get_serial_sequence('product_images', 'id'), COALESCE(MAX(id), 1), true) FROM product_images");
      await destClient.query("SELECT setval(pg_get_serial_sequence('gallery_images', 'id'), COALESCE(MAX(id), 1), true) FROM gallery_images");
      console.log("  Sequences realigned.");

      await destClient.query("COMMIT");
      console.log("");
      console.log("=== Migration complete ===");
      console.log(`Products:       ${products.length} rows`);
      console.log(`Product images: ${productImages.length} rows`);
      console.log(`Gallery images: ${galleryImages.length} rows`);
      console.log("Transaction committed successfully.");
    } catch (err) {
      await destClient.query("ROLLBACK");
      console.error("");
      console.error("=== Migration FAILED ===");
      console.error("Transaction rolled back. No changes were written.");
      console.error("Error:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    } finally {
      destClient.release();
    }
  } finally {
    await sourcePool.end();
    await destPool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
