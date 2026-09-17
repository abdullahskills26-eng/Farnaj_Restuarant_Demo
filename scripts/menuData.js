/**
 * Cuisine Farnaj — menu data & site configuration.
 * Loaded first; every other script reads from the globals defined here.
 */

const SITE_CONFIG = {
  brand: "Cuisine Farnaj",
  tagline: "The Real Home Chef",
  phone: "051-111-728-687",
  phoneHref: "tel:+9251111728687",
  whatsapp: "0300-0728-687",
  whatsappNumber: "923000728687", // international format for wa.me
  email: "orders@farnaj.com.pk",
  address: "Main Peshawar Road, Near Kainat Travels, Rawalpindi/Islamabad",
  mapsUrl: "https://maps.app.goo.gl/bR5gmqx4NbcTUPxJ9?g_st=aw",
  timings: "Monday – Sunday: 11:00 AM – 12:30 AM",
  deliveryFee: 100,
  currency: "Rs.",
};

const CATEGORIES = [
  "All",
  "Chicken Biryani House",
  "Restaurant Menu",
  "Dhaba Menu",
  "Chaat Corner & Snacks",
  "Sides & Sauces",
];

const menuData = [
  // Chicken Biryani House
  { id: 1, category: "Chicken Biryani House", name: "Chicken Biryani Classic", urdu: "چکن بریانی کلاسک", price: 439, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },
  { id: 2, category: "Chicken Biryani House", name: "Family Biryani (Serves 2-3)", urdu: "فیملی بریانی", desc: "Includes 2 Raita & Salad", price: 999, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500" },
  { id: 3, category: "Chicken Biryani House", name: "Half Biryani", urdu: "ہاف بریانی", price: 249, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500" },

  // Restaurant Menu
  { id: 4, category: "Restaurant Menu", name: "Chicken Karahi (Full)", urdu: "چکن کڑاہی", price: 389, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500" },
  { id: 5, category: "Restaurant Menu", name: "Half Chicken Karahi", urdu: "ہاف چکن کڑاہی", price: 799, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500" },
  { id: 6, category: "Restaurant Menu", name: "Chicken Nihari", urdu: "چکن نہاری", price: 389, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 7, category: "Restaurant Menu", name: "Chicken Kofta", urdu: "چکن کوفتہ", price: 269, image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=500" },
  { id: 8, category: "Restaurant Menu", name: "Beef Haleem", urdu: "بیف حلیم", price: 369, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 9, category: "Restaurant Menu", name: "Chicken Spaghetti", urdu: "چکن اسپاگیٹی", price: 479, image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500" },
  { id: 10, category: "Restaurant Menu", name: "Singaporean Noodles", urdu: "سنگاپورین نوڈلز", price: 529, image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500" },
  { id: 11, category: "Restaurant Menu", name: "Chicken Manchurian with Veg Fried Rice", urdu: "چکن منچورین فرائیڈ رائس", price: 489, image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500" },
  { id: 12, category: "Restaurant Menu", name: "Brain Masalah Handi", urdu: "مغز ہانڈی", price: 1349, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500" },

  // Dhaba Menu
  { id: 13, category: "Dhaba Menu", name: "Chana Masala Fry", urdu: "چنا فرائی", price: 229, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 14, category: "Dhaba Menu", name: "Dal Chana Plate", urdu: "دال چنا", price: 219, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 15, category: "Dhaba Menu", name: "Dal Chawal", urdu: "دال چاول", price: 299, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500" },
  { id: 16, category: "Dhaba Menu", name: "Mix Sabzi", urdu: "مکس سبزی", price: 199, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500" },
  { id: 17, category: "Dhaba Menu", name: "Chicken Patty Burger", urdu: "چکن پیٹی برگر", price: 319, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { id: 18, category: "Dhaba Menu", name: "Chicken Patty Cheese Burger", urdu: "چکن چیڈر برگر", price: 379, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { id: 19, category: "Dhaba Menu", name: "Two (2) Chicken Burgers Deal", urdu: "2 چکن برگر ڈیل", desc: "Served with Fries & Ketchup", price: 625, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { id: 20, category: "Dhaba Menu", name: "Dhaba Bun Kabab", urdu: "ڈھابہ بن کباب", price: 115, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { id: 21, category: "Dhaba Menu", name: "Anda Shami Burger", urdu: "انڈا شامی برگر", price: 149, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },

  // Chaat Corner & Snacks
  { id: 22, category: "Chaat Corner & Snacks", name: "Dahi Ballay", urdu: "دہی بھلے", price: 240, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" },
  { id: 23, category: "Chaat Corner & Snacks", name: "Chana Chaat", urdu: "چنا چاٹ", price: 220, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" },
  { id: 24, category: "Chaat Corner & Snacks", name: "Mix Bhallay Chana Chaat", urdu: "مکس بھلے چنا چاٹ", price: 260, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" },
  { id: 25, category: "Chaat Corner & Snacks", name: "Chicken Shami Kabab (3 Pcs)", urdu: "چکن شامی کباب", price: 199, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500" },
  { id: 26, category: "Chaat Corner & Snacks", name: "Chicken Nuggets (5 Pcs)", urdu: "چکن ناگٹس", price: 289, image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500" },
  { id: 27, category: "Chaat Corner & Snacks", name: "Chicken Sandwich", urdu: "چکن سینڈوچ", price: 229, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500" },
  { id: 28, category: "Chaat Corner & Snacks", name: "Egg Sandwich", urdu: "انڈا سینڈوچ", price: 189, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500" },

  // Sides & Sauces
  { id: 29, category: "Sides & Sauces", name: "Mint Raita / Zeera Raita", urdu: "رائتہ", price: 45, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500" },
  { id: 30, category: "Sides & Sauces", name: "Red Garlic Sauce / Green Mint Sauce", urdu: "چٹنی", price: 29, image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=500" }
];

/** Fallback copy for items that ship without a `desc` field. */
const CATEGORY_BLURBS = {
  "Chicken Biryani House": "Fragrant spiced rice layered with tender chicken, cooked the home way.",
  "Restaurant Menu": "Chef's kitchen favourite, freshly prepared on order.",
  "Dhaba Menu": "Hearty dhaba-style comfort food, full of desi flavour.",
  "Chaat Corner & Snacks": "Tangy, crunchy and made fresh for snacking.",
  "Sides & Sauces": "The perfect add-on to complete your meal.",
};

/** Lucide icon used for each category tab. */
const CATEGORY_ICONS = {
  "All": "layout-grid",
  "Chicken Biryani House": "flame",
  "Restaurant Menu": "chef-hat",
  "Dhaba Menu": "soup",
  "Chaat Corner & Snacks": "sandwich",
  "Sides & Sauces": "cup-soda",
};

const getMenuItem = (id) => menuData.find((item) => item.id === Number(id));

const getItemDescription = (item) => item.desc || CATEGORY_BLURBS[item.category] || "";

const formatPrice = (amount) => `${SITE_CONFIG.currency} ${Number(amount).toLocaleString("en-PK")}`;
