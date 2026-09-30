import { useEffect, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { AuthProvider } from "@/context/AuthContext";
import { useProductStore } from "@/store/useProductStore";
import { usePartStore } from "@/store/usePartStore";

import PublicLayout from "./components/PublicLayout";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";

import { lazyWithRetry as lazy } from "./utils/lazyWithRetry";

const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Parts = lazy(() => import("./pages/Parts"));
const Contact = lazy(() => import("./pages/Contact"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PartDetail = lazy(() => import("./pages/PartDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AddProduct = lazy(() => import("./pages/admin/AddProduct"));
const EditProduct = lazy(() => import("./pages/admin/EditProduct"));
const AdminEnquiries = lazy(() => import("./pages/admin/AdminEnquiries"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery"));
const Login = lazy(() => import("./pages/admin/Login"));
const AdminParts = lazy(() => import("./pages/admin/AdminParts"));
const AddPart = lazy(() => import("./pages/admin/AddPart"));
const EditPart = lazy(() => import("./pages/admin/EditPart"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminHeroMedia = lazy(() => import("./pages/admin/AdminHeroMedia"));

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data so route navigation is instant and doesn't re-hit the API.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

const App = () => {
  const initProductStore = useProductStore((state) => state.init);
  const initPartStore = usePartStore((state) => state.init);

  useEffect(() => {
    initProductStore();
    initPartStore();
  }, [initProductStore, initPartStore]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/parts" element={<Parts />} />
                    <Route path="/part/:id" element={<PartDetail />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/contact-us" element={<Contact />} />
                    <Route path="/terms" element={<TermsAndConditions />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                  
                  <Route path="/admin/login" element={<Login />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="add-product" element={<AddProduct />} />
                      <Route path="edit-product/:id" element={<EditProduct />} />
                      <Route path="parts" element={<AdminParts />} />
                      <Route path="add-part" element={<AddPart />} />
                      <Route path="edit-part/:id" element={<EditPart />} />
                      <Route path="enquiries" element={<AdminEnquiries />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="media" element={<AdminGallery />} />
                      <Route path="hero-media" element={<AdminHeroMedia />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
