const base = import.meta.env.BASE_URL.replace(/\/$/, ''); // '/photography'

/** Every internal href goes through here. url('photo/half-dome/') -> '/photography/photo/half-dome/' */
export const url = (p = '') => `${base}/${p.replace(/^\//, '')}`;

/** Absolute URL for meta tags. */
export const absolute = (p: string, site: URL | undefined) =>
  new URL(p.startsWith(base) ? p : url(p), site ?? 'https://willhammondhimself.github.io').href;
