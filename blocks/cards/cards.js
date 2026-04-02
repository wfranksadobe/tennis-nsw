import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = [...row.children];

    // 4-field model: title (0), image (1), text (2), link (3)
    const titleCell = cells[0];
    const imageCell = cells[1];
    const textCell = cells[2];
    const linkCell = cells[3];

    // Title
    if (titleCell) {
      const heading = document.createElement('div');
      heading.className = 'cards-card-heading';
      const h3 = document.createElement('h3');
      h3.textContent = titleCell.textContent.trim();
      heading.append(h3);
      li.append(heading);
    }

    // Image
    if (imageCell) {
      const imgDiv = document.createElement('div');
      imgDiv.className = 'cards-card-image';
      const pic = imageCell.querySelector('picture');
      if (pic) {
        imgDiv.append(pic);
      } else {
        const img = imageCell.querySelector('img');
        if (img) imgDiv.append(img);
      }
      li.append(imgDiv);
    }

    // Text (description)
    if (textCell) {
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'cards-card-body';
      bodyDiv.innerHTML = textCell.innerHTML;
      li.append(bodyDiv);
    }

    // Link (CTA button)
    if (linkCell) {
      const linkText = linkCell.textContent.trim();
      const linkHref = linkCell.querySelector('a')?.href || linkText;
      if (linkText) {
        const cta = document.createElement('a');
        cta.className = 'cards-card-cta';
        cta.href = linkHref;
        cta.textContent = linkText.startsWith('http') ? 'Find out more' : linkText;
        li.append(cta);
      }
    }

    ul.append(li);
  });

  // Optimize images
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
