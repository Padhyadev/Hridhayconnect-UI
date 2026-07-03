import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

export function BrandStory() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const imgY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section ref={ref} className="relative py-32 md:py-48 px-6 md:px-12 max-w-[1600px] mx-auto z-20 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* Left - Story Text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col"
        >
          <span className="text-[var(--color-primary)] font-medium tracking-[0.2em] uppercase text-xs mb-8 flex items-center gap-4">
            <span className="w-12 h-[1px] bg-[var(--color-primary)]"></span>
            Our Philosophy
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif text-[var(--color-dark-text)] leading-[1.05] mb-8 font-light tracking-tight">
            Crafted for the <br /> mindful, nurtured <br />
            by <span className="text-[var(--color-primary)] italic font-medium">nature.</span>
          </h2>
          <p className="text-lg md:text-xl text-[var(--color-dark-text)]/70 font-light leading-relaxed mb-8 max-w-lg text-justify">
            At Hridhay Connect, we believe that true luxury lies in absolute purity. Our formulations seamlessly blend ancient holistic traditions with modern meticulous botanical science.
          </p>
          <p className="text-lg md:text-xl text-[var(--color-dark-text)]/70 font-light leading-relaxed mb-12 max-w-lg text-justify">
            Every ingredient is ethically harvested, ensuring we give back to the earth as much as we receive. This is more than skincare—it's a daily ritual of reverence.
          </p>
          <div className="flex items-center gap-6">
            <img src="/Image/CEO.jpg" className="w-20 h-20 rounded-full object-cover grayscale opacity-90 border-[3px] border-[var(--color-beige)]" alt="Founder Portrait" loading="lazy" decoding="async" />
            <div>
              <p className="font-serif text-2xl text-[var(--color-dark-text)]">Ashish Shah</p>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-primary)] mt-1">Founding Director</p>
            </div>
          </div>
        </motion.div>

        {/* Right - Asymmetrical Images & Shapes */}
        <div className="relative h-[60vh] md:h-[90vh] w-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full md:w-[80%] rounded-t-[15rem] rounded-b-[2rem] overflow-hidden relative shadow-2xl shadow-[var(--color-dark-text)]/10"
          >
            <motion.img
              style={{ y: imgY, scale: 1.2 }}
              src="/HomePageimage/Ayurvedic.jpg"
              alt="Botanical setup"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Soft inner glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-dark-text)]/20 to-transparent pointer-events-none" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[10%] left-[-5%] w-[45%] md:w-[50%] aspect-[4/3] rounded-3xl overflow-hidden border-8 border-[var(--color-background)] shadow-2xl"
          >
            <img
              src="/Instagram/MangoSlice.webp"
              alt="Lavender field texture"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover mix-blend-luminosity brightness-90 saturate-50 hover:mix-blend-normal transition-all duration-700"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
