const TITLE_DEFAULT = process.env.BRAND_APP_NAME;
const DESCRIPTION_DEFAULT = process.env.BRAND_APP_DESCRIPTION;
export const useBuildMeta = ({ title = TITLE_DEFAULT, page, description = DESCRIPTION_DEFAULT }) => {
  return {
    // sets document title
    title,
    // optional; sets final title as "Index Page - My Website", useful for multiple level meta
    titleTemplate: title => `${page} - ${title}`,

    // meta tags
    meta: {
      description: { name: 'description', content: description },
      keywords: { name: 'keywords', content: `${page} - ${title}` },
      equiv: { 'http-equiv': 'Content-Type', content: 'text/html; charset=UTF-8' },
      // note: for Open Graph type metadata you will need to use SSR, to ensure page is rendered by the server
      ogTitle: {
        property: 'og:title',
        template () {
          return `${page} - ${title}`;
        },
      },
      ogDecription: {
        property: 'og:descrition',
        template () {
          return `${description}`;
        },
      },
      ogType: {
        property: 'og:type',
        template () {
          return 'website';
        },
      },
      ogUrl: {
        property: 'og:url',
        template () {
          return 'https://parmazip.com';
        },
      },
      ogImage: {
        property: 'og:image',
        template () {
          // return require('@/assets/images/hippr-valley-bg.png');
          return '';
        },
      },
    },

    // CSS tags
    link: {
      material: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons' },
    },

    // JS tags
    script: {
      ldJson: {
        type: 'application/ld+json',
        innerHTML: '{ "@context": "http://schema.org" }',
      },
    },

    // <html> attributes
    htmlAttr: {
      'xmlns:cc': 'http://creativecommons.org/ns#', // generates <html xmlns:cc="http://creativecommons.org/ns#">,
      empty: undefined, // generates <html empty>
    },

    // <body> attributes
    bodyAttr: {
      'action-scope': 'xyz', // generates <body action-scope="xyz">
      empty: undefined, // generates <body empty>
    },

    // <noscript> tags
    noscript: {
      default: 'This is content for browsers with no JS (or disabled JS)',
    },
  };
};
