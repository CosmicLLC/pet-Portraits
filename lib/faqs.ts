// Single source of truth for the homepage FAQ. The visible accordion and the
// FAQPage JSON-LD must match exactly or Google flags the structured data as
// spam. Keep `q` and `a` in sync with anything user-facing.

export interface Faq {
  q: string;
  a: string;
}

export const HOME_FAQS: Faq[] = [
  {
    q: "How long does it take?",
    a: "Almost instantly. Once you upload your photo and choose a style, your portrait is generated in 20–30 seconds.",
  },
  {
    q: "What photo works best?",
    a: "A clear, well-lit photo of your pet from the front works best. Make sure their face is fully visible and they're the primary subject. Natural lighting and a simple background give the best results.",
  },
  {
    q: "Can I get a refund if I'm not happy?",
    a: "Absolutely. We offer a 100% satisfaction guarantee. If you're not happy with your portrait, we'll redo it for free — or give you a full refund, no questions asked.",
  },
  {
    q: "What sizes are available?",
    a: "Three physical options: an 11×14 display print (fine art paper on a backing board, ready to slide into your own frame), an 11×14 mounted print (gallery-matted with a window mount for a finished look), and an 8×12 framed canvas (ready to hang). Digital downloads are full-resolution and suitable for printing at any size.",
  },
  {
    q: "Do you ship internationally?",
    a: "Canvas prints currently ship within the United States only. Digital downloads are delivered instantly by email, anywhere in the world, within seconds of purchase.",
  },
  {
    q: "Can I request a custom style?",
    a: "We currently offer four styles: Watercolor, Oil Painting, Renaissance, and Line Art. Custom style requests are coming soon — email us at cosmic.company.llc@gmail.com if you have something specific in mind.",
  },
  {
    q: "Can I create a pet memorial portrait?",
    a: "Absolutely. Many of our customers use Paw Masterpiece to create heartfelt memorial portraits. Any photo of your pet — no matter how old — can be turned into a lasting piece of art.",
  },
];
