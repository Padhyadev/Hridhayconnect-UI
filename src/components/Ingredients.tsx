import { motion, useScroll, useTransform } from "motion/react";
import { Leaf, Droplet, Sparkles, ShieldCheck } from "lucide-react";
import { useRef } from "react";

export function Ingredients() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  const benefits = [
    {
      icon: <Leaf className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Wild-Harvested",
      desc: "Sourced sustainably straight from the untouched earth."
    },
    {
      icon: <Droplet className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Cellular Hydration",
      desc: "Micro-molecular formulas that penetrate deep into the skin's barrier."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Radiant Vitality",
      desc: "Mineral-rich blends designed to naturally restore your luminosity."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />,
      title: "Clinically Pure",
      desc: "Rigorously tested, free from synthetic disruption."
    }
  ];

  return (
    <section ref={ref} className="relative py-16 md:py-24 px-6 md:px-12 max-w-[1600px] mx-auto overflow-hidden">
      {/* Background Soft Blobs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <motion.div style={{ y: y1 }} className="absolute top-[20%] left-[-10%] w-[50vw] aspect-square bg-[var(--color-secondary)]/5 rounded-full blur-[100px]" />
        <motion.div style={{ y: y2 }} className="absolute bottom-[20%] right-[-10%] w-[40vw] aspect-square bg-[var(--color-accent)]/5 rounded-full blur-[120px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Left Side: Editorial Typography & Features */}
        <div className="flex flex-col relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[var(--color-secondary)] font-medium tracking-[0.2em] uppercase text-xs mb-6 flex items-center gap-4">
              <span className="w-10 h-[1px] bg-[var(--color-secondary)]"></span>
              The Alchemy
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-[var(--color-dark-text)] leading-[1.1] mb-8 drop-shadow-sm font-light">
              Purity in <br />
              <span className="italic text-[var(--color-primary)]">Every Element.</span>
            </h2>
            <p className="text-lg md:text-xl text-[var(--color-dark-text)]/70 font-light max-w-lg leading-relaxed mb-16 text-justify">
              We meticulously select ingredients that harmonize with your body's natural ecosystem. No compromises, only nature's finest extracts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-16">
            {benefits.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                key={i}
                className="group"
              >
                <div className="mb-6 inline-flex p-4 rounded-full border border-[var(--color-primary)]/10 bg-white/50 backdrop-blur-sm shadow-sm group-hover:bg-[var(--color-primary)]/10 group-hover:scale-110 transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="text-xl font-serif text-[var(--color-dark-text)] mb-3">{item.title}</h3>
                <p className="text-[var(--color-dark-text)]/60 text-sm leading-relaxed font-light">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Floating Composition */}
        <div className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center">
          <motion.div
            style={{ y: y1 }}
            className="absolute z-20 w-[60%] aspect-[3/4] right-[0%] top-[10%] rounded-t-[10rem] rounded-b-[2rem] overflow-hidden border border-white/50 shadow-2xl backdrop-blur-sm"
          >
            <img
              src="/HomePageimage/LargeNeem.jpg"
              alt="Botanical extracts"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover scale-110"
            />
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            className="absolute z-30 w-[45%] aspect-square left-[5%] bottom-[15%] rounded-full overflow-hidden border-8 border-[var(--color-background)] shadow-2xl"
          >
            <img
              src="/HomePageimage/TeaIngredientscircle.jpg"
              alt="Texture"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover mix-blend-overlay opacity-80"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
