export default function decorate(block) {
  const rows = [...block.children];
  const desktopCell = rows[0]?.children[0];
  const mobileCell = rows[0]?.children[1];

  const desktopImg = desktopCell?.querySelector('img');
  const mobileImg = mobileCell?.querySelector('img');

  if (!desktopImg) return;

  // Build picture element with source for desktop and mobile
  const picture = document.createElement('picture');

  // Mobile source (default, < 768px)
  if (mobileImg) {
    const mobileSource = document.createElement('source');
    mobileSource.srcset = mobileImg.src;
    mobileSource.media = '(max-width: 767px)';
    picture.append(mobileSource);
  }

  // Desktop source (>= 768px)
  const desktopSource = document.createElement('source');
  desktopSource.srcset = desktopImg.src;
  desktopSource.media = '(min-width: 768px)';
  picture.append(desktopSource);

  // Fallback img (desktop)
  const img = document.createElement('img');
  img.src = desktopImg.src;
  img.alt = desktopImg.alt || '';
  img.loading = 'eager';
  picture.append(img);

  block.textContent = '';
  block.append(picture);
}
