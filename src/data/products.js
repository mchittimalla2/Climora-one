const asset = (path) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const products = [
  {
    id: 1,
    category: "Religious",
    name: "Balaji Wooden Idol Handicraft",
    price: 471,
    images: [
      asset("images/products/balaji-idol/main.jpeg"),
      asset("images/products/balaji-idol/side.jpeg"),
      asset("images/products/balaji-idol/top.jpeg"),
      asset("images/products/balaji-idol/back.jpeg"),
    ],
    description:
      "Traditional handmade wooden idol crafted by rural artisans.",
  },
  {
    id: 2,
    category: "Toys",
    name: "Handmade Wooden Motorbike Toy",
    price: 384,
    images: [
      asset("images/products/wooden-bike/main.jpeg"),
      asset("images/products/wooden-bike/side.jpeg"),
      asset("images/products/wooden-bike/top.jpeg"),
      asset("images/products/wooden-bike/back.jpeg"),
    ],
    description:
      "Eco-friendly wooden toy made with natural materials.",
  },
  {
    id: 3,
    category: "Home Decor",
    name: "Handcrafted Wooden Door Hanging",
    price: 662,
    images: [
      asset("images/products/door-hanging/main.jpeg"),
      asset("images/products/door-hanging/side.jpeg"),
      asset("images/products/door-hanging/top.jpeg"),
      asset("images/products/door-hanging/back.jpeg"),
    ],
    description:
      "Beautiful handmade wooden door hanging for home decor.",
  },
  {
    id: 4,
    category: "Toys",
    name: "Wooden Spin Set of 5",
    price: 304,
    images: [
      asset("images/products/wooden-spin/main.jpeg"),
      asset("images/products/wooden-spin/side.jpeg"),
      asset("images/products/wooden-spin/top.jpeg"),
      asset("images/products/wooden-spin/back.jpeg"),
    ],
    description:
      "Traditional wooden spin toy set made by artisans.",
  },
];

export default products;