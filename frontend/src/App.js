import "@/App.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SiteProvider } from "@/context/SiteContext";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Wishlist from "@/pages/Wishlist";
import Checkout from "@/pages/Checkout";
import CheckoutAddress from "@/pages/CheckoutAddress";
import CheckoutPayment from "@/pages/CheckoutPayment";
import CheckoutSummary from "@/pages/CheckoutSummary";
import Order from "@/pages/Order";
import OrderSuccess from "@/pages/OrderSuccess";
import MyOrders from "@/pages/MyOrders";
import OrderDetails from "@/pages/OrderDetails";
import TrackOrder from "@/pages/TrackOrder";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { ForgotPassword } from "@/pages/PasswordRecovery";
import Account, { AccountOverview, AccountOrders, AccountAddresses, AccountSettings } from "@/pages/Account";

import AdminLogin from "@/pages/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminReferrals from "@/pages/admin/AdminReferrals";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminContactMessages from "@/pages/admin/AdminContactMessages";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminBanners from "@/pages/admin/AdminBanners";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminEmailLogs from "@/pages/admin/AdminEmailLogs";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminFAQ from "@/pages/admin/AdminFAQ";
import AdminReturns from "@/pages/admin/AdminReturns";
import AdminFlashSales from "@/pages/admin/AdminFlashSales";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminExport from "@/pages/admin/AdminExport";
import AdminStaff from "@/pages/admin/AdminStaff";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import OurStory from "@/pages/OurStory";
import FAQ from "@/pages/FAQ";
import ShippingPolicy from "@/pages/ShippingPolicy";
import ReturnPolicy from "@/pages/ReturnPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import ExchangePolicy from "@/pages/ExchangePolicy";
import SizeGuide from "@/pages/SizeGuide";
import Blog from "@/pages/Blog";
import Careers from "@/pages/Careers";
import Affiliate from "@/pages/Affiliate";
import ReferralProgram from "@/pages/ReferralProgram";
import Membership from "@/pages/Membership";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsAndConditions from "@/pages/TermsAndConditions";
import GiftCards from "@/pages/GiftCards";
import SEO from "@/components/SEO";
import WelcomePopup from "@/components/WelcomePopup";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AccountWallet from "./pages/account/AccountWallet";
import AccountReferrals from "./pages/account/AccountReferrals";

const LS_POPUP_KEY = "gs_popup_dismissed";

function WelcomePopupGate() {
  const { user, ready } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // Show only if: not signed in AND not previously dismissed
    if (!user && !localStorage.getItem(LS_POPUP_KEY)) {
      const timer = setTimeout(() => setShowPopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, ready]);

  if (!showPopup) return null;
  return <WelcomePopup onClose={() => setShowPopup(false)} />;
}

function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter>
              <SEO />
              <WelcomePopupGate />
              <Toaster position="top-center" theme="light" />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout/address" element={<ProtectedRoute><CheckoutAddress /></ProtectedRoute>} />
                <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPayment /></ProtectedRoute>} />
                <Route path="/checkout/summary" element={<ProtectedRoute><CheckoutSummary /></ProtectedRoute>} />
                <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                <Route path="/order/:id" element={<ProtectedRoute><Order /></ProtectedRoute>} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/our-story" element={<OurStory />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/exchange-policy" element={<ExchangePolicy />} />
                <Route path="/size-guide" element={<SizeGuide />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/affiliate" element={<Affiliate />} />
                <Route path="/referral-program" element={<ReferralProgram />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/gift-cards" element={<GiftCards />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/track-order/:id" element={<TrackOrder />} />

                {/* Account (user) */}
                <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>}>
                  <Route index element={<AccountOverview />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="addresses" element={<AccountAddresses />} />
                  <Route path="wishlist" element={<Wishlist />} />
                  <Route path="settings" element={<AccountSettings />} />
                     <Route path="referrals" element={<AccountReferrals/>} />
                    <Route path="wallet" element={<AccountWallet/>} />
                   
                     
                </Route>

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="referrals" element={<AdminReferrals />} />
                  <Route path="customers" element={<AdminCustomers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="messages" element={<AdminContactMessages />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="banners" element={<AdminBanners />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="email-logs" element={<AdminEmailLogs />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="faqs" element={<AdminFAQ />} />
                  <Route path="returns" element={<AdminReturns />} />
                  <Route path="flash-sales" element={<AdminFlashSales />} />
                  <Route path="newsletter" element={<AdminNewsletter />} />
                  <Route path="export" element={<AdminExport />} />
                  <Route path="staff" element={<AdminStaff />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </SiteProvider>
  );
}

export default App;
