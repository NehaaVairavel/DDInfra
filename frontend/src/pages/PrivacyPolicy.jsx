import { motion } from "framer-motion";
import AnimatedGear from "@/components/AnimatedGear";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen pt-28 pb-20 relative overflow-hidden bg-white">
      {/* Decorative Background */}
      <div className="absolute top-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute left-[5%] top-[20%] opacity-[0.02] pointer-events-none hidden lg:block">
        <AnimatedGear size={300} />
      </div>

      <div className="container-section relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-heading mb-4 tracking-tight">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/20 rounded-full mx-auto" />
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 md:p-14 border border-border/50 shadow-premium prose prose-slate prose-headings:font-display prose-headings:text-heading prose-headings:font-bold prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
            
            <section className="mb-10">
              <h2 className="text-2xl mb-4">Introduction</h2>
              <p>
                Welcome to DDInfra and Co. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Information We Collect</h2>
              <p>
                We may collect personal information such as name, phone number, email address, and any details you provide while submitting inquiries or listings. We may also collect non-personal data such as device information and website usage data.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                <li>Provide and improve our services</li>
                <li>Respond to inquiries and connect buyers and sellers</li>
                <li>Send updates, notifications, and service-related emails</li>
                <li>Maintain platform security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Information Sharing</h2>
              <p>
                DDInfra and Co does not sell or rent your personal information to third parties. Information may be shared only when required to connect buyers and sellers or comply with legal obligations.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Cookies</h2>
              <p>
                Our website uses cookies to enhance user experience, analyze traffic, and improve functionality. By using our website, you consent to the use of cookies.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Third-Party Links</h2>
              <p>
                Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">User Responsibility</h2>
              <p>
                Users are responsible for ensuring that the information they provide is accurate. Please avoid sharing sensitive personal or financial details on public listings.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Changes to Policy</h2>
              <p>
                DDInfra and Co reserves the right to update this Privacy Policy at any time. Changes will be reflected on this page.
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-border/50">
              <h2 className="text-2xl mb-4">Contact Us</h2>
              <p>
                If you have any questions regarding this Privacy Policy, you can contact us at:<br />
                <span className="font-bold text-heading">Email: [DDINFRA_EMAIL]</span>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
