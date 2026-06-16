import LuxuryPage from "@/components/LuxuryPage";

export default function Blog() {
  const posts = [
    { title: "The Future of Premium Athleisure", date: "June 2025", excerpt: "How luxury fitness apparel is redefining modern fashion and performance wear." },
    { title: "Building a Training Wardrobe", date: "May 2025", excerpt: "Essential pieces every athlete needs for a high-performance training wardrobe." },
    { title: "Fabric Innovation in Sportswear", date: "April 2025", excerpt: "The science behind moisture-wicking, anti-odor, and compression technologies." },
  ];

  return (
    <LuxuryPage title="Blog" breadcrumbs={[{ to: "/", label: "Home" }, { label: "Blog" }]}>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((p, i) => (
          <article key={i} className="border border-black/10 group cursor-pointer hover:border-black/30 transition-all">
            <div className="aspect-[4/3] bg-[#f5f5f7] flex items-center justify-center">
              <span className="text-black/10 text-[48px] font-display font-black">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="p-6">
              <p className="text-[10px] uppercase tracking-[0.15em] text-black/40 mb-2">{p.date}</p>
              <h3 className="text-[15px] font-bold mb-2 group-hover:underline">{p.title}</h3>
              <p className="text-[13px] text-black/50 leading-[1.7]">{p.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </LuxuryPage>
  );
}
