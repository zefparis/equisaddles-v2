import { db } from "../server/db";
import { products, galleryImages } from "../shared/schema";

console.log("🌱 Starting database seed...");

async function seed() {
  try {
    // Vérifier si des produits existent déjà
    const existingProducts = await db.select().from(products).limit(1);
    
    if (existingProducts.length > 0) {
      console.log("⚠️  Database already contains products. Skipping seed.");
      console.log("💡 To re-seed, truncate the tables first or delete the data manually.");
      return;
    }

    console.log("📦 Seeding products...");
    
    // Seed products
    await db.insert(products).values([
      {
        name: "Selle Dressage Pro",
        category: "Dressage",
        size: "17.5",
        price: "1290.00",
        description: "Selle de dressage haute qualité en cuir italien, siège profond pour un contact optimal.",
        image: "/images/selle1.jpg",
        images: ["/images/selle1.jpg", "/images/selle2.jpg"],
        featured: true,
        inStock: true,
        color: "Marron",
        condition: "neuve",
      },
      {
        name: "Selle Obstacle X-Jump",
        category: "Obstacle",
        size: "17",
        price: "1251.00",
        originalPrice: "1390.00",
        description: "Selle d'obstacle moderne avec quartiers avancés pour une position parfaite à l'abord.",
        image: "/images/selle2.jpg",
        images: ["/images/selle2.jpg", "/images/selle1.jpg"],
        featured: true,
        inStock: true,
        color: "Noir",
        condition: "neuve",
      },
      {
        name: "Selle Mixte Confort",
        category: "Mixte",
        size: "16.5",
        price: "890.00",
        description: "Selle polyvalente idéale pour la randonnée et l'équitation de loisir, très confortable.",
        image: "/images/selle1.jpg",
        images: ["/images/selle1.jpg", "/images/selle2.jpg"],
        featured: true,
        inStock: true,
        color: "Marron havane",
        condition: "occasion",
      },
      {
        name: "Selle Cross Country",
        category: "Cross",
        size: "17",
        price: "1150.00",
        description: "Selle robuste spécialement conçue pour le cross-country et les longues randonnées.",
        image: "/images/selle2.jpg",
        images: ["/images/selle2.jpg", "/images/selle1.jpg"],
        featured: false,
        inStock: true,
        color: "Marron foncé",
        condition: "neuve",
      },
      {
        name: "Selle Poney Junior",
        category: "Poney",
        size: "16",
        price: "650.00",
        description: "Selle adaptée aux poneys et jeunes cavaliers, sécurisée et confortable.",
        image: "/images/selle1.jpg",
        images: ["/images/selle1.jpg", "/images/selle2.jpg"],
        featured: false,
        inStock: true,
        color: "Marron",
        condition: "neuve",
      },
      // Accessoires
      {
        name: "Sangle en cuir premium",
        category: "Accessoires",
        subcategory: "Sangles",
        size: "All",
        price: "89.00",
        description: "Sangle en cuir véritable avec rembourrage pour le confort du cheval.",
        image: "/images/sangle1.jpg",
        images: ["/images/sangle1.jpg"],
        featured: false,
        inStock: true,
        color: "Marron",
        condition: "neuve",
      },
      {
        name: "Étrivières ajustables",
        category: "Accessoires",
        subcategory: "Etrivieres",
        size: "All",
        price: "45.00",
        description: "Étrivières en cuir souple avec système d'attache sécurisé.",
        image: "/images/etrivieres1.jpg",
        images: ["/images/etrivieres1.jpg"],
        featured: false,
        inStock: true,
        color: "Marron",
        condition: "neuve",
      },
      {
        name: "Étriers en acier inoxydable",
        category: "Accessoires",
        subcategory: "Etriers",
        size: "All",
        price: "65.00",
        description: "Étriers robustes en acier inoxydable avec semelle antidérapante.",
        image: "/images/etriers1.jpg",
        images: ["/images/etriers1.jpg"],
        featured: false,
        inStock: true,
        condition: "neuve",
      },
    ]);

    console.log("✅ Products seeded successfully");

    console.log("🖼️  Seeding gallery images...");
    
    // Seed gallery images
    await db.insert(galleryImages).values([
      {
        url: "/images/selle1.jpg",
        alt: "Selle de dressage professionnelle Equi Saddles",
        category: "Dressage",
      },
      {
        url: "/images/selle2.jpg",
        alt: "Selle d'obstacle en cuir Equi Saddles",
        category: "Obstacle",
      },
      {
        url: "/images/selle1.jpg",
        alt: "Selle mixte confortable Equi Saddles",
        category: "Mixte",
      },
      {
        url: "/images/selle2.jpg",
        alt: "Selle de cross-country Equi Saddles",
        category: "Cross",
      },
      {
        url: "/images/selle1.jpg",
        alt: "Selle pour poney Equi Saddles",
        category: "Poney",
      },
    ]);

    console.log("✅ Gallery images seeded successfully");
    console.log("🎉 Database seed completed!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✨ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
