import tableDecorate from '../table/table.js';

export default function decorate(block) {
  // First let table.js build the table
  tableDecorate(block);

  // Then restructure text cells: split "Name<br>Title<br>M: ...<br>E: ..."
  // into name, title, and contact sections with proper spacing
  block.querySelectorAll('table tbody tr').forEach((tr) => {
    const textCell = tr.cells[1];
    if (!textCell) return;

    const html = textCell.innerHTML;
    // Split on <br> tags
    const parts = html.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return;

    // Part 0: name (has <strong>)
    // Part 1: job title
    // Parts 2+: contact details (M:, E:)
    const name = parts[0];
    const title = parts[1];
    const contact = parts.slice(2);

    let rebuilt = `<div class="roster-name">${name}</div>`;
    rebuilt += `<div class="roster-title">${title}</div>`;
    if (contact.length > 0) {
      rebuilt += `<div class="roster-contact">${contact.join('<br>')}</div>`;
    }

    textCell.innerHTML = rebuilt;
  });
}
