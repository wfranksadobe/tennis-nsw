# Tennis Australia Block Palette

Complete block inventory for the tennis.com.au/nsw EDS migration. Use this as the authoritative block palette when performing block inventory for any Tennis NSW page import.

* * *

## How to Use This Reference

When performing block inventory for Tennis NSW pages:

1. Check which blocks already exist in the local project (`ls -d blocks/*/`)
2. Cross-reference with this list to know the expected Tennis NSW block set
3. Blocks not yet built locally will need to be created or sourced from the Tennis skills pack

* * *

## Critical Blocks (Present on Almost Every Page)

### `hero`

Purpose: Large prominent section at the top of every page. Has multiple variants.

Variants:

* `Hero` — H1 + subheading + 1–2 CTA buttons on solid or branded background
* `Hero (Image Right)` — H1 + text + CTAs left column, image right column
* `Hero (Full Bleed)` — Full-width background image with overlaid text, used on hub pages
* `Hero (Editorial)` — Category tag + H1 + date, used on news article pages

When to use on Tennis NSW pages: First block after the announcement banner (if present). Every single page.

* * *

### `announcement-banner`

Purpose: Dismissible top-of-page alert bar. Used for closures, registration deadlines, venue notices, event updates, and campaign messages.

When to use on Tennis NSW pages: Check if a dismissible top bar exists above the hero. Common on the homepage, participation pages, event pages, and region landing pages.

Content model:

    | Announcement Banner |
    |--------------------|
    | [Alert text with optional CTA link] |

* * *

### `anchor-tile-nav`

Purpose: Horizontal scrollable row of icon + label tiles linking to `#hash` sections or sub-pages. Tennis NSW’s primary in-page navigation pattern for landing pages and hub pages.

When to use on Tennis NSW pages: Immediately after the hero on Clubs, Play, Our Work, Regions, and event hub pages. Look for a row of 5–10 icon tiles with short labels.

Typical tiles on the Tennis NSW homepage:

* Clubs
* Play
* Our Work
* About Us
* News
* Events
* Regions
* First Nations
* Youth Hub

Content model:

    | Anchor Tile Nav |
    |-----------------|
    | ![Icon](icon1.png) | [Clubs](#clubs) |
    | ![Icon](icon2.png) | [Play](#play) |
    | ![Icon](icon3.png) | [Our Work](#our-work) |

* * *

### `article-cards`

Purpose: 3-column grid of image + heading + excerpt + "Read more" link. Used on landing pages for news, stories, and related content.

When to use on Tennis NSW pages: Any grid of editorial content — news articles, stories, program highlights, community updates, and related content sections.

Content model:

    | Article Cards |
    |--------------|
    | ![Article thumbnail](img1.png) | ## Article heading one<br>Excerpt text summarising the article content.<br>[Read more](/news/article-one) |
    | ![Article thumbnail](img2.png) | ## Second article heading<br>Another excerpt text.<br>[Read more](/news/article-two) |

* * *

### `support-cards`

Purpose: 3-column grid of icon + heading + link list. Used for help, contact, resources, and support pathways.

When to use on Tennis NSW pages: Sections such as “Support”, “Resources”, “Contact”, “Need help?”, or “Get involved”.

Content model:

    | Support Cards |
    |--------------|
    | ![icon](support.png) | ## Support & Resources<br>[Find answers to common questions](/help)<br>[Policies & guidelines](/policies)<br>[Contact Tennis NSW](/contact) |
    | ![icon](contact.png) | ## Contact Us<br>[Send an enquiry](/contact)<br>[Office locations](/locations)<br>[Media enquiries](/media) |
    | ![icon](locate.png) | ## Find Tennis Near You<br>[Clubs](#clubs)<br>[Regions](#regions)<br>[Courts & venues](/venues) |

* * *

### `feature-grid`

Purpose: 3- or 4-column grid of icon or image + H3 heading + description paragraph. Used for programs, initiatives, and key service points.

When to use on Tennis NSW pages: Sections highlighting participation, inclusion, coaching, community, pathways, and key initiatives.

Content model:

    | Feature Grid |
    |-------------|
    | ![icon](pathway.png) | ## Participation pathways<br>Programs that help players start, stay, and progress in tennis. |
    | ![icon](community.png) | ## Community tennis<br>Support for clubs, venues, and local communities. |
    | ![icon](inclusion.png) | ## Inclusion & diversity<br>Programs and support for all abilities and backgrounds. |
    | ![icon](youth.png) | ## Youth engagement<br>Opportunities for young people to connect, learn, and lead. |

* * *

## High Frequency Blocks

### `tabs`

Purpose: Content organised in switchable tab panels. Used for grouped program content, region content, and support journeys.

When to use on Tennis NSW pages: Tab navigation such as “Overview | Programs | Resources | FAQs” or region-by-region content switches.

* * *

### `accordion`

Purpose: Expandable Q&A / FAQ sections. JavaScript-driven show/hide. Used on support pages, program detail pages, and policy pages.

When to use on Tennis NSW pages: FAQ sections, policy explanations, safeguarding content, event details, and support pages.

* * *

### `event-listing`

Purpose: Event card grid with filters and load-more behavior. Used for tournaments, calendars, and community event listings.

When to use on Tennis NSW pages: Upcoming events, competitions, tournament listings, and region event pages.

Content model:

    | Event Listing |
    |--------------|
    | limit | 12 |
    | sort | date-asc |
    | category | all |
    | filter | true |

* * *

### `region-cards`

Purpose: Region entry cards linking to regional landing pages and local content.

When to use on Tennis NSW pages: Regions hub pages, regional navigation pages, and statewide landing pages.

Content model:

    | Region Cards |
    |-------------|
    | ![Region image](northwest.png) | ## North West<br>Discover clubs, events, and programs in North West NSW. |
    | ![Region image](southwest.png) | ## South West<br>Find local tennis information for South West NSW. |
    | ![Region image](southeast.png) | ## South East<br>Regional tennis programs and contacts for South East NSW. |

* * *

### `search-results`

Purpose: Search result listing with filters and load-more. Used for site-wide discovery and content directories.

When to use on Tennis NSW pages: Search pages, resource directories, and content discovery views.

Content model:

    | Search Results |
    |---------------|
    | limit | 12 |
    | sort | relevance |
    | query-source | site |
    | tag-filter | true |

* * *

### `header`

Purpose: Global site navigation with audience pathways and utility links.

When to use on Tennis NSW pages: Global header only. Do not import as a standalone page block unless the page actually includes a header-style navigation component.

* * *

### `footer`

Purpose: Global footer with key links, acknowledgements, and contact pathways.

When to use on Tennis NSW pages: Global footer only. Include acknowledgements and repeat high-value navigation links.

* * *

## Medium Priority Blocks

### `in-page-nav`

Purpose: Sticky anchor link navigation for long landing pages. Jumps to `#overview`, `#programs`, `#events`, `#regions`, `#faqs`, or `#contact` sections.

When to use on Tennis NSW pages: Long-form landing pages, program pages, region pages, and support pages.

Content model:

    | In Page Nav |
    |------------|
    | [Overview](#overview) | [Programs](#programs) | [Events](#events) | [FAQs](#faqs) | [Contact](#contact) |

* * *

### `step-process`

Purpose: Numbered steps with icons explaining a process or journey. Used for registrations, joining a club, venue development, or getting started in tennis.

When to use on Tennis NSW pages: “How it works”, “How to join”, “How to get started”, and onboarding sections.

Content model:

    | Step Process |
    |-------------|
    | ![Step 1 icon](step1.png) | ## Choose a pathway<br>Find the right tennis program or support page for your needs. |
    | ![Step 2 icon](step2.png) | ## Register or enquire<br>Complete the form or contact the relevant team. |
    | ![Step 3 icon](step3.png) | ## Start playing<br>Join a club, event, or program. |

* * *

### `schedule-table`

Purpose: Structured table for events, venues, or program schedules.

When to use on Tennis NSW pages: Event schedules, competition calendars, training blocks, and venue opening information.

Content model:

    | Schedule Table |
    |---------------|
    | Date | Time | Event | Location |
    | 7 Feb 2026 | 9:00 AM | Regional clinic | Parramatta |
    | 22 Mar 2026 | 10:30 AM | Tournament day | Penrith |

* * *

### `quote-carousel`

Purpose: Rotating testimonial or quote cards. Used for player stories, coach stories, volunteer stories, and community impact.

When to use on Tennis NSW pages: Story-led landing pages, participation pages, and campaign pages.

Content model:

    | Quote Carousel |
    |---------------|
    | ## “Tennis has helped our club connect the community.”<br>— Club volunteer |
    | ## “The program made it easy to get started.”<br>— Parent |
    | ## “Regional support has been invaluable.”<br>— Coach |

* * *

### `stats-band`

Purpose: Bold metrics strip with 3–5 key numbers and short labels.

When to use on Tennis NSW pages: Campaign summaries, annual impact pages, participation overviews, and homepage highlights.

Content model:

    | Stats Band |
    |-----------|
    | 1,200+ | Clubs supported |
    | 45,000+ | Participants engaged |
    | 100+ | Programs delivered |

* * *

### `resource-list`

Purpose: List of downloadable documents, policy links, and helpful resources.

When to use on Tennis NSW pages: Resource hubs, governance pages, coaching pages, and club support pages.

* * *

### `contact-form`

Purpose: Contact or enquiry routing component with relevant fields and destination selection.

When to use on Tennis NSW pages: Contact pages, membership support pages, club support pages, and program enquiry pages.

* * *

## Lower Priority / Section-Specific Blocks

### `partner-strip`

Purpose: Horizontal strip of partner logos or sponsor marks.

When to use on Tennis NSW pages: Partner pages, sponsorship pages, and major campaign landing pages.

* * *

### `promo-banner`

Purpose: Inline time-limited promotional banner with bold headline, short copy, and CTA.

When to use on Tennis NSW pages: Registration campaigns, limited-time offers, seasonal programs, and event promotion.

* * *

### `map-embed`

Purpose: Embedded map or venue location block.

When to use on Tennis NSW pages: Venue pages, region pages, club pages, and event pages with location context.

* * *

### `venue-highlights`

Purpose: Venue feature section with image, title, key information, and CTA.

When to use on Tennis NSW pages: Ken Rosewall Arena pages, major venues, and facility spotlight pages.

* * *

### `faq-accordion`

Purpose: FAQ-specific accordion variant with clearer question/answer presentation.

When to use on Tennis NSW pages: Support pages, safeguarding pages, event FAQs, and program pages.

* * *

### `article-detail`

Purpose: Long-form editorial article body with category tag, publication date, author, social sharing, and related content suggestions.

When to use on Tennis NSW pages: Individual news article pages.

* * *

### `event-card`

Purpose: Single event teaser card for listings, with date, title, location, and CTA.

When to use on Tennis NSW pages: Event grids, related events sections, and homepage event callouts.

* * *

### `resource-card`

Purpose: Single resource teaser card with icon, title, summary, and download or view link.

When to use on Tennis NSW pages: Resource directories and downloads sections.

* * *

## Quick Reference: Block → Page Template Mapping

Block Homepage Clubs Play Our Work About Us News Events Regions Support First Nations Youth Hub

`hero` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`announcement-banner` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`anchor-tile-nav` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ — ✅ ✅  
`article-cards` ✅ — — — — ✅ — — — — —  
`event-listing` ✅ — — — — — ✅ — — — —  
`region-cards` ✅ — — — — — — ✅ — — —  
`support-cards` — ✅ ✅ ✅ ✅ — — — ✅ ✅ ✅  
`feature-grid` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`tabs` — ✅ ✅ ✅ ✅ — ✅ ✅ ✅ ✅ ✅  
`accordion` — ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`in-page-nav` — ✅ ✅ ✅ ✅ — ✅ ✅ ✅ ✅ ✅  
`schedule-table` — — — — — — ✅ — — — —  
`quote-carousel` ✅ — — — — ✅ — — — — —  
`stats-band` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ — ✅ ✅  
`partner-strip` ✅ — — — — — — — ✅ — —  
`map-embed` — ✅ — — — — ✅ ✅ — — —  
`faq-accordion` — ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`contact-form` — ✅ ✅ ✅ ✅ — — — ✅ ✅ ✅  
`search-results` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`venue-highlights` — — — — — — ✅ — — — —  
`resource-list` — ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  
`step-process` — ✅ ✅ ✅ ✅ — — — ✅ ✅ ✅  
`promo-banner` ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅

## Footer

Copyright 2026 Tennis Australia / Tennis NSW.