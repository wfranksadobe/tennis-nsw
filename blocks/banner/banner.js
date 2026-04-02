export default function decorate(block) {
  const rows = [...block.children];
  // Model fields as rows: row 0 = desktop image, row 1 = mobile image
  const desktopRow = rows[0];
  const mobileRow = rows[1];

  const desktopImg = desktopRow?.querySelector('img');
  const mobileImg = mobileRow?.querySelector('img');

  if (!desktopImg) return;

  const picture = document.createElement('picture');

  if (mobileImg) {
    const mobileSource = document.createElement('source');
    mobileSource.srcset = mobileImg.src;
    mobileSource.media = '(max-width: 767px)';
    picture.append(mobileSource);
  }

  const desktopSource = document.createElement('source');
  desktopSource.srcset = desktopImg.src;
  desktopSource.media = '(min-width: 768px)';
  picture.append(desktopSource);

  const img = document.createElement('img');
  img.src = desktopImg.src;
  img.alt = desktopImg.alt || '';
  img.loading = 'eager';
  picture.append(img);

  block.textContent = '';
  block.append(picture);
}
