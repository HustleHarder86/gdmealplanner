const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Asset extraction script for WordPress site
async function extractWordPressAssets() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Loading WordPress site...');
    await page.goto('https://pregnancyplateplanner.com', { 
      waitUntil: 'networkidle0' 
    });

    // Extract all images
    console.log('Extracting images...');
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className,
        style: img.getAttribute('style'),
        width: img.width,
        height: img.height
      }));
    });

    // Extract background images from CSS
    console.log('Extracting background images...');
    const backgroundImages = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const bgImages = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          bgImages.push({
            selector: el.tagName + (el.className ? '.' + el.className.replace(/\s+/g, '.') : ''),
            backgroundImage: bgImage,
            backgroundSize: style.backgroundSize,
            backgroundPosition: style.backgroundPosition,
            backgroundRepeat: style.backgroundRepeat
          });
        }
      });
      return bgImages;
    });

    // Extract color scheme
    console.log('Extracting color scheme...');
    const colors = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const colorSet = new Set();
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.color && style.color !== 'rgba(0, 0, 0, 0)') colorSet.add(style.color);
        if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') colorSet.add(style.backgroundColor);
        if (style.borderColor && style.borderColor !== 'rgba(0, 0, 0, 0)') colorSet.add(style.borderColor);
      });
      return Array.from(colorSet);
    });

    // Extract fonts
    console.log('Extracting fonts...');
    const fonts = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const fontSet = new Set();
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.fontFamily) fontSet.add(style.fontFamily);
      });
      return Array.from(fontSet);
    });

    // Extract layout structure
    console.log('Extracting layout structure...');
    const layout = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section, .section, div[class*="section"]'));
      return sections.map(section => ({
        tag: section.tagName,
        className: section.className,
        id: section.id,
        innerHTML: section.innerHTML.substring(0, 500), // First 500 chars for reference
        styles: {
          padding: window.getComputedStyle(section).padding,
          margin: window.getComputedStyle(section).margin,
          backgroundColor: window.getComputedStyle(section).backgroundColor,
          textAlign: window.getComputedStyle(section).textAlign
        }
      }));
    });

    // Save extracted data
    const extractedData = {
      images,
      backgroundImages,
      colors,
      fonts,
      layout,
      extractedAt: new Date().toISOString()
    };

    // Create assets directory
    const assetsDir = path.join(__dirname, '../public/wp-assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Save extraction data
    fs.writeFileSync(
      path.join(__dirname, '../wp-extracted-data.json'), 
      JSON.stringify(extractedData, null, 2)
    );

    console.log('Extraction complete! Data saved to wp-extracted-data.json');
    console.log(`Found ${images.length} images, ${colors.length} colors, ${fonts.length} fonts`);

    // Download images
    console.log('Downloading images...');
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.src.startsWith('http')) {
        try {
          const filename = `image-${i}.${img.src.split('.').pop().split('?')[0]}`;
          await downloadImage(img.src, path.join(assetsDir, filename));
          console.log(`Downloaded: ${filename}`);
        } catch (error) {
          console.log(`Failed to download: ${img.src}`);
        }
      }
    }

  } catch (error) {
    console.error('Error extracting assets:', error);
  } finally {
    await browser.close();
  }
}

// Download image helper
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Run the extraction
if (require.main === module) {
  extractWordPressAssets();
}

module.exports = { extractWordPressAssets };