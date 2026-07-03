import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

interface CollectionProductCardProps {
  key?: any;
  p: {
    name: string;
    price: string;
    img: string;
    desc: string;
    tag?: string;
  };
  i: number;
}

function CollectionProductCard({ p, i }: CollectionProductCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]); // Parallax scrolling effect

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1.2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="group cursor-pointer relative"
      onClick={() => {
        if (i === 0) window.location.hash = "#product-amethyst-revival-serum";
        else if (i === 1) window.location.hash = "#product-lavender-sleep-mask";
        else if (i === 2) window.location.hash = "#product-plum-essence-toner";
      }}
    >
      <motion.div style={{ y: i === 1 ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : y) : 0 }} className="w-full aspect-square bg-[var(--color-beige)]/40 rounded-[2rem] overflow-hidden mb-8 relative shadow-lg shadow-[var(--color-dark-text)]/5 hover:shadow-2xl hover:shadow-[var(--color-primary)]/20 transition-shadow duration-[1s]">
        <img
          src={p.img}
          alt={p.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-[2s] ease-out brightness-95 group-hover:brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark-text)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/*
        // NOTE: To re-add the product tag (e.g. "Deep Purifying" or "Bestseller") in the future, uncomment this block:
        {p.tag && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider text-[var(--color-primary)] z-10 shadow-sm">
            {p.tag}
          </div>
        )}
        */}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 ease-out z-20">
          <button className="bg-[var(--color-primary)]/90 backdrop-blur-md text-white px-8 py-3 rounded-full text-xs font-medium uppercase tracking-[0.1em] hover:bg-white hover:text-[var(--color-primary)] transition-colors">
            Add to Cart
          </button>
        </div>
      </motion.div>
      <div className="flex justify-between items-start pt-2 border-t border-[var(--color-dark-text)]/10">
        <div className="pr-4">
          <h3 className="text-xl md:text-2xl font-serif text-[var(--color-dark-text)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">{p.name}</h3>
          <p className="text-sm text-[var(--color-dark-text)]/60 font-light">{p.desc}</p>
        </div>
        <span className="text-lg text-[var(--color-primary)] font-serif">{p.price}</span>
      </div>
    </motion.div>
  );
}

// export function FeaturedCollection() {
//   const products = [
//     {
//       name: "Amethyst Revival Serum",
//       price: "$85",
//       img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
//       desc: "Antioxidant rich restorative drops",
//       tag: "Best Seller"
//     },
//     {
//       name: "Lavender Sleep Mask",
//       price: "$65",
//       img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop",
//       desc: "Overnight cellular repair cream",
//       tag: "New"
//     },
//     {
//       name: "Plum Essence Toner",
//       price: "$48",
//       img: "https://images.unsplash.com/photo-1629198728070-7815cf1be5e8?q=80&w=800&auto=format&fit=crop",
//       desc: "Balancing & soothing floral water"
//     }
//   ];

//   return (
//     <section id="featured" className="py-16 md:py-24 px-2 sm:px-4 md:px-12 max-w-[1600px] mx-auto relative">
//       <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 md:mb-24 relative z-10">
//         <div>
//           <span className="text-[var(--color-primary)] font-medium tracking-[0.2em] uppercase text-xs sm:text-sm mb-6 flex items-center gap-4">
//             <span className="w-8 md:w-12 h-[1px] bg-[var(--color-primary)]"></span>
//             The Reserve Collection
//           </span>
//           <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif text-[var(--color-dark-text)] leading-[1.1] font-light">
//             Elevate Your <br />
//             <span className="italic text-[var(--color-secondary)] font-serif relative">
//               Rituals
//               <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-[var(--color-primary)]/30"></div>
//             </span>
//           </h2>
//         </div>
//         <button className="self-start md:self-end text-xs sm:text-sm font-medium tracking-[0.1em] uppercase text-[var(--color-dark-text)] hover:text-[var(--color-primary)] transition-colors relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[1px] after:bg-[var(--color-dark-text)]/30 hover:after:bg-[var(--color-primary)] hover:after:scale-x-100 after:transition-all after:origin-left mt-10 md:mt-0 pb-1 flex items-center gap-2 group cursor-pointer">
//           View Masterpieces <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
//         </button>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
//         {products.map((p, i) => (
//           <CollectionProductCard key={i} p={p} i={i} />
//         ))}
//       </div>
//     </section>
//   );
// }
