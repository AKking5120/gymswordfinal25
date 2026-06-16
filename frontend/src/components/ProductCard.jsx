import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { resolveImage, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { PRODUCT } from "@/constants/testIds";
import QuickView from "@/components/QuickView";

export default function ProductCard({ product }) {
  const { has, toggle } = useWishlist();
  const { user } = useAuth();
  const { settings } = useSite();
  const navigate = useNavigate();

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  const img = product.images?.[0]?.url ? resolveImage(product.images[0].url) : PRODUCT_IMAGE_PLACEHOLDER;
  const isOnSale = product.compare_at_price && product.compare_at_price > product.price;
  const comingSoon = settings.coming_soon;
  const showPrices = settings.show_prices !== false;
  const sizes = product.sizes || [];

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || user === false) { navigate("/login"); return; }
    toggle(product.id);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <div
        className="group relative bg-white rounded-[18px] shadow-[0_2px_20px_rgba(0,0,0,0.07)] overflow-hidden"
        data-testid={PRODUCT.card(product.id)}
      >
        {/* ── IMAGE AREA ── */}
        <Link to={`/product/${product.id}`} className="block relative">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f7]">
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              data-testid={PRODUCT.cardImage(product.id)}
              onError={(e) => { e.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER; }}
              className={`w-full h-full object-cover transition-all duration-700 ${
                comingSoon ? "scale-110 blur-[12px]" : "group-hover:scale-105"
              }`}
            />

            {comingSoon && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <img src="/images/287914795.png" alt="" className="w-14 h-14 object-contain drop-shadow-lg" />
                <div className="mt-2 text-[10px] text-white/70 tracking-[0.25em] uppercase drop-shadow-lg">Coming Soon</div>
              </div>
            )}

            <div className="absolute top-3 left-3 z-10 bg-white/80 backdrop-blur-sm text-black text-[9px] font-bold tracking-[1.5px] px-3 py-1.5 rounded-full uppercase">
              GymSword
            </div>

            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:bg-white transition"
              aria-label="Wishlist"
              data-testid={`wishlist-toggle-${product.id}`}
            >
              <Heart size={15} className="text-black" fill={has(product.id) ? "#000" : "none"} />
            </button>

            {/* QUICK VIEW BUTTON — hover */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10 px-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={handleQuickView}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-md text-black text-[10px] font-bold uppercase tracking-[2px] px-5 py-2.5 rounded-xl hover:bg-white shadow-lg transition-all duration-300"
              >
                <Eye size={13} />
                Quick View
              </button>
            </div>
          </div>
        </Link>

        {/* ── PRODUCT INFO ── */}
        <div className="px-4 pb-5 pt-4">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/product/${product.id}`} className="flex-1 min-w-0">
              <h3 className="text-[16px] font-bold text-black leading-snug">{product.name}</h3>
            </Link>
            {comingSoon && (
              <span className="flex-shrink-0 bg-black text-white text-[8px] font-bold tracking-[1.5px] px-2.5 py-1 rounded-full uppercase whitespace-nowrap">
                Coming Soon
              </span>
            )}
          </div>

          {product.short_description && (
            <p className="text-[10px] uppercase tracking-[1.5px] text-gray-400 mt-1 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {sizes.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {sizes.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(s);
                    setQuickViewOpen(true);
                  }}
                  className="w-[34px] h-[34px] rounded-full text-[11px] font-semibold flex items-center justify-center bg-white border-[1.5px] border-gray-200 text-gray-500 hover:border-black hover:text-black transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between mt-4">
            <div>
              {comingSoon || !showPrices ? (
                <div className="text-[10px] uppercase tracking-[1.5px] text-gray-400 font-semibold">
                  PRICE REVEALING SOON
                </div>
              ) : (
                <div>
                  <div className="text-[10px] uppercase tracking-[1.5px] text-gray-400 font-semibold">
                    {formatPrice(product.price)}
                  </div>
                  {isOnSale && (
                    <div className="text-[9px] text-gray-400 line-through mt-0.5">
                      {formatPrice(product.compare_at_price)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="bg-black text-white text-[9px] font-bold tracking-[1px] px-3 py-1.5 rounded-[8px] uppercase">
              Premium
            </span>
          </div>
        </div>
      </div>

      {quickViewOpen && (
        <QuickView product={product} initialSize={selectedSize} onClose={() => { setQuickViewOpen(false); setSelectedSize(""); }} />
      )}
    </>
  );
}
