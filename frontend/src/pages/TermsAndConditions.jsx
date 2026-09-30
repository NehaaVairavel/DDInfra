import { motion } from "framer-motion";
import AnimatedGear from "@/components/AnimatedGear";

const TermsAndConditions = () => {
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
              Terms &amp; <span className="text-gradient">Conditions</span>
            </h1>
            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/20 rounded-full mx-auto" />
          </div>

          <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-8 md:p-14 border border-border/50 shadow-premium prose prose-slate prose-headings:font-display prose-headings:text-heading prose-headings:font-bold prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
            
            <section className="mb-10">
              <h2 className="text-2xl mb-4">Introduction</h2>
              <p>
                Welcome to DD Infra & CO. By accessing or using our website, services, or tools, you agree to comply with and be bound by the following Terms &amp; Conditions. If you do not agree with any part of these terms, please do not use our platform.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Our Services</h2>
              <p>
                DD Infra & CO is a platform that allows users to buy, sell, or enquire about heavy infrastructure equipment, spare parts, and machinery. We act as a platform that connects buyers and sellers and are not responsible for the accuracy or authenticity of the uploaded equipment details.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">User Responsibilities</h2>
              <p>
                Users must ensure that the information they provide (equipment details, contact details, documents, and images) is accurate. Any fraudulent activity, misleading information, or misuse of the platform may result in account suspension or permanent removal.
              </p>
              <ul className="list-disc pl-5 mt-4 space-y-2 text-muted-foreground">
                <li>Users are responsible for maintaining login confidentiality.</li>
                <li>Users must upload genuine equipment details only.</li>
                <li>Sellers must ensure the product is available before listing.</li>
                <li>Buyers should verify equipment condition before making payment.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Equipment Listings</h2>
              <p>
                When a user uploads an equipment listing, DD Infra & CO reviews the post. Approval or rejection is based on completeness, quality, and accuracy of the data. DD Infra & CO reserves the right to remove or reject any listing without prior notice if we find it misleading or inappropriate.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Cookie Policy</h2>
              <p>
                Our website uses cookies to improve user experience, analyze traffic, and enhance performance. By using our website, you consent to the use of cookies as outlined in our privacy guidelines.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Payments</h2>
              <p>
                DD Infra & CO does not collect or process payments directly for equipment transactions. All payments and financial dealings take place strictly between the buyer and seller. Users are advised to practice caution and verify the seller before making any payment.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Refund Policy</h2>
              <p>DD Infra & CO does not handle or control payments between buyers and sellers; we do not provide refunds for equipment purchases or deals. If you have subscribed to any paid service on DD Infra & CO, the respective service guidelines and policies will apply.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Hyperlinking Policy</h2>
              <p>You may link to our website under the following conditions:</p>
              <ol className="list-decimal pl-5 mt-4 space-y-2 text-muted-foreground">
                <li>The link should not misrepresent partnership or endorsement.</li>
                <li>You must not use DD Infra & CO's logo without written permission.</li>
                <li>The linking website must not contain harmful, illegal, or misleading content.</li>
              </ol>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Email Communication</h2>
              <p>
                By using DD Infra & CO, you agree to receive emails related to account activity, notifications, inquiries, and system updates. If you wish to stop receiving marketing emails, you can unsubscribe at any time.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Disclaimer</h2>
              <p>
                DD Infra & CO is not responsible for any losses, damages, disputes, or fraud that may occur between buyers and sellers. All equipment details, images, and documents are uploaded by users, and DD Infra & CO does not guarantee their accuracy. Buyers are strongly advised to inspect equipment physically before making payments.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl mb-4">Contact Us</h2>
              <p>
                If you have any questions regarding these Terms &amp; Conditions, you can contact us at:<br />
                <span className="font-bold text-heading">Email: Ddinfraandco@gmail.com</span>
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-border/50">
              <p className="font-bold text-heading text-lg">Agreement</p>
              <p>
                By using DD Infra & CO, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

