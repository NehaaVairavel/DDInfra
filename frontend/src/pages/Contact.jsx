import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Send, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedGear from "@/components/AnimatedGear";
import contactService from "@/services/contactService";
import settingsService from "@/services/settingsService";
import { toast } from "sonner";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5 } 
  }
};

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "", email: "" });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.get();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.submit({
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message
      });
      setSubmitted(true);
      toast.success("Message delivered to our team!");
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: "", phone: "", message: "", email: "" });
      }, 4000);
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses =
    "w-full bg-white/70 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl px-3 py-2.5 text-sm text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 hover:border-primary/30 transition-all duration-300";

  return (
    <div className="min-h-screen pt-[72px] relative overflow-hidden bg-white flex flex-col">
      <div className="absolute top-[5%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute left-[8%] top-[15%] opacity-[0.03] pointer-events-none hidden lg:block">
        <AnimatedGear size={280} />
      </div>

      <div className="flex-1 flex flex-col justify-center pt-4 md:pt-6 pb-8 md:pb-10 relative z-10">
        <div className="container-section">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-2xl mx-auto mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-black text-heading mb-2 heading-decorated tracking-tight">
            Get in <span className="text-gradient drop-shadow-sm">Touch</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[520px] mx-auto mt-2 font-semibold leading-relaxed">Ready to discuss your heavy equipment needs? Our dedicated team is here to assist you globally.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch mt-6 md:mt-8">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="lg:col-span-5 h-full">
            <div className="card-premium rounded-2xl p-5 md:p-8 border-accent-left relative overflow-hidden h-full flex flex-col justify-between">
               <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none"><AnimatedGear size={200} className="[animation-duration:30s]" /></div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-heading mb-4 relative z-10">Contact Details</h2>
                <div className="flex flex-col gap-5 relative z-10">
                {[
                  {
                    icon: MapPin,
                    title: "Corporate Office",
                    content: <p className="text-sm font-medium text-muted-foreground mt-1">No. 1104, 200 Feet Radial Road,<br />Old Pallavaram</p>,
                  },
                  {
                    icon: Phone,
                    title: "Phone & WhatsApp",
                    content: (
                      <div className="mt-2 flex flex-col gap-2">
                    <a href="tel:+919342429045" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors block">🇮🇳 India: 93424 29045</a>
                      <a href="mailto:Ddinfraandco@gmail.com" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors block">📧 Email: Ddinfraandco@gmail.com</a>
                      <a href={`https://wa.me/${settings?.whatsapp || "919342429045"}`} className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors block">💬 WhatsApp: 93424 29045</a>
                      </div>
                    ),
                  },
                  {
                    icon: Mail,
                    title: "Email Address",
                    content: <a href="mailto:Ddinfraandco@gmail.com" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors mt-1 block">Ddinfraandco@gmail.com</a>,
                  },
                ].map((item, i) => (
                  <motion.div key={item.title} variants={staggerItem} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary transition-all duration-400"><item.icon size={18} className="text-primary group-hover:text-white transition-colors duration-400" /></div>
                    <div className="pt-0"><h3 className="font-display font-bold text-heading text-base">{item.title}</h3>{item.content}</div>
                  </motion.div>
                ))}
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-border/50 relative z-10">
                 <a href="https://wa.me/919342429045" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-display font-bold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-400"><MessageCircle size={18} /> WhatsApp Support</a>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-7 h-full">
            <div className="card-premium rounded-2xl p-5 md:p-8 bg-white/60 backdrop-blur-xl h-full flex flex-col">
              <div className="mb-6"><h2 className="text-xl font-display font-bold text-heading">Send us a message</h2><p className="text-sm text-muted-foreground mt-1">Fill out the form below and our sales representatives will get back to you within 24 hours.</p></div>
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"><span className="text-primary text-4xl">✓</span></div>
                  <h3 className="text-2xl text-heading font-display font-extrabold mb-2">Message Delivered</h3>
                  <p className="text-muted-foreground">Thank you for contacting us. We will reach out shortly.</p>
                </motion.div>
              ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10 flex-1 justify-between">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-heading ml-1 mb-1 block uppercase">Your Name</label><input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} /></div>
                        <div><label className="text-[10px] font-bold text-heading ml-1 mb-1 block uppercase">Phone Number</label><input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClasses} type="tel" /></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-heading ml-1 mb-1 block uppercase">Email Address</label><input required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} type="email" /></div>
                      <div><label className="text-[10px] font-bold text-heading ml-1 mb-1 block uppercase">Message</label><textarea required placeholder="Message..." value={form.message} rows={4} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${inputClasses} resize-none`} /></div>
                    </div>
                    <button disabled={loading} type="submit" className="mt-4 text-white font-display font-bold py-3.5 rounded-xl btn-cta flex items-center justify-center gap-2 group w-full">{loading ? "Sending..." : "Send Message"}</button>
                  </form>
              )}
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
