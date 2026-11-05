const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Escape text and tighten the ʻokina. Schibsted's U+02BB is drawn as a spacing
 * modifier with ~0.19em of side bearing each side, which reads as "Hawai ʻ i".
 */
export const typeset = (s: string) => esc(s).replace(/ʻ/g, '<span class="ok">ʻ</span>');

/**
 * Display size (--step-3). The real U+02BB, pulled in a little less than at text size: at 88px
 * the -0.13em text setting fuses it with the i-dots, and no setting at all lets it float.
 */
export const typesetDisplay = (s: string) => esc(s).replace(/ʻ/g, '<span class="okd">ʻ</span>');
