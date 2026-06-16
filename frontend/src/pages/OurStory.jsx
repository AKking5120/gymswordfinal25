import LuxuryPage from "@/components/LuxuryPage";

export default function OurStory() {
  return (
    <LuxuryPage title="Our Story" breadcrumbs={[{ to: "/", label: "Home" }, { label: "Our Story" }]}>
      <div className="prose-luxury max-w-3xl space-y-10">
        <section>
          <h2 className="text-2xl font-display uppercase font-black mb-4">The Beginning</h2>
          <p className="text-[14px] text-black/60 leading-[1.9]">
            GymSword was founded with a singular belief: athletes deserve clothing that performs as hard as they do,
            without compromising on style. What started as a vision to bridge the gap between performance and luxury
            has grown into a movement trusted by thousands of athletes across India.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display uppercase font-black mb-4">The Philosophy</h2>
          <p className="text-[14px] text-black/60 leading-[1.9]">
            We draw inspiration from the discipline of training and the precision of luxury fashion. Every piece we
            create is designed to empower — to make you feel as confident in the gym as you do in life. Performance
            meets aesthetics. Sweat meets sophistication.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-display uppercase font-black mb-4">The Future</h2>
          <p className="text-[14px] text-black/60 leading-[1.9]">
            We're just getting started. From fabric innovation to sustainable manufacturing, we're constantly pushing
            boundaries to create the world's finest athletic apparel. Join us as we redefine what it means to train
            in style.
          </p>
        </section>
      </div>
    </LuxuryPage>
  );
}
