const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcwxxxxxxxx',
  api_key: process.env.CLOUDINARY_API_KEY || 'xxxxxxxxxxxxxxxxxxx',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'xxxxxxxxxxxxxxxxxxxxxxxxx',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'novasathi/experts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
