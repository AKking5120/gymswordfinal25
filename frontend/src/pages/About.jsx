import LuxuryPage from "@/components/LuxuryPage";

export default function About() {
  return (
    <LuxuryPage title="About GymSword" breadcrumbs={[{ to: "/", label: "Home" }, { label: "About" }]}>
      <div className="prose-luxury space-y-12">
        <section className="max-w-3xl">
          <h2 className="text-2xl font-display uppercase font-black mb-4">Our Mission</h2>
          <p className="text-[15px] text-black/60 leading-[1.9]">
            GymSword was born from a singular vision — to create premium fitness apparel that bridges the gap
            between high-performance athletics and luxury fashion. We believe that what you wear during training
            should be crafted with the same precision and care as the finest fashion.
          </p>
        </section>

        <section className="max-w-3xl">
          <h2 className="text-2xl font-display uppercase font-black mb-4">The Brand</h2>
          <p className="text-[15px] text-black/60 leading-[1.9]">
            Every GymSword piece is engineered for athletes who demand more. Our fabrics are sourced from the
            world's finest mills, our cuts are refined through hundreds of iterations, and our quality standards
            are uncompromising. We don't follow trends — we set them.
          </p>
        </section>

        <section className="max-w-3xl">
          <h2 className="text-2xl font-display uppercase font-black mb-4">Quality First</h2>
          <p className="text-[15px] text-black/60 leading-[1.9]">
            From moisture-wicking performance fabrics to reinforced stitching, every detail is considered.
            Our collections are designed to transition seamlessly from the gym to the street, because style
            should never be sacrificed for performance.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-6 mt-16">
          {[
            { num: "10K+", label: "Athletes Trust Us" },
            { num: "500+", label: "Premium Products" },
            { num: "4.8★", label: "Customer Rating" },
          ].map((s) => (
            <div key={s.label} className="border border-black/10 p-8 text-center">
              <div className="text-3xl font-display font-black mb-2">{s.num}</div>
              <div className="text-[11px] uppercase tracking-[0.15em] text-black/50">{s.label}</div>
            </div>
          ))}
        </section>
      </div>
    </LuxuryPage>
  );
}
