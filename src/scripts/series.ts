// Series list: the sticky preview follows the hovered or focused row.
const show = (e: Event) => {
  const row = (e.target as Element).closest?.<HTMLElement>('[data-series-row]');
  if (!row) return;
  const i = row.dataset.seriesRow;
  document.querySelectorAll<HTMLElement>('[data-preview]').forEach((p) => p.classList.toggle('is-active', p.dataset.preview === i));
};
document.addEventListener('pointerover', show);
document.addEventListener('focusin', show);
