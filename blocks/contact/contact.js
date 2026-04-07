/**
 * Contact Block
 * Displays a staff/team member card with photo, name, title, mobile, and email.
 * Designed for 2-3 column grid layouts within a section.
 *
 * Row structure (simple block, no model — fields are rows):
 *   Row 0: Name
 *   Row 1: Job Title
 *   Row 2: Image
 *   Row 3: Mobile
 *   Row 4: Email
 */
export default async function decorate(block) {
  const rows = [...block.children];

  const name = rows[0]?.textContent?.trim() || '';
  const jobTitle = rows[1]?.textContent?.trim() || '';
  const imgEl = rows[2]?.querySelector('img');
  const mobile = rows[3]?.textContent?.trim() || '';
  const email = rows[4]?.textContent?.trim() || '';

  // Build the contact card
  const card = document.createElement('div');
  card.className = 'contact-card';

  // Photo
  const photoDiv = document.createElement('div');
  photoDiv.className = 'contact-card-photo';
  if (imgEl) {
    imgEl.alt = imgEl.alt || name;
    imgEl.loading = 'lazy';
    photoDiv.append(imgEl);
  } else {
    // Placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'contact-card-placeholder';
    placeholder.setAttribute('aria-label', name);
    photoDiv.append(placeholder);
  }
  card.append(photoDiv);

  // Details
  const details = document.createElement('div');
  details.className = 'contact-card-details';

  if (name) {
    const nameEl = document.createElement('p');
    nameEl.className = 'contact-card-name';
    nameEl.textContent = name;
    details.append(nameEl);
  }

  if (jobTitle) {
    const titleEl = document.createElement('p');
    titleEl.className = 'contact-card-title';
    titleEl.textContent = jobTitle;
    details.append(titleEl);
  }

  if (mobile) {
    const mobileEl = document.createElement('p');
    mobileEl.className = 'contact-card-mobile';
    const mobileLink = document.createElement('a');
    mobileLink.href = `tel:${mobile.replace(/\s/g, '')}`;
    mobileLink.textContent = `M: ${mobile}`;
    mobileEl.append(mobileLink);
    details.append(mobileEl);
  }

  if (email) {
    const emailEl = document.createElement('p');
    emailEl.className = 'contact-card-email';
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${email}`;
    emailLink.textContent = `E: ${email}`;
    emailEl.append(emailLink);
    details.append(emailEl);
  }

  card.append(details);

  block.textContent = '';
  block.append(card);
}
