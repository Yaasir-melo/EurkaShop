// Shared built-in catalog and categories, also used by the admin tools.
window.EUREKA_BASE_CATEGORIES = [
    { id: 'electronics', name: 'Electronics', image: '' },
    { id: 'clothing', name: 'Clothing', image: '' },
    { id: 'home', name: 'Home', image: '' },
    { id: 'sports', name: 'Sports', image: '' },
    { id: 'books', name: 'Books', image: '' },
    { id: 'beauty', name: 'Beauty', image: '' },
    { id: 'toys', name: 'Toys', image: '' }
];
window.EUREKA_BASE_PRODUCTS = [
    // Electronics
    {
        id: 1,
        title: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
        price: 199.99,
        category: "electronics",
        image: "./product-images/1-wireless-headphones.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 128,
        reviewsList: [
            { user: "Alex M.", rating: 5, comment: "Amazing sound quality!" },
            { user: "Sarah K.", rating: 4, comment: "Great battery life, very comfortable." },
            { user: "Mike R.", rating: 5, comment: "Perfect for work calls." }
        ]
    },
    {
        id: 2,
        title: "Smart Watch",
        description: "Advanced smartwatch with fitness tracking, heart rate monitor, and GPS.",
        price: 299.99,
        category: "electronics",
        image: "./product-images/2-smart-watch.jpg",
        inStock: true,
        rating: 4.7,
        reviews: 95,
        reviewsList: [
            { user: "Emma L.", rating: 5, comment: "Love the fitness tracking features!" },
            { user: "David S.", rating: 4, comment: "Great design and functionality." }
        ]
    },
    {
        id: 9,
        title: "Laptop",
        description: "High-performance laptop with 16GB RAM, 512GB SSD, and 15.6-inch display.",
        price: 999.99,
        category: "electronics",
        image: "./product-images/9-laptop.jpg",
        inStock: true,
        rating: 4.8,
        reviews: 67,
        reviewsList: [
            { user: "John D.", rating: 5, comment: "Fast and reliable for work." },
            { user: "Lisa W.", rating: 5, comment: "Perfect for programming and design." }
        ]
    },
    {
        id: 13,
        title: "Smartphone",
        description: "Latest smartphone with advanced camera system and all-day battery life.",
        price: 799.99,
        category: "electronics",
        image: "./product-images/13-smartphone.jpg",
        inStock: true,
        rating: 4.6,
        reviews: 203,
        reviewsList: [
            { user: "Tom H.", rating: 5, comment: "Incredible camera quality!" },
            { user: "Anna P.", rating: 4, comment: "Great performance and battery life." }
        ]
    },
    {
        id: 14,
        title: "Gaming Console",
        description: "Next-gen gaming console with 4K gaming and exclusive titles.",
        price: 499.99,
        category: "electronics",
        image: "./product-images/14-gaming-console.jpg",
        inStock: true,
        rating: 4.9,
        reviews: 156,
        reviewsList: [
            { user: "Gamer123", rating: 5, comment: "Best gaming experience ever!" },
            { user: "Chris M.", rating: 5, comment: "Amazing graphics and performance." }
        ]
    },
    {
        id: 15,
        title: "Tablet",
        description: "10-inch tablet perfect for work, entertainment, and creativity.",
        price: 399.99,
        category: "electronics",
        image: "./product-images/15-tablet.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 89,
        reviewsList: [
            { user: "Maria G.", rating: 4, comment: "Great for reading and drawing." },
            { user: "Steve K.", rating: 5, comment: "Perfect size and performance." }
        ]
    },

    // Clothing
    {
        id: 3,
        title: "Cotton T-Shirt",
        description: "Comfortable 100% cotton t-shirt available in multiple colors.",
        price: 24.99,
        category: "clothing",
        image: "./product-images/3-cotton-t-shirt.jpg",
        inStock: true,
        rating: 4.3,
        reviews: 45,
        reviewsList: [
            { user: "Fashion Lover", rating: 4, comment: "Soft and comfortable material." },
            { user: "Style Queen", rating: 5, comment: "Perfect fit and great quality." }
        ]
    },
    {
        id: 4,
        title: "Denim Jeans",
        description: "Classic blue denim jeans with a comfortable fit and modern style.",
        price: 79.99,
        category: "clothing",
        image: "./product-images/4-denim-jeans.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 78,
        reviewsList: [
            { user: "Denim Fan", rating: 5, comment: "Great fit and quality denim." },
            { user: "Style Pro", rating: 4, comment: "Comfortable and stylish." }
        ]
    },
    {
        id: 10,
        title: "Winter Jacket",
        description: "Warm winter jacket with water-resistant material and multiple pockets.",
        price: 149.99,
        category: "clothing",
        image: "./Winter jacket.jpeg", // Updated path
        inStock: true,
        rating: 4.6,
        reviews: 92,
        reviewsList: [
            { user: "Winter Walker", rating: 5, comment: "Very warm and waterproof!" },
            { user: "Outdoor Fan", rating: 4, comment: "Great for cold weather." }
        ]
    },
    {
        id: 16,
        title: "Summer Dress",
        description: "Elegant summer dress perfect for any occasion.",
        price: 59.99,
        category: "clothing",
        image: "./product-images/16-summer-dress.jpg",
        inStock: true,
        rating: 4.7,
        reviews: 134,
        reviewsList: [
            { user: "Fashionista", rating: 5, comment: "Beautiful design and perfect fit!" },
            { user: "Summer Girl", rating: 4, comment: "Great for summer events." }
        ]
    },
    {
        id: 17,
        title: "Sneakers",
        description: "Comfortable sneakers with modern design and excellent support.",
        price: 89.99,
        category: "clothing",
        image: "./product-images/17-sneakers.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 167,
        reviewsList: [
            { user: "Sneaker Head", rating: 5, comment: "Super comfortable and stylish!" },
            { user: "Athlete", rating: 4, comment: "Great for daily wear and workouts." }
        ]
    },
    {
        id: 18,
        title: "Leather Jacket",
        description: "Classic leather jacket with timeless style and durability.",
        price: 199.99,
        category: "clothing",
        image: "product-images/Leatherjack.jpg",
        inStock: true,
        rating: 4.8,
        reviews: 56,
        reviewsList: [
            { user: "Style Icon", rating: 5, comment: "Amazing quality leather!" },
            { user: "Fashion Pro", rating: 5, comment: "Perfect fit and timeless style." }
        ]
    },

    // Home & Garden
    {
        id: 5,
        title: "Coffee Maker",
        description: "Programmable coffee maker with 12-cup capacity and auto-shutoff.",
        price: 89.99,
        category: "home",
        image: "./product-images/5-coffee-maker.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 89,
        reviewsList: [
            { user: "Coffee Lover", rating: 5, comment: "Makes perfect coffee every time!" },
            { user: "Morning Person", rating: 4, comment: "Great programmable features." }
        ]
    },
    {
        id: 6,
        title: "Garden Tools Set",
        description: "Complete set of gardening tools including shovel, rake, and pruning shears.",
        price: 49.99,
        category: "home",
        image: "./product-images/6-garden-tools-set.jpg",
        inStock: true,
        rating: 4.2,
        reviews: 34,
        reviewsList: [
            { user: "Garden Pro", rating: 4, comment: "Good quality tools for the price." },
            { user: "Plant Lover", rating: 5, comment: "Perfect for my garden work." }
        ]
    },
    {
        id: 11,
        title: "Dining Table",
        description: "Modern wooden dining table that seats 6 people comfortably.",
        price: 399.99,
        category: "home",
        image: "product-images/dining table.jpg",
        inStock: true,
        rating: 4.6,
        reviews: 45,
        reviewsList: [
            { user: "Home Decorator", rating: 5, comment: "Beautiful and sturdy table!" },
            { user: "Family Host", rating: 4, comment: "Perfect for family dinners." }
        ]
    },
    {
        id: 19,
        title: "Vacuum Cleaner",
        description: "Powerful cordless vacuum with HEPA filtration and long battery life.",
        price: 249.99,
        category: "home",
        image: "product-images/Vac cleaner.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 78,
        reviewsList: [
            { user: "Clean Freak", rating: 5, comment: "Amazing suction power!" },
            { user: "Busy Parent", rating: 4, comment: "Great for quick cleanups." }
        ]
    },
    {
        id: 20,
        title: "Bed Sheets Set",
        description: "Luxury 1000-thread-count cotton bed sheets in various colors.",
        price: 79.99,
        category: "home",
        image: "product-images/Bedsheet.webp",
        inStock: true,
        rating: 4.7,
        reviews: 156,
        reviewsList: [
            { user: "Sleep Enthusiast", rating: 5, comment: "Incredibly soft and comfortable!" },
            { user: "Bedroom Designer", rating: 4, comment: "Great quality and beautiful colors." }
        ]
    },
    {
        id: 21,
        title: "Kitchen Knife Set",
        description: "Professional 8-piece knife set with wooden block and sharpener.",
        price: 129.99,
        category: "home",
        image: "product-images/kitchen knife set.jpg",
        inStock: true,
        rating: 4.8,
        reviews: 203,
        reviewsList: [
            { user: "Chef at Home", rating: 5, comment: "Sharp and well-balanced knives!" },
            { user: "Cooking Lover", rating: 5, comment: "Perfect for all cooking needs." }
        ]
    },

    // Sports
    {
        id: 7,
        title: "Yoga Mat",
        description: "Non-slip yoga mat perfect for home workouts and meditation.",
        price: 34.99,
        category: "sports",
        image: "./product-images/7-yoga-mat.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 67,
        reviewsList: [
            { user: "Yoga Master", rating: 5, comment: "Perfect grip and thickness!" },
            { user: "Fitness Fan", rating: 4, comment: "Great for all yoga poses." }
        ]
    },
    {
        id: 8,
        title: "Running Shoes",
        description: "Lightweight running shoes with excellent cushioning and breathable material.",
        price: 129.99,
        category: "sports",
        image: "./product-images/8-running-shoes.jpg",
        inStock: true,
        rating: 4.6,
        reviews: 145,
        reviewsList: [
            { user: "Marathon Runner", rating: 5, comment: "Best running shoes I've owned!" },
            { user: "Jogger", rating: 4, comment: "Very comfortable for long runs." }
        ]
    },
    {
        id: 12,
        title: "Tennis Racket",
        description: "Professional tennis racket with carbon fiber construction and comfortable grip.",
        price: 89.99,
        category: "sports",
        image: "product-images/tennisrack.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 23,
        reviewsList: [
            { user: "Tennis Pro", rating: 5, comment: "Excellent control and power!" },
            { user: "Weekend Player", rating: 4, comment: "Great racket for intermediate players." }
        ]
    },
    {
        id: 22,
        title: "Dumbbells Set",
        description: "Adjustable dumbbells set with weights from 5-50 lbs for home workouts.",
        price: 199.99,
        category: "sports",
        image: "product-images/Dumbbell.webp",
        inStock: true,
        rating: 4.7,
        reviews: 89,
        reviewsList: [
            { user: "Gym Enthusiast", rating: 5, comment: "Perfect for home gym setup!" },
            { user: "Fitness Buff", rating: 4, comment: "Great quality and easy to adjust." }
        ]
    },
    {
        id: 23,
        title: "Basketball",
        description: "Official size basketball with premium leather and excellent grip.",
        price: 29.99,
        category: "sports",
        image: "./product-images/23-basketball.jpg",
        inStock: true,
        rating: 4.3,
        reviews: 45,
        reviewsList: [
            { user: "Basketball Fan", rating: 5, comment: "Great grip and bounce!" },
            { user: "Street Player", rating: 4, comment: "Perfect for outdoor courts." }
        ]
    },
    {
        id: 24,
        title: "Swimming Goggles",
        description: "Anti-fog swimming goggles with UV protection and comfortable fit.",
        price: 19.99,
        category: "sports",
        image: "./product-images/24-swimming-goggles.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 78,
        reviewsList: [
            { user: "Swimming Pro", rating: 5, comment: "Crystal clear vision underwater!" },
            { user: "Pool Lover", rating: 4, comment: "Comfortable and leak-proof." }
        ]
    },

    // Books
    {
        id: 25,
        title: "Programming Book",
        description: "Complete guide to modern web development with practical examples.",
        price: 39.99,
        category: "books",
        image: "./product-images/25-programming-book.jpg",
        inStock: true,
        rating: 4.8,
        reviews: 234,
        reviewsList: [
            { user: "Developer", rating: 5, comment: "Best programming book I've read!" },
            { user: "Student", rating: 4, comment: "Clear explanations and great examples." }
        ]
    },
    {
        id: 26,
        title: "Fiction Novel",
        description: "Bestselling mystery novel with captivating plot and characters.",
        price: 14.99,
        category: "books",
        image: "./product-images/26-fiction-novel.jpg",
        inStock: true,
        rating: 4.6,
        reviews: 189,
        reviewsList: [
            { user: "Book Lover", rating: 5, comment: "Couldn't put it down!" },
            { user: "Reader", rating: 4, comment: "Great mystery with unexpected twists." }
        ]
    },
    {
        id: 27,
        title: "Cookbook",
        description: "Collection of 200+ recipes from around the world with beautiful photos.",
        price: 24.99,
        category: "books",
        image: "./product-images/27-cookbook.jpg",
        inStock: true,
        rating: 4.7,
        reviews: 156,
        reviewsList: [
            { user: "Chef", rating: 5, comment: "Amazing recipes and beautiful photos!" },
            { user: "Home Cook", rating: 4, comment: "Great variety of international dishes." }
        ]
    },

    // Beauty
    {
        id: 28,
        title: "Skincare Set",
        description: "Complete 5-piece skincare routine with natural ingredients.",
        price: 79.99,
        category: "beauty",
        image: "./product-images/28-skincare-set.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 167,
        reviewsList: [
            { user: "Beauty Expert", rating: 5, comment: "My skin has never looked better!" },
            { user: "Skincare Lover", rating: 4, comment: "Great natural ingredients." }
        ]
    },
    {
        id: 29,
        title: "Makeup Palette",
        description: "Professional 12-color eyeshadow palette with matte and shimmer shades.",
        price: 34.99,
        category: "beauty",
        image: "./product-images/29-makeup-palette.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 98,
        reviewsList: [
            { user: "Makeup Artist", rating: 5, comment: "Beautiful colors and great pigmentation!" },
            { user: "Beauty Enthusiast", rating: 4, comment: "Perfect for everyday and special occasions." }
        ]
    },
    {
        id: 30,
        title: "Hair Care Kit",
        description: "Luxury hair care set with shampoo, conditioner, and styling products.",
        price: 49.99,
        category: "beauty",
        image: "product-images/Hair care.webp",
        inStock: true,
        rating: 4.6,
        reviews: 123,
        reviewsList: [
            { user: "Hair Stylist", rating: 5, comment: "My hair feels amazing after using this!" },
            { user: "Hair Lover", rating: 4, comment: "Great quality products." }
        ]
    },

    // Toys
    {
        id: 31,
        title: "Building Blocks Set",
        description: "Educational building blocks set with 500+ pieces for creative play.",
        price: 59.99,
        category: "toys",
        image: "product-images/BBset.webp",
        inStock: true,
        rating: 4.8,
        reviews: 89,
        reviewsList: [
            { user: "Parent", rating: 5, comment: "My kids love this! Great for creativity." },
            { user: "Teacher", rating: 4, comment: "Excellent educational toy." }
        ]
    },
    {
        id: 32,
        title: "Remote Control Car",
        description: "High-speed remote control car with LED lights and rechargeable battery.",
        price: 79.99,
        category: "toys",
        image: "./RMC.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 67,
        reviewsList: [
            { user: "Toy Collector", rating: 5, comment: "Fast and fun! Great quality." },
            { user: "Parent", rating: 4, comment: "My son absolutely loves it!" }
        ]
    },
    {
        id: 33,
        title: "Puzzle Game",
        description: "1000-piece jigsaw puzzle featuring beautiful landscape artwork.",
        price: 19.99,
        category: "toys",
        image: "product-images/puzzle.avif",
        inStock: true,
        rating: 4.3,
        reviews: 45,
        reviewsList: [
            { user: "Puzzle Lover", rating: 4, comment: "Challenging and beautiful image!" },
            { user: "Family Fun", rating: 5, comment: "Great family activity." }
        ]
    },
    // Additional products (replace these image files with your own pictures)
    {
        id: 34,
        title: "Bluetooth Speaker",
        description: "Portable wireless speaker with clear stereo sound, simple Bluetooth pairing, and a rechargeable battery for music at home or on the go.",
        price: 59.99,
        category: "electronics",
        image: "product-images/Blue speaker.webp",
        inStock: true,
        rating: 4.5,
        reviews: 42,
        reviewsList: [{ user: "Jamie R.", rating: 5, comment: "Great sound for its size." }]
    },
    {
        id: 35,
        title: "Everyday Backpack",
        description: "Lightweight everyday backpack with a roomy main compartment, padded shoulder straps, and useful pockets for small essentials.",
        price: 44.99,
        category: "clothing",
        image: "product-images/backpack.jpg",
        inStock: true,
        rating: 4.4,
        reviews: 31,
        reviewsList: [{ user: "Taylor M.", rating: 4, comment: "Comfortable and has plenty of space." }]
    },
    {
        id: 36,
        title: "Table Lamp",
        description: "Modern bedside table lamp with a fabric shade and a warm, soft glow for reading or relaxing.",
        price: 39.99,
        category: "home",
        image: "product-images/lamp.jpg",
        inStock: true,
        rating: 4.6,
        reviews: 28,
        reviewsList: [{ user: "Morgan P.", rating: 5, comment: "Looks lovely on my bedside table." }]
    },
    {
        id: 37,
        title: "Camping Water Bottle",
        description: "Reusable stainless steel water bottle with an insulated design to help keep drinks cold during hikes, training, and travel.",
        price: 24.99,
        category: "sports",
        image: "product-images/water bottle.jpg",
        inStock: true,
        rating: 4.5,
        reviews: 36,
        reviewsList: [{ user: "Casey L.", rating: 5, comment: "Easy to carry and keeps water cool." }]
    },
    {
        id: 38,
        title: "Travel Journal",
        description: "Hardcover lined journal with a ribbon bookmark, made for keeping notes, plans, and memories in one place.",
        price: 16.99,
        category: "books",
        image: "product-images/TJ.webp",
        inStock: true,
        rating: 4.7,
        reviews: 22,
        reviewsList: [{ user: "Riley S.", rating: 5, comment: "A lovely notebook with good paper." }]
    },
    {
        id: 39,
        title: "Bath and Body Set",
        description: "Gift-ready bath and body set with scented body wash, lotion, and a soft washcloth for a relaxing self-care routine.",
        price: 32.99,
        category: "beauty",
        image: "product-images/bath set.jpg",
        inStock: true,
        rating: 4.3,
        reviews: 19,
        reviewsList: [{ user: "Jordan K.", rating: 4, comment: "A nice set and the scent is gentle." }]
    },
    {
        id: 40,
        title: "Wooden Train Set",
        description: "Colorful wooden train set with track pieces and carriages to encourage imaginative building and play.",
        price: 34.99,
        category: "toys",
        image: "product-images/woodtrain.jpg",
        inStock: true,
        rating: 4.8,
        reviews: 27,
        reviewsList: [{ user: "Avery D.", rating: 5, comment: "Sturdy pieces and lots of fun to build." }]
    }
];
