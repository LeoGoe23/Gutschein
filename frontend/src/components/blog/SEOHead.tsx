import { useEffect } from 'react';
import { BlogPost } from '../../types/blog';

interface SEOHeadProps {
  post?: BlogPost;
  title?: string;
  description?: string;
  type?: 'website' | 'article';
  image?: string;
}

export default function SEOHead({ post, title, description, type = 'website', image }: SEOHeadProps) {
  useEffect(() => {
    const siteUrl = 'https://gutscheinery.de';
    const currentUrl = window.location.href;

    // Title und Description
    const metaTitle = post?.metaTitle || title || 'Blog - Gutscheinery';
    const metaDescription = post?.metaDescription || description || 'Entdecke hilfreiche Artikel rund um Gutscheine und digitales Marketing.';
    const ogImage = post?.featuredImage || image || `${siteUrl}/default-blog-image.jpg`;

    // Document Title
    document.title = metaTitle;

    // Meta Tags
    setMetaTag('description', metaDescription);
    setMetaTag('robots', 'index, follow');

    // Open Graph Tags
    setMetaTag('og:title', metaTitle, 'property');
    setMetaTag('og:description', metaDescription, 'property');
    setMetaTag('og:type', type, 'property');
    setMetaTag('og:url', currentUrl, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:site_name', 'Gutscheinery', 'property');

    // Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', metaTitle);
    setMetaTag('twitter:description', metaDescription);
    setMetaTag('twitter:image', ogImage);

    // Canonical Tag
    setCanonicalTag(currentUrl);

    // Strukturierte Daten (Schema.org)
    if (post && type === 'article') {
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: post.featuredImage || undefined,
        author: {
          '@type': 'Organization',
          name: post.author
        },
        publisher: {
          '@type': 'Organization',
          name: 'Gutscheinery',
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/logo.png`
          }
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        description: post.metaDescription,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': currentUrl
        }
      };

      setStructuredData(structuredData);
    }

    // Cleanup beim Unmount
    return () => {
      // Optional: Meta-Tags zurücksetzen
    };
  }, [post, title, description, type, image]);

  return null;
}

// Helper-Funktionen
function setMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function setCanonicalTag(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }

  link.href = url;
}

function setStructuredData(data: any) {
  const existingScript = document.querySelector('script[type="application/ld+json"]');

  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
