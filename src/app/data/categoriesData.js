// src/data/categoriesData.js

export const categories = [
  { key: "Electronics", image: "electronics.jpg" },
  { key: "Automotive", image: "automotive.jpg" },
  { key: "Kitchen", image: "kitchen.jpg" },
  { key: "Beauty", image: "beauty.jpg" },
  { key: "Fashion", image: "fashion.jpg" },
  { key: "Sports", image: "sport.jpg" },
  { key: "Books", image: "books.jpg" },
  { key: "Home", image: "homegarden.jpeg" },
  { key: "Toys", image: "toys.jpeg" },
  { key: "Health", image: "health.jpeg" },
  { key: "Pets", image: "pets.jpg" },
];

export const categoryKeywordsMap = {
  Electronics: [
    "phones",
    "mobile phone",
    "laptop",
    "tablet",
    "headphone",
    "camera",
    "tv",
    "monitor",
    "speaker",
    "wearable",
    "gaming console",
    "drone",
    "smartwatch",
    "earbuds",
    "keyboard",
    "mouse",
    "charger",
    "router",
    "printer",
    "scanner",
    "hard drive",
    "ssd",
    "usb",
    "bluetooth",
  ],
  Automotive: [
    "car",
    "car electronics",
    "car accessories",
    "motorcycle parts",
    "tools",
    "equipment",
    "car care",
    "gps",
    "navigation",
    "tires",
    "batteries",
    "engine",
    "brakes",
    "oil",
    "spark plugs",
    "battery charger",
    "car stereo",
    "dash cam",
    "car cover",
    "floor mats",
  ],
  Kitchen: [
    "cookware",
    "utensil",
    "appliance",
    "bakeware",
    "cutlery",
    "tableware",
    "kitchen storage",
    "coffee",
    "tea",
    "blender",
    "microwave",
    "toaster",
    "dishwasher",
    "refrigerator",
    "oven",
    "mixer",
    "food processor",
    "kettle",
    "grater",
    "slicer",
  ],
  Beauty: [
    "skincare",
    "makeup",
    "haircare",
    "fragrance",
    "personal care",
    "nail care",
    "brushes",
    "cosmetics",
    "perfume",
    "lotion",
    "serum",
    "mascara",
    "foundation",
    "lipstick",
    "eyeliner",
    "shampoo",
    "conditioner",
    "hair spray",
    "beauty tools",
  ],
  Fashion: [
    "clothing",
    "shoes",
    "accessories",
    "jewelry",
    "bags",
    "luggage",
    "watches",
    "eyewear",
    "sneakers",
    "hats",
    "scarves",
    "belts",
    "socks",
    "sunglasses",
    "boots",
    "heels",
    "sandals",
    "shorts",
    "jeans",
    "t-shirts",
  ],
  Sports: [
    "fitness",
    "equipment",
    "outdoor",
    "gear",
    "sportswear",
    "bicycles",
    "yoga mats",
    "treadmills",
    "dumbbells",
    "resistance bands",
    "basketball",
    "soccer ball",
    "tennis racket",
    "baseball bat",
    "golf clubs",
    "hockey stick",
    "skates",
    "swimwear",
    "gym bags",
  ],
  Books: [
    "fiction",
    "non-fiction",
    "children's books",
    "textbooks",
    "comics",
    "graphic novels",
    "biographies",
    "magazines",
    "novels",
    "cookbooks",
    "mystery",
    "science",
    "history",
    "fantasy",
    "romance",
    "self-help",
    "travel",
    "poetry",
    "horror",
  ],
  Home: [
    // Changed key from "Home & Garden" to "Home"
    "furniture",
    "bedding",
    "decor",
    "garden supplies",
    "lighting",
    "bathroom accessories",
    "storage",
    "organization",
    "lamps",
    "chairs",
    "sofas",
    "tables",
    "beds",
    "curtains",
    "plants",
    "tools",
    "outdoor furniture",
    "kitchenware",
    "wall art",
  ],
  Toys: [
    "action figures",
    "puzzles",
    "board games",
    "educational toys",
    "dolls",
    "outdoor play",
    "lego",
    "video games",
    "rc cars",
    "stuffed animals",
    "building blocks",
    "card games",
    "trains",
    "playsets",
    "science kits",
    "crafts",
    "video game consoles",
  ],
  Health: [
    "vitamins",
    "supplements",
    "medical supplies",
    "personal care",
    "fitness",
    "nutrition",
    "first aid",
    "thermometers",
    "blood pressure monitors",
    "glucose meters",
    "pain relievers",
    "bandages",
    "antiseptics",
    "health monitors",
    "eye care",
    "oral care",
  ],
  Pets: [
    "pet food",
    "pet toys",
    "pet health",
    "pet grooming",
    "aquariums",
    "pet accessories",
    "leashes",
    "beds",
    "pet collars",
    "litter boxes",
    "pet carriers",
    "chew toys",
    "pet treats",
    "aquarium supplies",
  ],
  // Add other categories similarly...
};

export const subcategories = {
  Electronics: [
    "Phones",
    "Laptops",
    "Tablets",
    "Headphones",
    "Cameras",
    "TVs",
    "Monitors",
    "Speakers",
    "Wearables",
    "Gaming Consoles",
    "Drones",
  ],
  Automotive: [
    "Car Electronics",
    "Car Accessories",
    "Motorcycle Parts",
    "Tools",
    "Equipment",
    "Car Care",
    "GPS",
    "Navigation",
    "Tires",
    "Batteries",
  ],
  Kitchen: [
    "Cookware",
    "Utensils",
    "Appliances",
    "Bakeware",
    "Cutlery",
    "Tableware",
    "Kitchen Storage",
    "Coffee & Tea",
  ],
  Beauty: [
    "Skincare",
    "Makeup",
    "Haircare",
    "Fragrance",
    "Personal Care",
    "Nail Care",
    "Brushes",
    "Cosmetics",
  ],
  Fashion: [
    "Clothing",
    "Shoes",
    "Accessories",
    "Jewelry",
    "Bags",
    "Luggage",
    "Watches",
    "Eyewear",
    "Sneakers",
    "Hats",
  ],
  Sports: [
    "Fitness",
    "Equipment",
    "Outdoor",
    "Gear",
    "Sportswear",
    "Bicycles",
    "Yoga Mats",
    "Treadmills",
  ],
  Books: [
    "Fiction",
    "Non-Fiction",
    "Children's Books",
    "Textbooks",
    "Comics",
    "Graphic Novels",
    "Biographies",
    "Magazines",
    "Novels",
  ],
  Home: [
    // Changed key from "Home & Garden" to "Home"
    "Furniture",
    "Bedding",
    "Decor",
    "Garden Supplies",
    "Lighting",
    "Bathroom Accessories",
    "Storage",
    "Organization",
    "Lamps",
    "Chairs",
  ],
  Toys: [
    "Action Figures",
    "Puzzles",
    "Board Games",
    "Educational Toys",
    "Dolls",
    "Outdoor Play",
    "LEGO",
    "Video Games",
  ],
  Health: [
    "Vitamins",
    "Supplements",
    "Medical Supplies",
    "Personal Care",
    "Fitness",
    "Nutrition",
    "First Aid",
    "Thermometers",
  ],
  Pets: [
    "Pet Food",
    "Pet Toys",
    "Pet Health",
    "Pet Grooming",
    "Aquariums",
    "Pet Accessories",
    "Leashes",
    "Beds",
  ],
};
