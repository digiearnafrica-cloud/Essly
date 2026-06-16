import { CATEGORIES } from './constants.js';

export const generateProductCode = (category, existingProducts) => {
  const cat = CATEGORIES.find(c => c.id === category);
  const prefix = cat ? cat.prefix : 'GN';
  const catProducts = existingProducts.filter(p => p.category === category);
  return `ESS-${prefix}-${String(catProducts.length + 1).padStart(3, '0')}`;
};

export const generateOrderNumber = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ESS-';
  for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
};

export const generateDescription = (name, category) => {
  const templates = {
    'baby-care': [
      `Keep your little one comfortable and protected with ${name}. Designed with gentle, skin-safe materials that provide reliable protection throughout the day and night. Perfect for newborns and growing babies, offering superior absorbency and a snug fit for active movement.`,
      `${name} is specially formulated for your baby's delicate skin. Provides long-lasting protection and comfort, keeping your baby dry, happy, and healthy. Made with trusted ingredients that are gentle, hypoallergenic, and dermatologically tested.`,
    ],
    'personal-care': [
      `Elevate your daily routine with ${name}. A premium personal care essential crafted to keep you feeling fresh, confident, and at your best all day long. Dermatologically tested and suitable for everyday use.`,
      `${name} delivers effective, long-lasting results you can count on. Whether for daily freshness or targeted care, this product is formulated to meet the needs of modern lifestyles — reliable, gentle, and effective.`,
    ],
    'household': [
      `${name} is a household essential built for everyday reliability. Strong, durable, and effective — designed to make your home cleaner and your daily routines easier. Great value for families of all sizes.`,
      `Stock up on ${name} and never run short of a daily essential. Trusted by households across Ghana for its quality, value, and consistent performance in everyday use.`,
    ],
    'food-grocery': [
      `${name} brings quality and great taste to your everyday meals. Sourced and selected for freshness and value, this product is a staple for Ghanaian households who demand the best for their families.`,
      `Add ${name} to your cart and enjoy the quality your family deserves. Fresh, reliable, and excellent value — a must-have for every Ghanaian home.`,
    ],
    'cleaning': [
      `${name} makes cleaning easier and more effective. Formulated with powerful ingredients that cut through dirt, grease, and grime — leaving your home spotless and smelling fresh. Safe for family use.`,
      `Keep your home sparkling clean with ${name}. A trusted cleaning solution that delivers professional results without the hassle. Perfect for daily use throughout the home.`,
    ],
  };
  const opts = templates[category] || [
    `${name} is a quality essential brought to you by Essly — your trusted source for everyday products in Ghana. Reliable, affordable, and available for nationwide delivery.`,
  ];
  return opts[Math.floor(Math.random() * opts.length)];
};

export const formatDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDateLong = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
};

export const compressToBlob = (file, maxW = 700, q = 0.80) =>
  new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(maxW / img.width, maxW / img.height, 1);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(blob => res(blob), 'image/jpeg', q);
      };
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

export const uploadToCloudinary = async (file, resourceType = 'image', onProgress) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadFile = resourceType === 'image' ? await compressToBlob(file) : file;
  const formData = new FormData();
  formData.append('file', uploadFile, resourceType === 'image' ? 'product.jpg' : file.name);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', resourceType);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
      else reject(new Error('Upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
};
