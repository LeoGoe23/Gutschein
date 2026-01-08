import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'breadcrumb';
  data?: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    let structuredData: any = {};

    if (type === 'website') {
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Gutscheinery',
        url: 'https://gutscheinery.de',
        description: 'Digitale Gutscheine für Ihr Unternehmen. Einfach erstellen, verkaufen und verwalten.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://gutscheinery.de/blog?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      };
    } else if (type === 'organization') {
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Gutscheinery',
        url: 'https://gutscheinery.de',
        logo: 'https://gutscheinery.de/logo.png',
        description: 'Digitale Gutscheinlösungen für moderne Unternehmen',
        sameAs: [
          // Hier können Sie später Social Media Links hinzufügen
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          url: 'https://gutscheinery.de/kontakt'
        }
      };
    } else if (type === 'breadcrumb' && data) {
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      };
    }

    // Erstelle oder aktualisiere das Script-Tag
    const scriptId = `structured-data-${type}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script') as HTMLScriptElement;
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(structuredData);

    // Cleanup beim Unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [type, data]);

  return null;
}
