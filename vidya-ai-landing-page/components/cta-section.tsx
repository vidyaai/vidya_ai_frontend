"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mail, X, User, MessageSquare } from "lucide-react"
import emailjs from "@emailjs/browser"

export function CTASection() {
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [sending, setSending] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null)

  const handleContactSales = () => {
    setContactModalOpen(true)
    setSubmitStatus(null)
  }

  const handleCloseModal = () => {
    setContactModalOpen(false)
    setFormData({ name: "", email: "", message: "" })
    setSubmitStatus(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSubmitStatus(null)

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_3qtt4eu"
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_xgigp3g"
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "15XEZx-YXn86POgyR"

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: "pingakshya@vidyaai.co",
      }

      await emailjs.send(serviceId, templateId, templateParams, publicKey)

      setSubmitStatus("success")
      setTimeout(() => {
        handleCloseModal()
      }, 2000)
    } catch (error) {
      console.error("EmailJS Error:", error)
      setSubmitStatus("error")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-2 text-foreground">Contact Sales</h2>
            <p className="text-muted-foreground mb-6">Get in touch with our team to learn more about Vidya AI</p>

            {submitStatus === "success" && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm">
                  ✓ Message sent successfully! We'll get back to you soon.
                </p>
              </div>
            )}

            {submitStatus === "error" && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  ✗ Failed to send message. Please try again or email us directly.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Email *</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Message *</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="flex-1 bg-foreground text-background hover:bg-foreground/90">
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
            Ready to transform your institution?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join leading universities already using Vidya AI to enhance learning outcomes and save thousands of hours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 h-12 text-base">
              Request Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleContactSales}
              className="px-8 h-12 text-base border-border hover:bg-secondary bg-transparent"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Sales
            </Button>
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-card border border-border inline-block">
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">Contact:</span>{" "}
              <a href="mailto:pingakshya@vidyaai.co" className="text-accent hover:underline">
                pingakshya@vidyaai.co
              </a>{" "}
              •{" "}
              <a href="tel:+14692379220" className="text-accent hover:underline">
                +1-469-237-9220
              </a>
            </p>
            <p className="text-muted-foreground mt-2">
              <a
                href="https://www.vidyaai.co"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                www.vidyaai.co
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
